// Client-side application state. Source of truth = append-only attempts + small mutable records in IndexedDB (or memory in session-only mode).
// All mastery numbers are derived by the engine from that log; nothing here "marks complete" anything.
import { dataUrl } from '../url';
import { openStorage } from '../storage/kv';
import { readSnapshot, replaceSafely } from '../storage/snapshot';
import { CURRENT_SCHEMA_VERSION } from '../storage/migrations';
import { emptySnapshot, type KV, type LearnEvent, type Meta, type Note, type Settings, type Snapshot } from '../storage/types';
import { buildExport, exportFilename, mergeSnapshots, parseImport, backupReminder, type ImportResult } from '../backup';
import { deriveLearner, type AssessmentRun, type CaseProgress, type ExerciseResult, type LearnerState, type Profile } from '../engine/learner';
import { scoreResponse } from '../engine/scoring';
import { newCardState, reviewCard, resetCard, snoozeCard, type CardState } from '../engine/srs';
import { caseExerciseOutcome } from '../engine/recommender';
import { buildResults, nextAssessmentItem, type NextItem } from '../engine/assessment';
import { seededShuffle } from '../engine/seed';
import type { Attempt, Context, Depth } from '../engine/types';
import type { Core } from './bundle';
import type { Question } from '../content/schemas';

export type Mode = 'persistent' | 'session';
const DEFAULT_SETTINGS = (now: string): Settings => ({ key: 'settings', theme: 'system', reducedMotion: 'system', density: 'comfortable', showStreak: false, defaultDepth: 'auto', sessionMinutes: 120, updatedAt: now });

