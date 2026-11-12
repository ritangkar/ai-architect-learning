// Deterministic "what next" recommender (spec 8.4, F12). No randomness: ties break on a date-free seeded hash of the activity id.
import { hashUnit } from './seed';
import { atLeast } from './mastery';
import { prereqMet, topoOrder, type LearnerState } from './learner';
import type { Attempt, Depth, EngineConfig, Model } from './types';

export type Kind = 'learn' | 'case' | 'exercise' | 'revise';
export interface Activity {
  id: string; // learn:T1.1.1 | case:CS-001 | exercise:EX-01 | revise:T1.1.1 | revise:all
  kind: Kind;
  action: 'learn' | 'case' | 'exercise' | 'revise';
  refId: string;
  title: string;
  depth?: Depth;
  minutes: number;
  score: number;
  terms: { gapSeverity: number; unblockValue: number; caseRelevance: number; reviewDue: number; levelFit: number };
  because: string[];
  thenReturnTo?: { caseId: string; title: string };
  forCase?: string;
}
export interface Slot { kind: Kind; primary: Activity; alternatives: Activity[] }
export interface MixShift { rule: string; add: Partial<Record<Kind, number>>; message: string }
export interface Recommendation { slots: Slot[]; mix: Record<Kind, number>; baseMix: Record<Kind, number>; shifts: MixShift[]; mixExplanation: string; candidates: Activity[] }

const KINDS: Kind[] = ['learn', 'case', 'exercise', 'revise'];
const pct = (x: number) => `${Math.round(x * 100)}%`;

function metric(L: LearnerState, name: string): number | boolean {
  const { model } = L.input;
  switch (name) {
    case 'due_cards': return L.dueTotal;
    case 'topics_in_gap': return Object.values(L.derived.topics).filter((e) => e.state === 'gap').length;
    case 'queued_case_prereqs_all_proficient': {
      const id = L.input.profile?.queuedCaseId ?? L.input.profile?.resume?.caseId;
      const c = model.cases.find((x) => x.id === id);
      return !!c && c.prereq_topics.length > 0 && c.prereq_topics.every((t) => atLeast(L.derived.topics[t]?.state ?? 'unknown', 'proficient'));
    }
  }
  throw new Error(`Unsupported mix rule metric: ${name}`);
}
/** Conditions come from config strings: "name>N", "name<N", or a bare boolean metric name. Never eval'd. */
export function evalRule(L: LearnerState, rule: string): boolean {
  const m = /^([a-z_]+)\s*(>=|<=|>|<)\s*(\d+(?:\.\d+)?)$/.exec(rule.trim());
  if (m) {
    const v = metric(L, m[1]) as number;
    const n = parseFloat(m[3]);
    return m[2] === '>' ? v > n : m[2] === '<' ? v < n : m[2] === '>=' ? v >= n : v <= n;
  }
  return !!metric(L, rule.trim());
}
function describeShift(L: LearnerState, s: { when: string; add: Partial<Record<Kind, number>> }): string {
  const k = Object.keys(s.add)[0] as Kind;
  const v = s.add[k]!;
  if (s.when.startsWith('due_cards')) return `${k} raised by ${v} points because ${L.dueTotal} revision cards are due (rule: ${s.when}).`;
  if (s.when.startsWith('topics_in_gap')) return `${k} raised by ${v} points because ${metric(L, 'topics_in_gap')} topics are in gap (rule: ${s.when}).`;
  return `${k} raised by ${v} points because every prerequisite of your queued case is proficient.`;
}

export function computeMix(L: LearnerState): { mix: Record<Kind, number>; base: Record<Kind, number>; shifts: MixShift[] } {
  const r = L.input.cfg.recommender;
  const base = { ...r.session_mix_target } as Record<Kind, number>;
  const pts: Record<Kind, number> = { learn: base.learn * 100, case: base.case * 100, exercise: base.exercise * 100, revise: base.revise * 100 };
  const shifts: MixShift[] = [];
  for (const s of r.mix_shifts) {
    if (!evalRule(L, s.when)) continue;
    for (const [k, v] of Object.entries(s.add)) pts[k as Kind] += v as number;
    shifts.push({ rule: s.when, add: s.add as any, message: describeShift(L, s as any) });
  }
  const sum = KINDS.reduce((a, k) => a + pts[k], 0);
  const mix = Object.fromEntries(KINDS.map((k) => [k, pts[k] / sum])) as Record<Kind, number>;
  return { mix, base, shifts };
}

