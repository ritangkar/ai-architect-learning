// Backup and restore (F17). Imported files are untrusted: validated, size-limited, checksum-verified, never evaluated.
import { CURRENT_SCHEMA_VERSION, runMigrations } from '../storage/migrations';
import type { Snapshot } from '../storage/types';
import { emptySnapshot } from '../storage/types';

export interface ProgressExport {
  schema: 'architect-lab-progress';
  version: number;
  exportedAt: string;
  contentVersion: string;
  installId: string;
  data: { profile: any; attempts: any[]; cardState: any[]; caseProgress: any[]; notes: any[]; settings: any; events?: any[] };
  checksum: string;
}

export function canonicalJson(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(canonicalJson).join(',') + ']';
  const o = v as Record<string, unknown>;
  return '{' + Object.keys(o).filter((k) => o[k] !== undefined).sort().map((k) => JSON.stringify(k) + ':' + canonicalJson(o[k])).join(',') + '}';
}
export async function sha256Hex(text: string): Promise<string> {
  const buf = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
export const exportFilename = (now: Date | string = new Date()) => `architect-lab-progress-${new Date(now).toISOString().slice(0, 10)}.json`;

export async function buildExport(s: Snapshot, o: { contentVersion: string; installId: string; now?: string }): Promise<ProgressExport> {
  const data = { profile: s.profile ?? {}, attempts: s.attempts, cardState: s.cardState, caseProgress: s.caseProgress, notes: s.notes, events: s.events, settings: s.settings ?? {} };
  return { schema: 'architect-lab-progress', version: CURRENT_SCHEMA_VERSION, exportedAt: o.now ?? new Date().toISOString(), contentVersion: o.contentVersion, installId: o.installId, data, checksum: 'sha256:' + (await sha256Hex(canonicalJson(data))) };
}

export type ImportErrorCode = 'too_large' | 'empty' | 'invalid_json' | 'not_an_object' | 'wrong_schema' | 'invalid_version' | 'newer_version' | 'invalid_shape' | 'checksum_mismatch' | 'migration_failed';
export type ImportResult =
  | { ok: true; export: ProgressExport; snapshot: Snapshot; preview: Record<string, number>; warnings: string[] }
  | { ok: false; code: ImportErrorCode; message: string };

const fail = (code: ImportErrorCode, message: string): ImportResult => ({ ok: false, code, message });
const isObj = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Validates against schemas/progress_export.schema.json (hand-written validator; cross-checked against Ajv in tests). */
export function validateShape(x: any): string | null {
  if (!isObj(x)) return 'top level is not an object';
  if (x.schema !== 'architect-lab-progress') return 'field "schema" must be "architect-lab-progress"';
  if (!Number.isInteger(x.version) || x.version < 1) return 'field "version" must be an integer >= 1';
  if (typeof x.exportedAt !== 'string' || Number.isNaN(Date.parse(x.exportedAt)) || !/^\d{4}-\d{2}-\d{2}T/.test(x.exportedAt)) return 'field "exportedAt" must be an ISO date-time string';
  for (const k of ['contentVersion', 'installId', 'checksum']) if (typeof x[k] !== 'string') return `field "${k}" must be a string`;
  if (!isObj(x.data)) return 'field "data" must be an object';
  for (const k of ['attempts', 'cardState', 'caseProgress', 'notes']) if (!Array.isArray(x.data[k])) return `data.${k} must be an array`;
  if (x.data.events !== undefined && !Array.isArray(x.data.events)) return 'data.events must be an array';
  for (const k of ['profile', 'settings']) if (!isObj(x.data[k])) return `data.${k} must be an object`;
  for (const k of ['cardState', 'caseProgress', 'notes']) for (const [i, r] of x.data[k].entries()) if (!isObj(r)) return `data.${k}[${i}] must be an object`;
  const ids = new Set<string>();
  for (const [i, a] of x.data.attempts.entries()) {
    if (!isObj(a)) return `data.attempts[${i}] must be an object`;
    for (const k of ['id', 'itemId', 'timestamp']) if (typeof a[k] !== 'string' || !a[k]) return `data.attempts[${i}].${k} is required (string)`;
    if (typeof a.score !== 'number' || !(a.score >= 0 && a.score <= 1)) return `data.attempts[${i}].score must be a number between 0 and 1`;
    if (!Array.isArray(a.topics) || !Array.isArray(a.competencies)) return `data.attempts[${i}] must list topics and competencies`;
    if (ids.has(a.id)) return `data.attempts has a duplicate id ${a.id}`;
    ids.add(a.id);
  }
  return null;
}

export async function parseImport(text: string, o: { maxBytes: number; currentVersion?: number }): Promise<ImportResult> {
  const current = o.currentVersion ?? CURRENT_SCHEMA_VERSION;
  const bytes = new TextEncoder().encode(text).length;
  if (bytes === 0 || !text.trim()) return fail('empty', 'The file is empty.');
  if (bytes > o.maxBytes) return fail('too_large', `The file is ${(bytes / 1048576).toFixed(1)} MB; the limit is ${(o.maxBytes / 1048576).toFixed(0)} MB. Nothing was changed.`);
  let obj: any;
  try { obj = JSON.parse(text); } catch (e: any) { return fail('invalid_json', `The file is not valid JSON (it may be truncated or corrupted): ${String(e?.message ?? e).slice(0, 120)}. Nothing was changed.`); }
  if (!isObj(obj)) return fail('not_an_object', 'The file does not contain a progress export object. Nothing was changed.');
  if (obj.schema !== 'architect-lab-progress') return fail('wrong_schema', `This is not an Architect Lab progress export (schema is ${JSON.stringify(obj.schema)}). Nothing was changed.`);
  if (!Number.isInteger(obj.version) || obj.version < 1) return fail('invalid_version', 'The export has no valid schema version. Nothing was changed.');
  if (obj.version > current) return fail('newer_version', `This export was written by a newer version of the app (schema v${obj.version}; this app supports up to v${current}). Update the app, then import again. Nothing was changed.`);
  const bad = validateShape(obj);
  if (bad) return fail('invalid_shape', `The export is malformed: ${bad}. Nothing was changed.`);
  const expected = 'sha256:' + (await sha256Hex(canonicalJson(obj.data)));
  if (obj.checksum !== expected) return fail('checksum_mismatch', 'The checksum does not match the data: the file was modified or damaged after export. Nothing was changed.');
  let data = obj.data;
  const warnings: string[] = [];
  if (obj.version < current) {
    try { data = runMigrations(data, obj.version, current); warnings.push(`Migrated from schema v${obj.version} to v${current}.`); } catch (e: any) { return fail('migration_failed', `Could not migrate the export: ${e.message}. Nothing was changed.`); }
  }
  const snapshot: Snapshot = { ...emptySnapshot(), profile: Object.keys(data.profile).length ? data.profile : null, attempts: data.attempts, cardState: data.cardState, caseProgress: data.caseProgress, notes: data.notes, events: data.events ?? [], settings: Object.keys(data.settings).length ? data.settings : null };
  const preview = { attempts: snapshot.attempts.length, assessmentRuns: snapshot.profile?.assessmentRuns?.length ?? 0, revisionCards: snapshot.cardState.length, caseRecords: snapshot.caseProgress.length, notesAndExercises: snapshot.notes.length, events: snapshot.events.length };
  return { ok: true, export: obj as ProgressExport, snapshot, preview, warnings };
}

// ---------- merge ----------
const newer = <T extends { updatedAt?: string }>(a: T, b: T): T => ((b.updatedAt ?? '') > (a.updatedAt ?? '') ? b : a);
function mergeBy<T extends { updatedAt?: string }>(a: T[], b: T[], key: (x: T) => string): T[] {
  const m = new Map<string, T>();
  for (const x of a) m.set(key(x), x);
  for (const x of b) { const k = key(x); m.set(k, m.has(k) ? newer(m.get(k)!, x) : x); }
  return [...m.values()];
}
/** Union of attempts by id (never duplicated); latest updatedAt wins for mutable records (spec F17). */
export function mergeSnapshots(local: Snapshot, incoming: Snapshot): Snapshot {
  const attempts = new Map<string, any>();
  for (const a of [...local.attempts, ...incoming.attempts]) if (!attempts.has(a.id)) attempts.set(a.id, a);
  const events = new Map<string, any>();
  for (const e of [...local.events, ...incoming.events]) if (!events.has(e.id)) events.set(e.id, e);
  let profile = local.profile;
  if (local.profile && incoming.profile) {
    const win = newer(local.profile, incoming.profile);
    profile = { ...win, assessmentRuns: mergeBy(local.profile.assessmentRuns ?? [], incoming.profile.assessmentRuns ?? [], (r: any) => r.id).sort((x: any, y: any) => (x.startedAt < y.startedAt ? -1 : 1)) as any };
  } else profile = local.profile ?? incoming.profile;
  return {
    profile,
    attempts: [...attempts.values()],
    events: [...events.values()],
    cardState: mergeBy(local.cardState, incoming.cardState, (x) => x.id),
    caseProgress: mergeBy(local.caseProgress, incoming.caseProgress, (x) => x.caseId),
    notes: mergeBy(local.notes, incoming.notes, (x) => x.id),
    settings: local.settings && incoming.settings ? newer(local.settings, incoming.settings) : local.settings ?? incoming.settings,
  };
}

// ---------- reminder (F01/F17-4) ----------
export function backupReminder(args: { now: string; lastExportAt?: string; attemptsAtLastExport?: number; attemptCount: number; cfg: { days: number; new_attempts: number } }) {
  const { now, lastExportAt, attemptCount, cfg } = args;
  const since = attemptCount - (args.attemptsAtLastExport ?? 0);
  if (attemptCount === 0) return { due: false, reason: 'No progress to back up yet.', daysSince: null as number | null, newAttempts: 0 };
  if (!lastExportAt) return { due: true, reason: 'You have progress but have never exported a backup.', daysSince: null, newAttempts: since };
  const days = Math.floor((Date.parse(now) - Date.parse(lastExportAt)) / 86400000);
  if (days >= cfg.days) return { due: true, reason: `Your last backup was ${days} days ago.`, daysSince: days, newAttempts: since };
  if (since >= cfg.new_attempts) return { due: true, reason: `${since} new answers since your last backup.`, daysSince: days, newAttempts: since };
  return { due: false, reason: `Last backup ${days} day(s) ago, ${since} new answer(s) since.`, daysSince: days, newAttempts: since };
}
