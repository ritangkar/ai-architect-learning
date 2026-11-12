import { DB_NAME, KEY_PATH, STORES, type KV, type StoreName } from './types';
import { CURRENT_SCHEMA_VERSION } from './migrations';

/** In-memory store: used for session-only mode and in tests. */
export function memoryKV(): KV {
  const data = new Map<StoreName, Map<string, any>>(STORES.map((s) => [s, new Map()]));
  const kp = (s: StoreName, rec: any) => String(rec[KEY_PATH[s]]);
  return {
    mode: 'session',
    async getAll(s) { return structuredClone([...data.get(s)!.values()]); },
    async get(s, k) { const v = data.get(s)!.get(k); return v === undefined ? undefined : structuredClone(v); },
    async put(s, r) { data.get(s)!.set(kp(s, r), structuredClone(r)); },
    async putMany(s, rs) { for (const r of rs) data.get(s)!.set(kp(s, r), structuredClone(r)); },
    async delete(s, k) { data.get(s)!.delete(k); },
    async clear(s) { data.get(s)!.clear(); },
  };
}

function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error ?? new Error('IndexedDB request failed')); });
}
function done(tx: IDBTransaction): Promise<void> {
  return new Promise((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error ?? new Error('IndexedDB transaction failed')); tx.onabort = () => rej(tx.error ?? new Error('IndexedDB transaction aborted')); });
}

/** IndexedDB-backed store, database `architect-lab`, schema v1. Rejects if IndexedDB is missing, blocked or errors. */
export async function openIdbKV(factory: IDBFactory | undefined = (globalThis as any).indexedDB, timeoutMs = 4000): Promise<KV> {
  if (!factory) throw new Error('IndexedDB is not available in this browser context');
  const open = new Promise<IDBDatabase>((res, rej) => {
    let r: IDBOpenDBRequest;
    try { r = factory.open(DB_NAME, CURRENT_SCHEMA_VERSION); } catch (e) { rej(e); return; }
    r.onupgradeneeded = () => {
      const db = r.result;
      // v1: create every store. Future versions add `if (old < 2) {...}` blocks here, mirrored by data migrations in migrations.ts.
      for (const s of STORES) if (!db.objectStoreNames.contains(s)) db.createObjectStore(s, { keyPath: KEY_PATH[s] });
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error ?? new Error('IndexedDB open failed'));
    r.onblocked = () => rej(new Error('IndexedDB open was blocked'));
  });
  const timeout = new Promise<never>((_, rej) => setTimeout(() => rej(new Error('IndexedDB open timed out')), timeoutMs));
  const db = await Promise.race([open, timeout]);
  const store = (s: StoreName, mode: IDBTransactionMode) => { const tx = db.transaction(s, mode); return { tx, os: tx.objectStore(s) }; };
  return {
    mode: 'persistent',
    async getAll(s) { return req(store(s, 'readonly').os.getAll()); },
    async get(s, k) { return req(store(s, 'readonly').os.get(k)); },
    async put(s, r) { const { tx, os } = store(s, 'readwrite'); os.put(r); await done(tx); },
    async putMany(s, rs) { const { tx, os } = store(s, 'readwrite'); for (const r of rs) os.put(r); await done(tx); },
    async delete(s, k) { const { tx, os } = store(s, 'readwrite'); os.delete(k); await done(tx); },
    async clear(s) { const { tx, os } = store(s, 'readwrite'); os.clear(); await done(tx); },
  };
}

export interface OpenResult { kv: KV; mode: 'persistent' | 'session'; error?: string }
/** Never throws: falls back to session-only mode with the reason (AC-F16-2). */
export async function openStorage(factory?: IDBFactory | undefined | null): Promise<OpenResult> {
  try {
    const kv = await openIdbKV(factory === null ? undefined : factory ?? (globalThis as any).indexedDB);
    return { kv, mode: 'persistent' };
  } catch (e: any) {
    return { kv: memoryKV(), mode: 'session', error: String(e?.message ?? e) };
  }
}