function weakestCompE(L: LearnerState, topicComps: string[]): number | null {
  const es = topicComps.map((k) => L.derived.competencies[k]).filter((c) => c && c.E !== null && !c.lowEvidence).map((c) => c.E!);
  return es.length ? Math.min(...es) : null;
}
export function gapSeverity(L: LearnerState, topicId: string): number {
  const t = L.input.model.topics.find((x) => x.id === topicId)!;
  const ev = L.derived.topics[topicId];
  const v = L.input.cfg.recommender.gap_severity_values;
  if (ev.state === 'gap') return v.gap;
  if (ev.state === 'unknown') return v.unknown;
  const e = weakestCompE(L, t.comps) ?? ev.E ?? 0;
  return Math.max(0, Math.min(1, 1 - e));
}

export function recommend(L: LearnerState, opts: { exclude?: string[] } = {}): Recommendation {
  const { model, cfg, profile, caseProgress, exerciseResults } = L.input;
  const R = cfg.recommender;
  const mins = R.estimated_minutes ?? { learn: { compress: 15, standard: 60, deep: 120 }, case: 45, exercise: 40, revise: 10 };
  const queuedId = profile?.queuedCaseId ?? profile?.resume?.caseId ?? null;
  const queued = model.cases.find((c) => c.id === queuedId) ?? null;
  const passedCases = new Set(L.casesPassed);
  const passedEx = new Set(exerciseResults.filter((r) => r.passed).map((r) => r.exerciseId));
  const next = L.nextLevel;
  const nextKinds = new Set((next?.conditions ?? []).filter((c) => !c.met).map((c) => c.kind));
  const downstream = (id: string) => model.topics.filter((t) => t.pre.includes(id)).length + model.cases.filter((c) => c.prereq_topics.includes(id)).length;
  const caseOf = (id: string) => model.cases.find((c) => c.id === id)!;

  const raw: Activity[] = [];
  const mk = (a: Omit<Activity, 'score' | 'because'> & { because?: string[] }): Activity => ({ ...a, score: 0, because: a.because ?? [] });

  // learn candidates: topics not yet at proficient/mastered-or-compressed, with prerequisites met (never ahead of prerequisites)
  for (const t of model.topics) {
    const ev = L.derived.topics[t.id];
    const d = L.depth[t.id];
    const done = atLeast(ev.state, 'proficient') && d.depth === 'compress' && L.confirmed[t.id];
    if (done || ev.state === 'mastered') continue;
    if (t.pre.some((p) => !prereqMet(L, p))) continue;
    raw.push(mk({ id: `learn:${t.id}`, kind: 'learn', action: 'learn', refId: t.id, title: t.title, depth: d.depth, minutes: mins.learn[d.depth], terms: { gapSeverity: 0, unblockValue: 0, caseRelevance: 0, reviewDue: 0, levelFit: 0 } }));
  }
  // cases (Tier A and B only; stubs and provisional entries are catalog records, not study material)
  for (const c of model.cases) {
    if (!['A', 'B'].includes(c.tier) || passedCases.has(c.id)) continue;
    const first = routeTarget(L, c.id);
    if (first) {
      const st = L.derived.topics[first].state;
      const depth: Depth = st === 'gap' ? R.routing.gap_depth : R.routing.unknown_depth;
      raw.push(mk({ id: `learn:${first}`, kind: 'case', action: 'learn', refId: first, title: model.topics.find((t) => t.id === first)!.title, depth, minutes: mins.learn[depth], forCase: c.id, thenReturnTo: { caseId: c.id, title: `${c.company}: ${c.title}` }, terms: { gapSeverity: 0, unblockValue: 0, caseRelevance: 0, reviewDue: 0, levelFit: 0 }, because: [`case ${c.id} needs ${first}, which is ${st === 'gap' ? 'in gap' : 'untested'}: study it at ${depth} depth, then return to the case`] }));
    } else {
      raw.push(mk({ id: `case:${c.id}`, kind: 'case', action: 'case', refId: c.id, title: `${c.company}: ${c.title}`, minutes: mins.case, terms: { gapSeverity: 0, unblockValue: 0, caseRelevance: 0, reviewDue: 0, levelFit: 0 } }));
    }
  }
  for (const e of model.exercises) {
    if (e.simulation || passedEx.has(e.id)) continue;
    raw.push(mk({ id: `exercise:${e.id}`, kind: 'exercise', action: 'exercise', refId: e.id, title: e.title, minutes: e.est_minutes ?? mins.exercise, terms: { gapSeverity: 0, unblockValue: 0, caseRelevance: 0, reviewDue: 0, levelFit: 0 } }));
  }
  if (L.dueTotal > 0) {
    raw.push(mk({ id: 'revise:all', kind: 'revise', action: 'revise', refId: 'all', title: 'Revision queue', minutes: Math.min(30, Math.max(mins.revise, Math.ceil(L.dueTotal * 1.5))), terms: { gapSeverity: 0, unblockValue: 0, caseRelevance: 0, reviewDue: 0, levelFit: 0 } }));
    for (const [tid, n] of Object.entries(L.dueByTopic).filter(([, n]) => n >= 2))
      raw.push(mk({ id: `revise:${tid}`, kind: 'revise', action: 'revise', refId: tid, title: `Revise: ${model.topics.find((t) => t.id === tid)!.title} (${n} due)`, minutes: mins.revise, terms: { gapSeverity: 0, unblockValue: 0, caseRelevance: 0, reviewDue: 0, levelFit: 0 } }));
  }

  // dedupe by id; a case-routed variant ("then return to case X") wins over the plain learn variant of the same topic
  raw.sort((a, b) => (b.thenReturnTo ? 1 : 0) - (a.thenReturnTo ? 1 : 0));
  const seen = new Set<string>();
  const cands = raw.filter((a) => (seen.has(a.id) || (opts.exclude ?? []).includes(a.id) ? false : (seen.add(a.id), true)));
  const maxDown = Math.max(1, ...cands.filter((a) => a.action === 'learn').map((a) => downstream(a.refId)));
  const maxDue = Math.max(1, ...Object.values(L.dueByTopic), 1);
  const lvlTopics = L.gateTopicIds;
  const caseTopics = new Set(queued?.prereq_topics ?? []);

  for (const a of cands) {
    const because: string[] = [...a.because];
    let g = 0, u = 0, cr = 0, rd = 0, lf = R.level_fit.otherwise;
    if (a.action === 'learn') {
      const t = model.topics.find((x) => x.id === a.refId)!;
      const ev = L.derived.topics[t.id];
      g = gapSeverity(L, t.id);
      u = downstream(t.id) / maxDown;
      cr = caseTopics.has(t.id) ? 1 : queued && t.pat.some((p) => queued.patterns.includes(p)) ? 0.5 : 0;
      rd = Math.min(1, (L.dueByTopic[t.id] ?? 0) / maxDue);
      lf = lvlTopics.has(t.id) ? R.level_fit.advances_gate : R.level_fit.otherwise;
      if (!a.thenReturnTo) {
        because.push(ev.state === 'gap' ? `${t.id} is a gap (score ${pct(ev.E ?? 0)})` : ev.state === 'unknown' ? `${t.id} has no usable evidence yet` : `${t.id} is ${ev.state} (score ${pct(ev.E ?? 0)})`);
      }
      const dn = downstream(t.id);
      if (dn > 0) because.push(`it unblocks ${dn} downstream topic${dn === 1 ? '' : 's'}/case${dn === 1 ? '' : 's'}`);
      if (cr === 1) because.push(`it is a prerequisite of your queued case ${queuedId}`);
      if (rd > 0) because.push(`${L.dueByTopic[t.id]} revision card(s) for it are due`);
      if (lf === R.level_fit.advances_gate && next) because.push(`it advances the ${next.id} gate`);
      if (a.thenReturnTo) {
        const c = caseOf(a.thenReturnTo.caseId);
        cr = caseTopics.has(t.id) || queuedId === c.id ? 1 : 0.3;
        if (cr === 1) because.push('this case is your queued case');
        if (nextKinds.has('cases_passed')) lf = R.level_fit.advances_gate;
        if (lf === R.level_fit.advances_gate) because.push(`cases count toward the ${next?.id} gate`);
      }
    } else if (a.action === 'case') {
      const c = caseOf(a.refId);
      g = c.prereq_topics.length ? c.prereq_topics.reduce((s, p) => s + gapSeverity(L, p), 0) / c.prereq_topics.length : 0;
      cr = queuedId === c.id ? 1 : queued && c.patterns.some((p) => queued.patterns.includes(p)) ? 0.4 : 0;
      lf = nextKinds.has('cases_passed') ? R.level_fit.advances_gate : R.level_fit.otherwise;
      because.push('all its prerequisite topics are in place');
      if (queuedId === c.id) because.push('it is your queued case');
      if (nextKinds.has('cases_passed')) because.push(`passed case exercises count toward the ${next?.id} gate`);
      because.push(`related topics average ${pct(g)} gap severity`);
    } else if (a.action === 'exercise') {
      const e = model.exercises.find((x) => x.id === a.refId)!;
      g = e.topics.length ? e.topics.reduce((s, p) => s + gapSeverity(L, p), 0) / e.topics.length : 0;
      lf = nextKinds.has('exercise_passed') && e.kind === 'architecture_review' ? R.level_fit.advances_gate : R.level_fit.otherwise;
      because.push(`it applies ${e.topics.join(', ')} (average gap severity ${pct(g)})`);
      if (lf === R.level_fit.advances_gate) because.push(`an architecture review exercise is required for the ${next?.id} gate`);
    } else {
      const n = a.refId === 'all' ? L.dueTotal : L.dueByTopic[a.refId] ?? 0;
      rd = Math.min(1, n / (a.refId === 'all' ? Math.max(1, L.dueTotal) : maxDue));
      g = a.refId === 'all' ? Math.min(1, L.dueTotal / 25) : gapSeverity(L, a.refId);
      lf = nextKinds.has('reviews_current') ? R.level_fit.advances_gate : R.level_fit.otherwise;
      because.push(`${n} revision card(s) are due`);
    }
    a.terms = { gapSeverity: g, unblockValue: u, caseRelevance: cr, reviewDue: rd, levelFit: lf };
    const w = R.weights;
    a.score = w.gapSeverity * g + w.unblockValue * u + w.caseRelevance * cr + w.reviewDue * rd + w.levelFit * lf;
    a.because = because;
  }
  const cmp = (a: Activity, b: Activity) => b.score - a.score || hashUnit(`rec|${a.id}`) - hashUnit(`rec|${b.id}`) || (a.id < b.id ? -1 : 1);
  cands.sort(cmp);

  const { mix, base, shifts } = computeMix(L);
  // Allocate 3 slots by largest remainder over the mix; kinds without candidates are skipped.
  const S = 3;
  const avail = KINDS.filter((k) => cands.some((c) => c.kind === k));
  const share = Object.fromEntries(avail.map((k) => [k, mix[k]])) as Record<Kind, number>;
  const tot = avail.reduce((s, k) => s + share[k], 0) || 1;
  const quota = avail.map((k) => ({ k, q: (share[k] / tot) * S }));
  const alloc: Record<string, number> = {};
  quota.forEach((x) => (alloc[x.k] = Math.floor(x.q)));
  let left = S - Object.values(alloc).reduce((a, b) => a + b, 0);
  quota.sort((a, b) => (b.q - Math.floor(b.q)) - (a.q - Math.floor(a.q)) || hashUnit(`mix|${b.k}`) - hashUnit(`mix|${a.k}`));
  for (let i = 0; left > 0 && quota.length; i++, left--) alloc[quota[i % quota.length].k]++;
  const used = new Set<string>();
  const slots: Slot[] = [];
  for (const k of KINDS) {
    const pool = cands.filter((c) => c.kind === k);
    for (let i = 0; i < (alloc[k] ?? 0); i++) {
      const prim = pool.find((c) => !used.has(c.id));
      if (!prim) break;
      used.add(prim.id);
      const alts = pool.filter((c) => c.id !== prim.id && !used.has(c.id)).slice(0, R.alternatives_per_slot);
      slots.push({ kind: k, primary: prim, alternatives: alts });
    }
  }
  slots.sort((a, b) => cmp(a.primary, b.primary));
  const mixExplanation = shifts.length
    ? `Session balance was shifted from the default (${KINDS.map((k) => `${k} ${pct(base[k])}`).join(', ')}): ${shifts.map((s) => s.message).join(' ')}`
    : `Session balance is the default (${KINDS.map((k) => `${k} ${pct(base[k])}`).join(', ')}); no rule shifted it.`;
  return { slots, mix, baseMix: base, shifts, mixExplanation, candidates: cands };
}

