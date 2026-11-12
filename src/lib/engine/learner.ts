// Learner state: everything derived from the append-only attempt log plus small mutable records. Also level gates and pathway.
import { deriveAll, atLeast, stateRank, type Derived, type Evidence } from './mastery';
import { assignDepth, type TopicDepth } from './assessment';
import { isDue, type CardState } from './srs';
import type { Attempt, Depth, EngineConfig, MasteryState, Model } from './types';

export interface AssessmentRun {
  id: string;
  startedAt: string;
  completedAt?: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  seed: string;
  selfRatings: Record<string, number>;
  selfDone: boolean;
  pendingItemId?: string;
  attemptIds: string[];
  contentVersion: string;
}
export interface Profile {
  key: 'profile';
  assessmentRuns: AssessmentRun[];
  queuedCaseId?: string | null;
  resume?: { caseId: string; section?: string; viaTopic?: string } | null;
  depthChoice?: Record<string, Depth>;
  updatedAt: string;
}
export interface CaseProgress {
  caseId: string;
  viewedSections: string[];
  exercise?: { score: number; passed: boolean; at: string; attemptId: string; checked: string[] };
  revisitBeforeContinuing?: boolean;
  updatedAt: string;
}
export interface ExerciseResult { exerciseId: string; kind: string; simulation?: boolean; score: number; passed: boolean; at: string }
export interface LearnerInput {
  model: Model;
  cfg: EngineConfig;
  attempts: Attempt[];
  cards: CardState[];
  caseProgress: CaseProgress[];
  profile: Profile | null;
  exerciseResults: ExerciseResult[];
  now: string;
}
export interface GateCondition { label: string; met: boolean; detail: string; topicIds?: string[]; kind: string }
export interface LevelReport { id: string; name: string; met: boolean; conditions: GateCondition[] }
export interface LearnerState {
  derived: Derived;
  depth: Record<string, TopicDepth>;
  confirmed: Record<string, boolean>;
  dueByTopic: Record<string, number>;
  dueTotal: number;
  levels: LevelReport[];
  attained: string | null; // highest consecutive level whose gate is met
  nextLevel: LevelReport | null;
  gateTopicIds: Set<string>;
  casesPassed: string[];
  assessmentsCompleted: number;
  input: LearnerInput;
}

export const ts = (m: Model, id: string) => m.topics.find((t) => t.id === id)!;

export function topicSatisfied(L: Pick<LearnerState, 'derived' | 'depth'>, id: string, min: MasteryState = 'proficient', allowCompressed = true): boolean {
  const ev = L.derived.topics[id];
  if (ev && atLeast(ev.state, min)) return true;
  return allowCompressed && L.depth[id]?.depth === 'compress';
}
/** A prerequisite is "met" unless the learner is in gap or has no usable evidence (and no compress inference). */
export function prereqMet(L: Pick<LearnerState, 'derived' | 'depth'>, id: string): boolean {
  const s = L.derived.topics[id]?.state;
  if (s && s !== 'gap' && s !== 'unknown') return true;
  return L.depth[id]?.depth === 'compress';
}

