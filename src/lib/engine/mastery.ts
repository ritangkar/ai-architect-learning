// Mastery model, functional spec section 8.1-8.3. Pure functions; all thresholds come from EngineConfig.
import { APPLIED, type Attempt, type EngineConfig, type MasteryState } from './types';

export interface Evidence {
  E: number | null; // evidence score; null if no attempts
  mass: number; // evidence mass M
  n: number; // attempts considered
  state: MasteryState;
  appliedItems: number; // applied attempts considered with score >= applied_min_score
  appliedBest: number;
  firstProficientAt: string | null;
  lastAttemptAt: string | null;
  lo: number; // lower bound of the interval
  hi: number;
  lowEvidence: boolean;
}

export const STATE_ORDER: MasteryState[] = ['unknown', 'gap', 'developing', 'proficient', 'mastered'];
export const stateRank = (s: MasteryState) => STATE_ORDER.indexOf(s);
export const atLeast = (s: MasteryState, min: MasteryState) => stateRank(s) >= stateRank(min);

/** Parses the config expression "<k>/sqrt(mass)". Rejects anything else (config is data, never evaluated). */
export function halfwidth(cfg: EngineConfig, mass: number): number {
  const m = /^\s*([0-9]*\.?[0-9]+)\s*\/\s*sqrt\(\s*mass\s*\)\s*$/.exec(cfg.competency_interval_halfwidth);
  if (!m) throw new Error(`Unsupported competency_interval_halfwidth expression: ${cfg.competency_interval_halfwidth}`);
  return mass > 0 ? parseFloat(m[1]) / Math.sqrt(mass) : Infinity;
}