// ---------- case routing and regression ----------
/**
 * Earliest topic to study before a case: the case's unmet prerequisites plus any unmet prerequisites of those
 * (transitively), ordered topologically, so a routed recommendation is never itself ahead of its own prerequisites.
 */
export function routeTarget(L: LearnerState, caseId: string): string | null {
  const { model } = L.input;
  const c = model.cases.find((x) => x.id === caseId);
  if (!c) return null;
  const byId = new Map(model.topics.map((t) => [t.id, t]));
  const need = new Set<string>();
  const walk = (id: string) => {
    if (need.has(id) || prereqMet(L, id)) return;
    need.add(id);
    for (const p of byId.get(id)?.pre ?? []) walk(p);
  };
  c.prereq_topics.forEach(walk);
  if (!need.size) return null;
  const order = new Map(topoOrder(model.topics).map((id, i) => [id, i]));
  return [...need].sort((a, b) => order.get(a)! - order.get(b)!)[0];
}
/** Routing rule (spec 8.4): earliest prerequisite in gap/unknown, or null if the case can be started. */
export function routeCase(L: LearnerState, caseId: string): { topicId: string; depth: Depth; state: string } | null {
  const { model, cfg } = L.input;
  const c = model.cases.find((x) => x.id === caseId);
  if (!c) return null;
  const first = routeTarget(L, c.id);
  if (!first) return null;
  const st = L.derived.topics[first].state;
  return { topicId: first, state: st, depth: st === 'gap' ? cfg.recommender.routing.gap_depth : cfg.recommender.routing.unknown_depth };
}