export function deriveLearner(inp: LearnerInput): LearnerState {
  const { model, cfg, attempts, cards, now } = inp;
  const derived = deriveAll(attempts, model.topics, Object.keys(model.competencies), cfg);
  const depth: Record<string, TopicDepth> = {};
  const hasAssessment = (inp.profile?.assessmentRuns ?? []).some((r) => r.status === 'completed') || attempts.length > 0;
  for (const t of model.topics) {
    const d = assignDepth(t, derived.topics[t.id], derived.competencies, cfg);
    const choice = inp.profile?.depthChoice?.[t.id];
    depth[t.id] = hasAssessment || d.state !== 'unknown' ? d : { ...d, reason: 'Not assessed yet: standard variant.' };
    if (choice) depth[t.id] = { ...depth[t.id], depth: choice, reason: `${depth[t.id].reason} (you chose ${choice}.)` };
  }
  const confirmed: Record<string, boolean> = {};
  for (const t of model.topics) {
    const c = attempts.filter((a) => a.context === 'confirm' && a.topics.includes(t.id));
    confirmed[t.id] = c.length >= 2 && c.slice(-2).reduce((s, a) => s + a.score, 0) / 2 >= (cfg.pass_threshold ?? 0.7);
  }
  const dueByTopic: Record<string, number> = {};
  let dueTotal = 0;
  for (const c of cards) if (isDue(c, now)) { dueByTopic[c.topicId] = (dueByTopic[c.topicId] ?? 0) + 1; dueTotal++; }
  const casesPassed = inp.caseProgress.filter((c) => c.exercise?.passed).map((c) => c.caseId);
  const L: LearnerState = { derived, depth, confirmed, dueByTopic, dueTotal, levels: [], attained: null, nextLevel: null, gateTopicIds: new Set(), casesPassed, assessmentsCompleted: (inp.profile?.assessmentRuns ?? []).filter((r) => r.status === 'completed').length, input: inp };
  evaluateGates(L);
  return L;
}

// ---------- level gates ----------
function evaluateGates(L: LearnerState): void {
  const { model, cfg } = L.input;
  const comps = Object.keys(model.competencies);
  const reports: LevelReport[] = [];
  const caseById = new Map(model.cases.map((c) => [c.id, c]));
  for (const lvl of model.levels) {
    const defs = model.gates.levels[lvl.id] ?? [];
    const conditions: GateCondition[] = defs.map((d: any): GateCondition => {
      switch (d.type) {
        case 'assessment_completed':
          return { kind: d.type, label: d.label, met: L.assessmentsCompleted >= d.min, detail: `${L.assessmentsCompleted} completed assessment run(s); need ${d.min}` };
        case 'modules_satisfied': {
          const ids = model.topics.filter((t) => d.modules.includes(t.module)).map((t) => t.id);
          const ok = ids.filter((id) => topicSatisfied(L, id, d.min_state, !!d.allow_compressed));
          return { kind: d.type, label: d.label, met: ids.length > 0 && ok.length === ids.length, detail: `${ok.length} of ${ids.length} topics satisfied`, topicIds: ids.filter((id) => !ok.includes(id)) };
        }
        case 'competencies_min_state': {
          const list: string[] = d.competencies === 'all' ? comps : d.competencies;
          const bad = list.filter((k) => !atLeast(L.derived.competencies[k]?.state ?? 'unknown', d.min_state));
          return { kind: d.type, label: d.label, met: bad.length === 0, detail: bad.length ? `Below ${d.min_state}: ${bad.join(', ')}` : `All ${list.length} at ${d.min_state} or better`, topicIds: model.topics.filter((t) => t.comps.some((k) => bad.includes(k))).map((t) => t.id) };
        }
        case 'cases_passed': {
          const n = L.casesPassed.filter((id) => d.tiers.includes(caseById.get(id)?.tier ?? '')).length;
          return { kind: d.type, label: d.label, met: n >= d.min, detail: `${n} of ${d.min} cases with a passed exercise` };
        }
        case 'exercise_passed': {
          const n = L.input.exerciseResults.filter((r) => r.kind === d.kind && r.passed).length;
          const avail = model.exercises.filter((e) => e.kind === d.kind).length;
          return { kind: d.type, label: d.label, met: n >= d.min, detail: `${n} passed; ${avail} ${d.kind} exercise(s) available in content` };
        }
        case 'industries_studied': {
          const set = new Set(L.casesPassed.map((id) => caseById.get(id)?.industry).filter(Boolean));
          return { kind: d.type, label: d.label, met: set.size >= d.min, detail: `${set.size} of ${d.min} industries covered by passed case exercises` };
        }
        case 'simulations_passed': {
          const n = L.input.exerciseResults.filter((r) => r.simulation && r.passed).length;
          const avail = model.exercises.filter((e) => e.simulation).length + model.cases.filter((c) => c.simulation).length;
          return { kind: d.type, label: d.label, met: n >= d.min, detail: `${n} passed; ${avail} simulation(s) available in content` };
        }
        case 'reviews_current': {
          const ranked = comps.map((k) => ({ k, e: L.derived.competencies[k]?.E })).filter((x) => x.e !== null).sort((a, b) => a.e! - b.e! || (a.k < b.k ? -1 : 1)).slice(0, d.weakest);
          const topicIds = new Set(model.topics.filter((t) => ranked.some((r) => t.comps.includes(r.k))).map((t) => t.id));
          const due = [...topicIds].reduce((s, id) => s + (L.dueByTopic[id] ?? 0), 0);
          return { kind: d.type, label: d.label, met: ranked.length > 0 && due === 0, detail: ranked.length ? `${due} overdue card(s) across the ${ranked.length} weakest competencies` : 'No competency evidence yet' };
        }
        default:
          return { kind: d.type, label: d.label ?? d.type, met: false, detail: `Unknown gate condition type ${d.type}` };
      }
    });
    reports.push({ id: lvl.id, name: lvl.name, met: conditions.length > 0 && conditions.every((c) => c.met), conditions });
  }
  L.levels = reports;
  let attained: string | null = null;
  for (const r of reports) { if (r.met) attained = r.id; else break; }
  L.attained = attained;
  L.nextLevel = reports.find((r) => !r.met) ?? null;
  const gt = new Set<string>();
  for (const c of L.nextLevel?.conditions ?? []) if (!c.met) c.topicIds?.forEach((t) => gt.add(t));
  L.gateTopicIds = gt;
  void cfg;
}