export function newId(prefix: string): string {
  const c: any = globalThis.crypto;
  const rnd = c?.randomUUID ? c.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${rnd}`;
}
const lsGet = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k: string, v: string | null) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* UI preference only; ignore */ } };

export class AppState {
  core!: Core;
  questions: Question[] = [];
  kv!: KV;
  mode: Mode = 'session';
  storageError?: string;
  meta!: Meta;
  snap: Snapshot = emptySnapshot();
  learner!: LearnerState;
  private subs = new Set<() => void>();
  private qLoaded?: Promise<void>;
  version = 0;

  static async create(): Promise<AppState> {
    const s = new AppState();
    const [core, opened] = await Promise.all([fetch(dataUrl('core')).then((r) => r.json() as Promise<Core>), openStorage()]);
    s.core = core;
    s.kv = opened.kv;
    s.mode = opened.mode;
    s.storageError = opened.error;
    const now = s.now();
    try {
      const m = await s.kv.get<Meta>('meta', 'meta');
      s.meta = m ?? { key: 'meta', schemaVersion: CURRENT_SCHEMA_VERSION, installId: newId('inst'), createdAt: now };
      s.snap = await readSnapshot(s.kv);
    } catch (e: any) {
      s.degrade(e);
      s.meta = { key: 'meta', schemaVersion: CURRENT_SCHEMA_VERSION, installId: newId('inst'), createdAt: now };
    }
    s.meta.contentVersionSeen = core.site.contentVersion;
    await s.persist('meta', s.meta);
    if (!s.snap.settings) s.snap.settings = DEFAULT_SETTINGS(now);
    s.applySettings();
    s.recompute();
    return s;
  }

  now(): string { return new Date().toISOString(); }
  subscribe(fn: () => void) { this.subs.add(fn); return () => { this.subs.delete(fn); }; }
  private emit() { this.version++; this.subs.forEach((f) => f()); }
  /** Storage failure at any time degrades to session-only (data stays in memory) and is surfaced by the banner. */
  private degrade(e: unknown) {
    if (this.mode !== 'session') { this.mode = 'session'; this.storageError = String((e as any)?.message ?? e); this.kv = (this.kv as any) ; window.dispatchEvent(new CustomEvent('al-storage-degraded')); }
  }
  private async persist(store: any, rec: any) {
    try { if (this.mode === 'persistent') await this.kv.put(store, rec); } catch (e) { this.degrade(e); }
  }
  private async persistMany(store: any, recs: any[]) {
    try { if (this.mode === 'persistent') await this.kv.putMany(store, recs); } catch (e) { this.degrade(e); }
  }

  ensureQuestions(): Promise<void> {
    return (this.qLoaded ??= fetch(dataUrl('questions')).then((r) => r.json()).then((q) => { this.questions = q; this.emit(); }));
  }
  recompute() {
    this.learner = deriveLearner({ model: this.core.model, cfg: this.core.engine, attempts: this.snap.attempts, cards: this.snap.cardState, caseProgress: this.snap.caseProgress, profile: this.snap.profile, exerciseResults: this.exerciseResults(), now: this.now() });
    this.emit();
  }
  exerciseResults(): ExerciseResult[] {
    return this.snap.notes.filter((n) => n.kind === 'exercise' && n.data?.result).map((n) => n.data.result as ExerciseResult);
  }
  get settings(): Settings { return this.snap.settings!; }
  get profile(): Profile { return this.snap.profile ?? { key: 'profile', assessmentRuns: [], updatedAt: this.now() }; }
  q(id: string) { return this.questions.find((x) => x.id === id); }

  // ---------- attempts ----------
  async recordAttempt(a: Omit<Attempt, 'id' | 'timestamp' | 'contentVersion'> & { timestamp?: string }): Promise<Attempt> {
    const at: Attempt = { ...a, id: newId('att'), timestamp: a.timestamp ?? this.now(), contentVersion: this.core.site.contentVersion };
    this.snap.attempts.push(at);
    await this.persist('attempts', at);
    return at;
  }
  /** Score and record an answer to a question. Appends one attempt; never edits history. */
  async answerQuestion(q: Question, response: any, o: { confidence?: number; timeMs: number; context: Context; seed?: string; optionOrder?: string[]; runId?: string; caseId?: string }): Promise<{ attempt: Attempt; score: number }> {
    const score = scoreResponse(q as any, response);
    const attempt = await this.recordAttempt({ itemId: q.id, itemType: q.type, topics: q.topics, competencies: q.competencies, response, score, confidence: o.confidence, timeMs: o.timeMs, context: o.context, seed: o.seed, optionOrder: o.optionOrder, runId: o.runId, caseId: o.caseId });
    if (o.context === 'quiz' || o.context === 'initial') {
      await this.ensureTopicCards(q.topics);
      if (score < (this.core.engine.pass_threshold ?? 0.7) && (q.type === 'mcq' || q.type === 'scenario')) await this.queueQuestionCard(q);
    }
    this.recompute();
    return { attempt, score };
  }
  optionOrderFor(q: Question, seed: string): string[] {
    return seededShuffle((q.options ?? []).map((o) => o.id), `${seed}|${q.id}`);
  }

  // ---------- cards / review ----------
  async ensureTopicCards(topicIds: string[]) {
    const now = this.now();
    const add: CardState[] = [];
    for (const k of this.core.cards.filter((c) => topicIds.includes(c.topicId))) {
      const id = `card:${k.id}`;
      if (!this.snap.cardState.some((s) => s.id === id)) add.push(newCardState('card', k.id, k.topicId, now, k.competencies));
    }
    if (add.length) { this.snap.cardState.push(...add); await this.persistMany('cardState', add); }
    return add.length;
  }
  async queueQuestionCard(q: Question) {
    const id = `q:${q.id}`;
    const ex = this.snap.cardState.find((s) => s.id === id);
    const now = this.now();
    const next = ex ? resetCard(ex, now) : newCardState('question', q.id, q.topics[0], now, q.competencies);
    this.upsertCard(next);
    await this.persist('cardState', next);
  }
  private upsertCard(c: CardState) {
    const i = this.snap.cardState.findIndex((s) => s.id === c.id);
    i >= 0 ? (this.snap.cardState[i] = c) : this.snap.cardState.push(c);
  }
  async reviewCardResult(cardId: string, r: { grade?: 'known' | 'almost' | 'missed'; score?: number; confidence?: number; timeMs: number; response?: any }) {
    const s = this.snap.cardState.find((x) => x.id === cardId);
    if (!s) return;
    const now = this.now();
    const score = r.score ?? (r.grade === 'known' ? 1 : r.grade === 'almost' ? 0.5 : 0);
    const correct = score >= (this.core.engine.pass_threshold ?? 0.7);
    const next = reviewCard(s, { correct, confidence: r.confidence }, now, this.core.engine);
    this.upsertCard(next);
    await this.persist('cardState', next);
    const comps = s.competencies?.length ? s.competencies : this.core.model.topics.find((t) => t.id === s.topicId)?.comps ?? [];
    await this.recordAttempt({ itemId: s.id, itemType: s.kind === 'card' ? 'card' : (this.q(s.refId)?.type ?? 'mcq'), topics: [s.topicId], competencies: comps, response: r.response ?? { grade: r.grade }, score, confidence: r.confidence, timeMs: r.timeMs, context: 'review' });
    this.recompute();
  }
  async snooze(cardId: string, days: number) { const s = this.snap.cardState.find((x) => x.id === cardId); if (!s) return; const n = snoozeCard(s, days, this.now()); this.upsertCard(n); await this.persist('cardState', n); this.recompute(); }
  async resetCardBox(cardId: string) { const s = this.snap.cardState.find((x) => x.id === cardId); if (!s) return; const n = resetCard(s, this.now()); this.upsertCard(n); await this.persist('cardState', n); this.recompute(); }

  // ---------- events ----------
  async lessonViewed(topicId: string) {
    const ev: LearnEvent = { id: newId('ev'), type: 'lessonViewed', refId: topicId, timestamp: this.now() };
    this.snap.events.push(ev); // records an event only. It never touches attempts or mastery (AC-F05-1).
    await this.persist('events', ev);
    await this.ensureTopicCards([topicId]);
    this.recompute();
  }
  lessonViewedCount(topicId: string) { return this.snap.events.filter((e) => e.type === 'lessonViewed' && e.refId === topicId).length; }

  // ---------- profile / depth / queue ----------
  async updateProfile(f: (p: Profile) => void) {
    const p: Profile = structuredClone(this.profile);
    f(p);
    p.updatedAt = this.now();
    this.snap.profile = p;
    await this.persist('profile', p);
    this.recompute();
  }
  depthChoice(topicId: string): Depth | undefined { return (lsGet(`al.depth.${topicId}`) as Depth | null) ?? this.snap.profile?.depthChoice?.[topicId]; }
  async setDepthChoice(topicId: string, d: Depth) { lsSet(`al.depth.${topicId}`, d); await this.updateProfile((p) => { p.depthChoice = { ...(p.depthChoice ?? {}), [topicId]: d }; }); }
  async queueCase(caseId: string | null) { await this.updateProfile((p) => { p.queuedCaseId = caseId; }); }
  async setResume(r: Profile['resume']) { await this.updateProfile((p) => { p.resume = r; }); }

  // ---------- initial assessment ----------
  get activeRun(): AssessmentRun | undefined { return this.profile.assessmentRuns.find((r) => r.status === 'in_progress'); }
  async startRun(): Promise<AssessmentRun> {
    await this.ensureQuestions();
    const now = this.now();
    const run: AssessmentRun = { id: newId('run'), startedAt: now, status: 'in_progress', seed: newId('seed'), selfRatings: {}, selfDone: false, attemptIds: [], contentVersion: this.core.site.contentVersion };
    for (const r of this.profile.assessmentRuns.filter((x) => x.status === 'in_progress')) r.status = 'abandoned';
    await this.updateProfile((p) => { p.assessmentRuns = [...p.assessmentRuns.map((r) => (r.status === 'in_progress' ? { ...r, status: 'abandoned' as const } : r)), run]; });
    return run;
  }
  async abandonRun() { await this.updateProfile((p) => { p.assessmentRuns = p.assessmentRuns.map((r) => (r.status === 'in_progress' ? { ...r, status: 'abandoned' as const } : r)); }); }
  async saveSelfRatings(runId: string, ratings: Record<string, number>) { await this.updateProfile((p) => { const r = p.assessmentRuns.find((x) => x.id === runId); if (r) { r.selfRatings = ratings; r.selfDone = true; } }); }
  runAttempts(run: AssessmentRun): Attempt[] { return this.snap.attempts.filter((a) => a.runId === run.id); }
  nextForRun(run: AssessmentRun): NextItem {
    const bank = this.questions.map((q) => ({ id: q.id, type: q.type, topics: q.topics, competencies: q.competencies, difficulty: q.difficulty }));
    return nextAssessmentItem({ bank, competencies: Object.keys(this.core.competencies), runAttempts: this.runAttempts(run), selfRatings: run.selfRatings, seed: run.seed, cfg: this.core.engine });
  }
  async setPending(run: AssessmentRun, itemId: string | undefined) { if (run.pendingItemId === itemId) return; await this.updateProfile((p) => { const r = p.assessmentRuns.find((x) => x.id === run.id); if (r) r.pendingItemId = itemId; }); }
  async answerInitial(run: AssessmentRun, q: Question, response: any, o: { confidence?: number; timeMs: number; seed: string; optionOrder: string[] }) {
    const res = await this.answerQuestion(q, response, { ...o, context: 'initial', runId: run.id });
    await this.updateProfile((p) => { const r = p.assessmentRuns.find((x) => x.id === run.id); if (r) r.attemptIds.push(res.attempt.id); });
    return res;
  }
  async completeRun(run: AssessmentRun) { await this.updateProfile((p) => { const r = p.assessmentRuns.find((x) => x.id === run.id); if (r) { r.status = 'completed'; r.completedAt = this.now(); r.pendingItemId = undefined; } }); await this.ensureTopicCards([]); }
  resultsFor(run: AssessmentRun) {
    const bank = this.questions.map((q) => ({ id: q.id, type: q.type, topics: q.topics, competencies: q.competencies, difficulty: q.difficulty }));
    return buildResults({ runAttempts: this.runAttempts(run), selfRatings: run.selfRatings, model: this.core.model, bank, cfg: this.core.engine });
  }

  // ---------- cases and exercises ----------
  caseProgress(caseId: string): CaseProgress | undefined { return this.snap.caseProgress.find((c) => c.caseId === caseId); }
  async viewCaseSection(caseId: string, section: string) {
    const cur = this.caseProgress(caseId) ?? { caseId, viewedSections: [], updatedAt: this.now() };
    if (cur.viewedSections.includes(section)) return;
    const next: CaseProgress = { ...cur, viewedSections: [...cur.viewedSections, section], updatedAt: this.now() };
    this.putCase(next);
    await this.persist('caseProgress', next);
    this.emit();
  }
  private putCase(c: CaseProgress) { const i = this.snap.caseProgress.findIndex((x) => x.caseId === c.caseId); i >= 0 ? (this.snap.caseProgress[i] = c) : this.snap.caseProgress.push(c); }
  /** Self-scored case exercise -> evidence on the case's prerequisite topics; below the threshold it regresses them (F09-3). */
  async submitCaseExercise(caseId: string, checked: string[], total: number, response: unknown, confidence?: number) {
    const score = total ? checked.length / total : 0;
    const out = caseExerciseOutcome({ model: this.core.model, cfg: this.core.engine, caseId, score, timestamp: this.now(), contentVersion: this.core.site.contentVersion, response, confidence });
    const at = await this.recordAttempt({ ...out.attempt });
    const cur = this.caseProgress(caseId) ?? { caseId, viewedSections: [], updatedAt: this.now() };
    const next: CaseProgress = { ...cur, exercise: { score, passed: out.passed, at: at.timestamp, attemptId: at.id, checked }, revisitBeforeContinuing: out.regress, updatedAt: this.now() };
    this.putCase(next);
    await this.persist('caseProgress', next);
    if (out.regress) {
      await this.ensureTopicCards(out.revisitTopics);
      const now = this.now();
      for (const s of this.snap.cardState.filter((c) => out.revisitTopics.includes(c.topicId))) { const r = resetCard(s, now); this.upsertCard(r); await this.persist('cardState', r); }
    }
    this.recompute();
    return { score, regress: out.regress, passed: out.passed };
  }
  exerciseWork(id: string): Note | undefined { return this.snap.notes.find((n) => n.id === `exercise:${id}`); }
  async saveExerciseWork(id: string, data: any) {
    const prev = this.exerciseWork(id);
    const note: Note = { id: `exercise:${id}`, kind: 'exercise', refId: id, data: { ...(prev?.data ?? {}), ...data }, updatedAt: this.now() };
    const i = this.snap.notes.findIndex((n) => n.id === note.id);
    i >= 0 ? (this.snap.notes[i] = note) : this.snap.notes.push(note);
    await this.persist('notes', note);
    this.recompute();
  }

  // ---------- settings, backup, reset ----------
  applySettings() {
    const s = this.settings;
    lsSet('al.theme', s.theme === 'system' ? null : s.theme);
    lsSet('al.density', s.density === 'compact' ? 'compact' : null);
    lsSet('al.motion', s.reducedMotion === 'on' ? 'off' : null);
    const el = document.documentElement;
    s.theme === 'system' ? el.removeAttribute('data-theme') : el.setAttribute('data-theme', s.theme);
    s.density === 'compact' ? el.setAttribute('data-density', 'compact') : el.removeAttribute('data-density');
    s.reducedMotion === 'on' ? el.setAttribute('data-motion', 'off') : el.removeAttribute('data-motion');
  }
  async updateSettings(patch: Partial<Settings>) { this.snap.settings = { ...this.settings, ...patch, updatedAt: this.now() }; await this.persist('settings', this.snap.settings); this.applySettings(); this.emit(); }
  async dismissNotice() { this.meta = { ...this.meta, noticeDismissedVersion: this.core.site.storageNoticeVersion }; await this.persist('meta', this.meta); this.emit(); }
  noticeDismissed() { return this.meta.noticeDismissedVersion === this.core.site.storageNoticeVersion; }
  backupStatus() { return backupReminder({ now: this.now(), lastExportAt: this.meta.lastExportAt, attemptsAtLastExport: this.meta.attemptsAtLastExport, attemptCount: this.snap.attempts.length, cfg: this.core.engine.backup_reminder }); }
  async exportData(): Promise<{ filename: string; text: string }> {
    const exp = await buildExport(this.snap, { contentVersion: this.core.site.contentVersion, installId: this.meta.installId, now: this.now() });
    this.meta = { ...this.meta, lastExportAt: exp.exportedAt, attemptsAtLastExport: this.snap.attempts.length };
    await this.persist('meta', this.meta);
    this.emit();
    return { filename: exportFilename(exp.exportedAt), text: JSON.stringify(exp, null, 1) };
  }
  async previewImport(text: string): Promise<ImportResult> { return parseImport(text, { maxBytes: this.core.engine.import_max_bytes }); }
  async applyImport(res: Extract<ImportResult, { ok: true }>, mode: 'replace' | 'merge') {
    const next = mode === 'merge' ? mergeSnapshots(this.snap, res.snapshot) : res.snapshot;
    if (this.mode === 'persistent') { try { await replaceSafely(this.kv, { ...next, settings: next.settings ?? this.snap.settings }); } catch (e) { this.degrade(e); throw e; } }
    this.snap = { ...next, settings: next.settings ?? this.snap.settings };
    this.applySettings();
    this.recompute();
  }
  async resetAll() {
    const keepMeta = this.meta;
    if (this.mode === 'persistent') for (const s of ['profile', 'attempts', 'topicState', 'cardState', 'caseProgress', 'notes', 'events', 'settings'] as const) await this.kv.clear(s);
    this.snap = emptySnapshot();
    this.snap.settings = DEFAULT_SETTINGS(this.now());
    this.meta = { ...keepMeta, lastExportAt: undefined, attemptsAtLastExport: undefined };
    await this.persist('meta', this.meta);
    this.applySettings();
    this.recompute();
  }
  storedCounts() { const s = this.snap; return { attempts: s.attempts.length, assessmentRuns: s.profile?.assessmentRuns.length ?? 0, revisionCards: s.cardState.length, caseRecords: s.caseProgress.length, notesAndExercises: s.notes.length, events: s.events.length }; }

  // ---------- derived views ----------
  streakDays(): number {
    const days = new Set(this.snap.attempts.map((a) => a.timestamp.slice(0, 10)));
    let n = 0;
    const d = new Date(this.now());
    if (!days.has(d.toISOString().slice(0, 10))) d.setUTCDate(d.getUTCDate() - 1); // today not yet done is not a break
    while (days.has(d.toISOString().slice(0, 10))) { n++; d.setUTCDate(d.getUTCDate() - 1); }
    return n;
  }
}

let appPromise: Promise<AppState> | null = null;
export function getApp(): Promise<AppState> { return (appPromise ??= AppState.create()); }
/** Test hook: lets e2e tests reset between navigations. */
export function _resetAppForTests() { appPromise = null; }
export type { ExerciseResult };
