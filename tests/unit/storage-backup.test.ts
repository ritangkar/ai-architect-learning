import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { IDBFactory } from 'fake-indexeddb';
import { memoryKV, openStorage } from '../../src/lib/storage/kv';
import { readSnapshot, writeSnapshot, replaceSafely } from '../../src/lib/storage/snapshot';
import { CURRENT_SCHEMA_VERSION, MIGRATIONS, runMigrations } from '../../src/lib/storage/migrations';
import { emptySnapshot, type Snapshot } from '../../src/lib/storage/types';
import { buildExport, parseImport, mergeSnapshots, backupReminder, canonicalJson, exportFilename, validateShape } from '../../src/lib/backup';
import { deriveAll } from '../../src/lib/engine/mastery';
import { att, at, CFG, MINI } from './helpers';

const NOW = '2026-03-01T10:00:00.000Z';
const topics = MINI.topics;
function snap(n: number, prefix = 'a', extra: Partial<Snapshot> = {}): Snapshot {
  return {
    ...emptySnapshot(),
    attempts: Array.from({ length: n }, (_, i) => att({ id: `${prefix}${i}`, score: (i % 5) / 4, itemType: i % 2 ? 'scenario' : 'mcq', topics: [topics[i % 4].id], competencies: [topics[i % 4].comps[0]], timestamp: at(1 + i, 1), confidence: (i % 5) + 1 })),
    cardState: [{ id: 'card:K1', kind: 'card', refId: 'K1', topicId: 'T1.1.1', box: 2, dueAt: NOW, reviews: 1, lapses: 0, updatedAt: NOW }],
    caseProgress: [{ caseId: 'CS-001', viewedSections: ['facts'], updatedAt: NOW }],
    notes: [{ id: 'n1', kind: 'note', refId: 'T1.1.1', data: { text: 'hello' }, updatedAt: NOW }],
    profile: { key: 'profile', assessmentRuns: [], updatedAt: NOW },
    settings: { key: 'settings', theme: 'dark', reducedMotion: 'system', density: 'comfortable', showStreak: false, defaultDepth: 'auto', sessionMinutes: 120, updatedAt: NOW },
    ...extra,
  };
}
const derive = (s: Snapshot) => deriveAll(s.attempts, topics, ['C02', 'C03'], CFG);
const opts = { contentVersion: '0.3.0', installId: 'inst-1', now: NOW };

describe('F16 persistence', () => {
  it('AC-F16-1: data survives closing and reopening the database', async () => {
    const factory = new IDBFactory();
    const a = await openStorage(factory);
    expect(a.mode).toBe('persistent');
    await a.kv.putMany('attempts', snap(3).attempts);
    await a.kv.put('settings', snap(1).settings);
    const b = await openStorage(factory); // "reload"
    expect(b.mode).toBe('persistent');
    expect((await b.kv.getAll('attempts')).length).toBe(3);
    expect((await b.kv.get('settings', 'settings')).theme).toBe('dark');
  });
  it('attempts are keyed by id: re-putting the same attempt never duplicates', async () => {
    const { kv } = await openStorage(new IDBFactory());
    const s = snap(2);
    await kv.putMany('attempts', s.attempts);
    await kv.putMany('attempts', s.attempts);
    expect((await kv.getAll('attempts')).length).toBe(2);
  });
  it('AC-F16-2: missing, throwing or blocked IndexedDB falls back to session-only mode without throwing', async () => {
    for (const f of [null, { open() { throw new Error('SecurityError: denied'); } } as any, { open() { const r: any = {}; setTimeout(() => r.onerror?.(), 0); return r; } } as any]) {
      const r = await openStorage(f);
      expect(r.mode).toBe('session');
      expect(r.error).toBeTruthy();
      await r.kv.put('attempts', att({ score: 1 }));
      expect((await r.kv.getAll('attempts')).length).toBe(1);
    }
  });
  it('AC-F16-3: migration framework runs a registered v1->v2 stub and refuses gaps or backwards moves', () => {
    expect(CURRENT_SCHEMA_VERSION).toBe(1);
    expect(MIGRATIONS.some((m) => m.from === 1 && m.to === 2)).toBe(true);
    const out = runMigrations({ attempts: [1] }, 1, 2);
    expect(out).toEqual({ attempts: [1], _migratedFrom: [1] });
    expect(runMigrations({ a: 1 }, 1, 1)).toEqual({ a: 1 });
    expect(() => runMigrations({}, 1, 3)).toThrow(/No migration registered from schema v2/);
    expect(() => runMigrations({}, 2, 1)).toThrow();
  });
});