const byTime = (a: Attempt, b: Attempt) => (a.timestamp < b.timestamp ? -1 : a.timestamp > b.timestamp ? 1 : a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const day = (ts: string) => ts.slice(0, 10);
const DAY_MS = 86400000;

/** Effective score with the overconfidence penalty: negative contribution multiplied (spec 8.2). */
export function effectiveScore(a: Attempt, cfg: EngineConfig): number {
  const o = cfg.overconfidence;
  if ((a.confidence ?? 0) >= o.confidence_min && a.score < o.score_below) return Math.max(0, 1 - o.negative_weight_multiplier * (1 - a.score));
  return a.score;
}

interface Core { E: number | null; mass: number; n: number; window: Attempt[] }
function core(sorted: Attempt[], cfg: EngineConfig): Core {
  const window = sorted.slice(-cfg.max_attempts_considered);
  const n = window.length;
  let num = 0;
  let den = 0;
  window.forEach((a, i) => {
    const decay = Math.pow(cfg.recency_decay_per_newer_attempt, n - 1 - i);
    const w = (cfg.evidence_weights[a.itemType] ?? 1) * decay;
    num += w * effectiveScore(a, cfg);
    den += w;
  });
  return { E: den > 0 ? num / den : null, mass: den, n, window };
}

/** State without the mastered test (needs history). */
function provisionalState(c: Core, cfg: EngineConfig): MasteryState {
  const t = cfg.state_thresholds;
  if (c.E === null || c.mass < t.unknown_below_mass) return 'unknown';
  if (c.E < t.gap_below) return 'gap';
  if (c.E < t.developing_below) return 'developing';
  const appliedOk = c.window.filter((a) => APPLIED.includes(a.itemType) && a.score >= t.proficient.applied_min_score).length;
  if (c.E >= t.proficient.min_score && c.mass >= t.proficient.min_mass && appliedOk >= t.proficient.min_applied_items) return 'proficient';
  return 'developing';
}

export function computeEvidence(attempts: Attempt[], cfg: EngineConfig): Evidence {
  const sorted = [...attempts].sort(byTime);
  const c = core(sorted, cfg);
  const t = cfg.state_thresholds;
  let state = provisionalState(c, cfg);
  // first time the evidence reached proficient (replay prefixes)
  let firstProficientAt: string | null = null;
  for (let k = 1; k <= sorted.length; k++) {
    if (provisionalState(core(sorted.slice(0, k), cfg), cfg) === 'proficient') {
      firstProficientAt = sorted[k - 1].timestamp;
      break;
    }
  }
  const applied = c.window.filter((a) => APPLIED.includes(a.itemType));
  if (state === 'proficient' && c.E !== null) {
    const m = t.mastered;
    const high = applied.filter((a) => a.score >= m.applied_min_score);
    const days = new Set(high.map((a) => day(a.timestamp)));
    const passT = cfg.pass_threshold ?? 0.7;
    const reviewOk =
      firstProficientAt !== null &&
      sorted.some((a) => a.context === 'review' && a.score >= passT && Date.parse(a.timestamp) >= Date.parse(firstProficientAt!) + m.review_after_days * DAY_MS);
    if (c.E >= m.min_score && high.length >= m.min_applied_items && days.size >= m.distinct_days && reviewOk) state = 'mastered';
  }
  const hw = halfwidth(cfg, c.mass);
  const E = c.E;
  return {
    E,
    mass: c.mass,
    n: c.n,
    state,
    appliedItems: applied.filter((a) => a.score >= t.proficient.applied_min_score).length,
    appliedBest: applied.reduce((m, a) => Math.max(m, a.score), 0),
    firstProficientAt,
    lastAttemptAt: sorted.length ? sorted[sorted.length - 1].timestamp : null,
    lo: E === null ? 0 : Math.max(0, E - hw),
    hi: E === null ? 1 : Math.min(1, E + hw),
    lowEvidence: c.n < 3 || c.mass < t.unknown_below_mass,
  };
}

export interface Derived {
  topics: Record<string, Evidence>;
  competencies: Record<string, Evidence & { coverage: { touched: number; total: number } }>;
  orphanAttemptIds: string[];
  orphanTopicIds: string[];
}

/**
 * Recompute everything from the append-only attempt log.
 * Attempts that reference only unknown (removed/renamed) topics are retained but excluded from active metrics and reported as orphans.
 */
export function deriveAll(attempts: Attempt[], topics: { id: string; comps: string[] }[], competencyIds: string[], cfg: EngineConfig, minItemsForCompetency = cfg.initial_assessment.min_items_per_competency_before_stop): Derived {
  const topicSet = new Set(topics.map((t) => t.id));
  const compSet = new Set(competencyIds);
  const byTopic = new Map<string, Attempt[]>();
  const byComp = new Map<string, Attempt[]>();
  const orphanAttemptIds: string[] = [];
  const orphanTopics = new Set<string>();
  for (const a of attempts) {
    const known = a.topics.filter((t) => topicSet.has(t));
    for (const t of a.topics) if (!topicSet.has(t)) orphanTopics.add(t);
    if (!known.length) {
      orphanAttemptIds.push(a.id);
      continue;
    }
    for (const t of known) (byTopic.get(t) ?? byTopic.set(t, []).get(t)!).push(a);
    for (const k of a.competencies.filter((x) => compSet.has(x))) (byComp.get(k) ?? byComp.set(k, []).get(k)!).push(a);
  }
  const outTopics: Record<string, Evidence> = {};
  for (const t of topics) outTopics[t.id] = computeEvidence(byTopic.get(t.id) ?? [], cfg);
  const outComps: Derived['competencies'] = {};
  for (const k of competencyIds) {
    const ev = computeEvidence(byComp.get(k) ?? [], cfg);
    const ts = topics.filter((t) => t.comps.includes(k));
    ev.lowEvidence = ev.n < minItemsForCompetency || ev.mass < cfg.state_thresholds.unknown_below_mass;
    outComps[k] = { ...ev, coverage: { touched: ts.filter((t) => (byTopic.get(t.id)?.length ?? 0) > 0).length, total: ts.length } };
  }
  return { topics: outTopics, competencies: outComps, orphanAttemptIds, orphanTopicIds: [...orphanTopics].sort() };
}

/** Calibration index = mean(confidence/5) - mean(score) over the last N rated items. Positive = overconfident. */
export function calibration(attempts: Attempt[], cfg: EngineConfig, filter?: (a: Attempt) => boolean): { index: number | null; n: number } {
  const rated = attempts.filter((a) => typeof a.confidence === 'number' && (!filter || filter(a))).sort(byTime).slice(-cfg.calibration_window_items);
  if (!rated.length) return { index: null, n: 0 };
  const conf = rated.reduce((s, a) => s + a.confidence! / 5, 0) / rated.length;
  const sc = rated.reduce((s, a) => s + a.score, 0) / rated.length;
  return { index: conf - sc, n: rated.length };
}

export function calibrationLabel(index: number | null, cfg: EngineConfig): 'overconfident' | 'underconfident' | 'calibrated' | 'unknown' {
  if (index === null) return 'unknown';
  const th = cfg.calibration?.flag_threshold ?? 0.15;
  return index > th ? 'overconfident' : index < -th ? 'underconfident' : 'calibrated';
}