// ---------- pathway (F03) ----------
export interface PathItem {
  topicId: string;
  state: MasteryState;
  depth: Depth;
  reason: string;
  blocking: string[]; // unmet prerequisites (gap or unknown)
  needsConfirm: boolean; // compressed -> "confirm in 2 questions"
  confirmed: boolean;
  inferred: boolean;
}
/** Stable topological order: Kahn's algorithm, ties broken by blueprint order. */
export function topoOrder(topics: { id: string; pre: string[] }[]): string[] {
  const idx = new Map(topics.map((t, i) => [t.id, i]));
  const indeg = new Map(topics.map((t) => [t.id, t.pre.filter((p) => idx.has(p)).length]));
  const out: string[] = [];
  const ready = topics.filter((t) => indeg.get(t.id) === 0).map((t) => t.id);
  while (ready.length) {
    ready.sort((a, b) => idx.get(a)! - idx.get(b)!);
    const id = ready.shift()!;
    out.push(id);
    for (const t of topics) if (t.pre.includes(id)) {
      indeg.set(t.id, indeg.get(t.id)! - 1);
      if (indeg.get(t.id) === 0) ready.push(t.id);
    }
  }
  return out;
}
export function buildPathway(L: LearnerState, opts: { override?: boolean } = {}): PathItem[] {
  const { model } = L.input;
  const byId = new Map(model.topics.map((t) => [t.id, t]));
  let order = topoOrder(model.topics);
  if (opts.override) {
    // learner override: weakest evidence first, prerequisites ignored
    const sev = (id: string) => { const s = L.derived.topics[id].state; return s === 'gap' ? 0 : s === 'unknown' ? 1 : s === 'developing' ? 2 : 3; };
    const idx = new Map(model.topics.map((t, i) => [t.id, i]));
    order = [...order].sort((a, b) => sev(a) - sev(b) || idx.get(a)! - idx.get(b)!);
  }
  return order.map((id) => {
    const t = byId.get(id)!;
    const d = L.depth[id];
    const blocking = t.pre.filter((p) => !prereqMet(L, p));
    const needsConfirm = d.depth === 'compress' && !L.confirmed[id];
    return { topicId: id, state: L.derived.topics[id].state, depth: d.depth, reason: d.reason, blocking, needsConfirm, confirmed: L.confirmed[id], inferred: d.inferred };
  });
}
export { stateRank };
export type { Evidence };
