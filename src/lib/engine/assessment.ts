// Initial assessment: item sampling, adaptive stop rule, results and depth assignment (spec F02, section 8).
import { hashUnit } from './seed';
import { computeEvidence, calibration, calibrationLabel, atLeast, type Evidence } from './mastery';
import type { Attempt, Depth, EngineConfig, MasteryState, Model, ModelTopic } from './types';

export interface BankItem { id: string; type: string; topics: string[]; competencies: string[]; difficulty: number }
export const sectionOf = (type: string): 'A' | 'B' => (type === 'mcq' || type === 'card' ? 'A' : 'B');

export interface CompetencyProgress {
  id: string;
  asked: number;
  available: number;
  stopped: boolean;
  stopReason?: 'confident-high' | 'confident-low' | 'max-items' | 'bank-exhausted';
  ev: Evidence;
}

export function competencyProgress(compId: string, runAttempts: Attempt[], bank: BankItem[], cfg: EngineConfig): CompetencyProgress {
  const ia = cfg.initial_assessment;
  const mine = runAttempts.filter((a) => a.competencies.includes(compId));
  const askedIds = new Set(runAttempts.map((a) => a.itemId));
  const available = bank.filter((q) => q.competencies.includes(compId) && !askedIds.has(q.id)).length;
  const ev = computeEvidence(mine, cfg);
  const asked = mine.length;
  let stopped = false;
  let stopReason: CompetencyProgress['stopReason'];
  if (asked >= ia.min_items_per_competency_before_stop && ev.E !== null) {
    if (ev.lo > ia.stop_if_interval_above) { stopped = true; stopReason = 'confident-high'; }
    else if (ev.hi < ia.stop_if_interval_below) { stopped = true; stopReason = 'confident-low'; }
  }
  if (!stopped && ia.max_items_per_competency && asked >= ia.max_items_per_competency) { stopped = true; stopReason = 'max-items'; }
  if (!stopped && available === 0) { stopped = true; stopReason = 'bank-exhausted'; }
  return { id: compId, asked, available, stopped, stopReason, ev };
}

export interface NextItem { item: BankItem | null; competency: string | null; section: 'A' | 'B' | null; progress: Record<string, CompetencyProgress> }

/**
 * Pick the next question. Deterministic for a given (seed, run attempts, self ratings, bank).
 * Self ratings influence ORDER only (claimed strengths are probed first so over/underconfidence can be measured); they never alter evidence.
 */
export function nextAssessmentItem(args: { bank: BankItem[]; competencies: string[]; runAttempts: Attempt[]; selfRatings: Record<string, number>; seed: string; cfg: EngineConfig }): NextItem {
  const { bank, competencies, runAttempts, selfRatings, seed, cfg } = args;
  const ia = cfg.initial_assessment;
  const progress: Record<string, CompetencyProgress> = {};
  for (const k of competencies) progress[k] = competencyProgress(k, runAttempts, bank, cfg);
  const candidates = competencies.filter((k) => !progress[k].stopped && progress[k].available > 0);
  if (!candidates.length) return { item: null, competency: null, section: null, progress };
  const prio = (k: string) => {
    const p = progress[k];
    const under = p.asked < ia.min_items_per_competency_before_stop ? 0 : 1;
    const hw = p.ev.E === null ? 1e9 : p.ev.hi - p.ev.lo;
    return [under, -hw, -(selfRatings[k] ?? 0), hashUnit(`${seed}|${k}`)] as const;
  };
  candidates.sort((a, b) => {
    const pa = prio(a);
    const pb = prio(b);
    for (let i = 0; i < pa.length; i++) if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
    return 0;
  });
  const k = candidates[0];
  const askedIds = new Set(runAttempts.map((a) => a.itemId));
  const pool = bank.filter((q) => q.competencies.includes(k) && !askedIds.has(q.id));
  const pattern = ia.section_pattern ?? ['A', 'B', 'A', 'B', 'A', 'B', 'A'];
  const want = pattern[progress[k].asked % pattern.length];
  let sub = pool.filter((q) => sectionOf(q.type) === want);
  if (!sub.length) sub = pool;
  // difficulty adapts: step up after a good answer in this competency, down after a poor one
  const mine = runAttempts.filter((a) => a.competencies.includes(k)).sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));
  let target = 3;
  for (const a of mine) target = Math.max(1, Math.min(5, target + (a.score >= 0.7 ? 1 : -1)));
  sub.sort((a, b) => Math.abs(a.difficulty - target) - Math.abs(b.difficulty - target) || hashUnit(`${seed}|${a.id}`) - hashUnit(`${seed}|${b.id}`));
  const item = sub[0];
  return { item, competency: k, section: sectionOf(item.type), progress };
}