export interface CaseExerciseOutcome { attempt: Omit<Attempt, 'id'>; regress: boolean; revisitTopics: string[]; passed: boolean }
/**
 * Convert a self-scored case exercise into evidence on the case's prerequisite topics.
 * Below `case_exercise_regression_below` the same attempt lowers those topic estimates (state regression is allowed),
 * revision cards are queued by the caller for `revisitTopics`, and the case is flagged "Revisit before continuing".
 */
export function caseExerciseOutcome(args: { model: Model; cfg: EngineConfig; caseId: string; score: number; timestamp: string; contentVersion: string; response: unknown; confidence?: number; timeMs?: number }): CaseExerciseOutcome {
  const { model, cfg, caseId, score } = args;
  const c = model.cases.find((x) => x.id === caseId);
  if (!c) throw new Error(`Unknown case ${caseId}`);
  const comps = [...new Set(c.prereq_topics.flatMap((t) => model.topics.find((x) => x.id === t)?.comps ?? []))];
  const regress = score < cfg.recommender.case_exercise_regression_below;
  return {
    attempt: { itemId: `case-exercise:${caseId}`, itemType: 'architecture_review', timestamp: args.timestamp, contentVersion: args.contentVersion, topics: c.prereq_topics, competencies: comps, response: args.response, score, confidence: args.confidence, timeMs: args.timeMs ?? 0, context: 'case_exercise', caseId },
    regress,
    revisitTopics: regress ? c.prereq_topics : [],
    passed: score >= (cfg.pass_threshold ?? 0.7),
  };
}