describe('F17 backup and restore', () => {
  it('AC-F17-1: export, wipe, import reproduces identical derived state', async () => {
    const kv = memoryKV();
    const original = snap(14);
    await writeSnapshot(kv, original);
    const before = derive(await readSnapshot(kv));
    const exported = await buildExport(await readSnapshot(kv), opts);
    const text = JSON.stringify(exported);
    for (const s of ['profile', 'attempts', 'cardState', 'caseProgress', 'notes', 'events', 'settings'] as const) await kv.clear(s); // wipe
    expect((await readSnapshot(kv)).attempts.length).toBe(0);
    const res = await parseImport(text, { maxBytes: CFG.import_max_bytes });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    await replaceSafely(kv, res.snapshot);
    const restored = await readSnapshot(kv);
    expect(derive(restored)).toEqual(before);
    expect(restored.attempts.length).toBe(14);
    expect(restored.cardState).toEqual(original.cardState);
    expect(res.preview.attempts).toBe(14);
  });
  it('filename follows architect-lab-progress-YYYY-MM-DD.json', () => {
    expect(exportFilename('2026-11-12T10:00:00Z')).toBe('architect-lab-progress-2026-11-12.json');
  });
  it('the export satisfies handoff/schemas/progress_export.schema.json (Ajv) and so does our own validator', async () => {
    const schema = JSON.parse(fs.readFileSync('handoff/schemas/progress_export.schema.json', 'utf8'));
    const ajv = new Ajv2020({ strict: false });
    addFormats(ajv);
    const validate = ajv.compile(schema);
    const e = await buildExport(snap(5), opts);
    expect(validate(e)).toBe(true);
    expect(validateShape(e)).toBeNull();
    const example = JSON.parse(fs.readFileSync('handoff/schemas/progress_export.example.json', 'utf8'));
    expect(validate(example)).toBe(true);
    expect(validateShape(example)).toBeNull();
    // both validators reject the same broken documents
    for (const broken of [{ ...e, schema: 'x' }, { ...e, version: 0 }, { ...e, data: { ...e.data, attempts: 'no' } }, { ...e, data: { ...e.data, attempts: [{ id: 'a' }] } }]) {
      expect(validate(broken)).toBe(false);
      expect(validateShape(broken)).not.toBeNull();
    }
  });
  describe('AC-F17-2: rejection with a specific message, changing nothing', () => {
    const good = async () => JSON.stringify(await buildExport(snap(4), opts));
    const rej = async (text: string, code: string, maxBytes = CFG.import_max_bytes) => {
      const r = await parseImport(text, { maxBytes });
      expect(r.ok).toBe(false);
      if (!r.ok) { expect(r.code).toBe(code); expect(r.message).toMatch(/Nothing was changed|empty/i); }
    };
    it('empty', async () => rej('   ', 'empty'));
    it('truncated JSON', async () => { const t = await good(); await rej(t.slice(0, t.length - 40), 'invalid_json'); });
    it('not JSON', async () => rej('<html>', 'invalid_json'));
    it('JSON but not an object', async () => rej('[1,2]', 'not_an_object'));
    it('wrong schema name', async () => rej(JSON.stringify({ schema: 'something-else', version: 1 }), 'wrong_schema'));
    it('newer schema version', async () => { const e = JSON.parse(await good()); e.version = 99; await rej(JSON.stringify(e), 'newer_version'); });
    it('invalid shape', async () => { const e = JSON.parse(await good()); delete e.data.cardState; await rej(JSON.stringify(e), 'invalid_shape'); });
    it('duplicate attempt ids', async () => { const e = JSON.parse(await good()); e.data.attempts[1].id = e.data.attempts[0].id; await rej(JSON.stringify(e), 'invalid_shape'); });
    it('tampered data (checksum)', async () => { const e = JSON.parse(await good()); e.data.attempts[0].score = 0.123; await rej(JSON.stringify(e), 'checksum_mismatch'); });
    it('over the size limit', async () => rej(await good(), 'too_large', 100));
    it('hostile content is data, never evaluated', async () => {
      const e = await buildExport({ ...snap(1), notes: [{ id: 'x', kind: 'note', refId: 'r', data: { text: '<img src=x onerror=alert(1)>', code: "__proto__" }, updatedAt: NOW }] }, opts);
      const r = await parseImport(JSON.stringify(e), { maxBytes: CFG.import_max_bytes });
      expect(r.ok).toBe(true);
      expect(({} as any).polluted).toBeUndefined();
    });
    it('a failed replace rolls back to the previous data', async () => {
      const inner = memoryKV();
      await writeSnapshot(inner, snap(3, 'keep'));
      let fail = false;
      const kv = { ...inner, async putMany(s: any, r: any[]) { if (fail && s === 'attempts' && r.some((x) => x.id.startsWith('new'))) throw new Error('quota'); return inner.putMany(s, r); } };
      fail = true;
      await expect(replaceSafely(kv as any, snap(2, 'new'))).rejects.toThrow('quota');
      expect((await readSnapshot(inner)).attempts.map((a) => a.id).sort()).toEqual(['keep0', 'keep1', 'keep2']);
    });
  });
  it('AC-F17-3: merging two diverging exports yields the union of attempts with no duplicate ids', async () => {
    const shared = snap(3, 'sh').attempts;
    const a: Snapshot = { ...snap(0), attempts: [...shared, ...snap(2, 'onlyA').attempts] };
    const b: Snapshot = { ...snap(0), attempts: [...shared, ...snap(4, 'onlyB').attempts] };
    const m = mergeSnapshots(a, b);
    const ids = m.attempts.map((x) => x.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBe(3 + 2 + 4);
    expect(mergeSnapshots(a, a).attempts.length).toBe(a.attempts.length); // idempotent
    expect(mergeSnapshots(m, b).attempts.length).toBe(m.attempts.length);
  });
  it('merge: latest updatedAt wins for mutable records; assessment runs are unioned', () => {
    const old = { ...snap(0), cardState: [{ id: 'card:K1', kind: 'card' as const, refId: 'K1', topicId: 'T1.1.1', box: 2, dueAt: NOW, reviews: 1, lapses: 0, updatedAt: '2026-01-01T00:00:00.000Z' }], profile: { key: 'profile' as const, updatedAt: '2026-01-01T00:00:00.000Z', assessmentRuns: [{ id: 'r1' } as any] } };
    const fresh = { ...snap(0), cardState: [{ ...old.cardState[0], box: 4, updatedAt: '2026-02-01T00:00:00.000Z' }], profile: { key: 'profile' as const, updatedAt: '2026-02-01T00:00:00.000Z', assessmentRuns: [{ id: 'r2' } as any] } };
    for (const m of [mergeSnapshots(old, fresh), mergeSnapshots(fresh, old)]) {
      expect(m.cardState[0].box).toBe(4);
      expect(m.profile!.assessmentRuns.map((r: any) => r.id).sort()).toEqual(['r1', 'r2']);
    }
  });
  it('canonicalJson is key-order independent', () => {
    expect(canonicalJson({ b: 1, a: [2, { d: 1, c: 2 }] })).toBe(canonicalJson({ a: [2, { c: 2, d: 1 }], b: 1 }));
  });
  it('AC-F17-4: backup reminder after 7 days or 25 new attempts', () => {
    const cfg = CFG.backup_reminder;
    expect(backupReminder({ now: NOW, attemptCount: 0, cfg }).due).toBe(false);
    expect(backupReminder({ now: NOW, attemptCount: 5, cfg }).due).toBe(true);
    expect(backupReminder({ now: NOW, lastExportAt: '2026-02-22T10:00:00.000Z', attemptCount: 5, attemptsAtLastExport: 5, cfg }).due).toBe(true); // 7 days
    expect(backupReminder({ now: NOW, lastExportAt: '2026-02-23T10:00:00.000Z', attemptCount: 5, attemptsAtLastExport: 5, cfg }).due).toBe(false); // 6 days
    expect(backupReminder({ now: NOW, lastExportAt: '2026-02-28T10:00:00.000Z', attemptCount: 30, attemptsAtLastExport: 5, cfg }).due).toBe(true); // 25 new
    expect(backupReminder({ now: NOW, lastExportAt: '2026-02-28T10:00:00.000Z', attemptCount: 29, attemptsAtLastExport: 5, cfg }).due).toBe(false);
  });
});