// ---------- results ----------
export interface CompetencyResult {
  id: string;
  name: string;
  E: number | null;
  lo: number;
  hi: number;
  mass: number;
  n: number;
  state: MasteryState;
  lowEvidence: boolean;
  selfRating: number | null;
  calibration: number | null; // confidence-based
  calibrationLabel: 'overconfident' | 'underconfident' | 'calibrated' | 'unknown';
  selfGap: number | null; // selfRating/5 - E
  stopReason?: string;
}
export interface TopicDepth { topicId: string; depth: Depth; reason: string; inferred: boolean; state: MasteryState }
export interface AssessmentResults {
  competencies: CompetencyResult[];
  strengths: string[];
  gaps: string[];
  overconfident: string[];
  underconfident: string[];
  lowEvidence: string[];
  itemsAnswered: number;
}

export function buildResults(args: { runAttempts: Attempt[]; selfRatings: Record<string, number>; model: Pick<Model, 'competencies'>; bank: BankItem[]; cfg: EngineConfig }): AssessmentResults {
  const { runAttempts, selfRatings, model, bank, cfg } = args;
  const comps: CompetencyResult[] = Object.entries(model.competencies).map(([id, name]) => {
    const prog = competencyProgress(id, runAttempts, bank, cfg);
    const ev = prog.ev;
    const mine = runAttempts.filter((a) => a.competencies.includes(id));
    const cal = calibration(mine, cfg);
    const selfRating = selfRatings[id] ?? null;
    const selfGap = selfRating !== null && ev.E !== null ? selfRating / 5 - ev.E : null;
    // confidence-based calibration is primary; the self-assessment gap is used when no per-item confidence exists
    const idx = cal.index ?? selfGap;
    const lowEvidence = prog.asked < cfg.initial_assessment.min_items_per_competency_before_stop || ev.mass < cfg.state_thresholds.unknown_below_mass;
    return { id, name, E: ev.E, lo: ev.lo, hi: ev.hi, mass: ev.mass, n: ev.n, state: ev.state, lowEvidence, selfRating, calibration: cal.index, calibrationLabel: lowEvidence ? 'unknown' : calibrationLabel(idx, cfg), selfGap, stopReason: prog.stopReason };
  });
  const ok = (c: CompetencyResult) => !c.lowEvidence && c.E !== null;
  const t = cfg.state_thresholds;
  return {
    competencies: comps,
    strengths: comps.filter((c) => ok(c) && c.E! >= t.proficient.min_score).map((c) => c.id),
    gaps: comps.filter((c) => ok(c) && c.E! < t.developing_below).map((c) => c.id),
    overconfident: comps.filter((c) => c.calibrationLabel === 'overconfident').map((c) => c.id),
    underconfident: comps.filter((c) => c.calibrationLabel === 'underconfident').map((c) => c.id),
    lowEvidence: comps.filter((c) => c.lowEvidence).map((c) => c.id),
    itemsAnswered: runAttempts.length,
  };
}

/**
 * Depth assignment (spec: depth_model). Direct topic evidence wins; where a topic has no evidence of its own,
 * its competencies' estimates are used and the assignment is flagged `inferred` (this never changes mastery state).
 */
export function assignDepth(topic: ModelTopic, topicEv: Evidence, compEv: Record<string, Evidence>, cfg: EngineConfig): TopicDepth {
  const gapDepth = cfg.recommender.routing.gap_depth;
  const unknownDepth = cfg.recommender.routing.unknown_depth;
  if (topicEv.state === 'proficient' || topicEv.state === 'mastered')
    return { topicId: topic.id, depth: 'compress', inferred: false, state: topicEv.state, reason: `Proficient on direct evidence (score ${(topicEv.E! * 100).toFixed(0)}%, ${topicEv.appliedItems} applied item(s) passed): compressed, confirm in 2 questions.` };
  if (topicEv.state === 'gap')
    return { topicId: topic.id, depth: gapDepth, inferred: false, state: 'gap', reason: `Gap on direct evidence (score ${(topicEv.E! * 100).toFixed(0)}%): deep variant with prerequisite refresh.` };
  if (topicEv.state === 'developing')
    return { topicId: topic.id, depth: 'standard', inferred: false, state: 'developing', reason: `Developing (score ${(topicEv.E! * 100).toFixed(0)}%): standard variant.` };
  // unknown at topic level: infer from competencies
  const cs = topic.comps.map((k) => ({ k, ev: compEv[k] })).filter((x) => x.ev && x.ev.E !== null && !x.ev.lowEvidence);
  if (cs.length && cs.every((x) => atLeast(x.ev.state, 'proficient')))
    return { topicId: topic.id, depth: 'compress', inferred: true, state: 'unknown', reason: `No evidence on this topic yet, but ${cs.map((x) => x.k).join(', ')} ${cs.length > 1 ? 'are' : 'is'} proficient overall: compressed, confirm in 2 questions (inferred, not mastery).` };
  const weak = cs.filter((x) => x.ev.state === 'gap');
  if (weak.length)
    return { topicId: topic.id, depth: gapDepth, inferred: true, state: 'unknown', reason: `No evidence on this topic yet; ${weak.map((x) => x.k).join(', ')} showed a gap overall: deep variant.` };
  return { topicId: topic.id, depth: unknownDepth, inferred: false, state: 'unknown', reason: 'Untested: standard variant.' };
}
