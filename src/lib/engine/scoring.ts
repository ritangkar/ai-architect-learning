// Per-item scoring. All scores are in [0,1]. Rubric items: earned/total points.
import type { QType } from './types';

export interface QuestionLike {
  id: string;
  type: QType;
  options?: { id: string; text: string; credit?: number }[];
  correct?: unknown;
  rationales?: { id: string; text: string; valid: boolean }[];
  criteria?: { id: string; weight: number }[];
  model_scores?: Record<string, Record<string, number>>;
  checklist?: { id: string; flaw: boolean }[];
}
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const SCENARIO_CHOICE_SHARE = 0.6;

export function scoreMcq(q: QuestionLike, picked: string[]): number {
  const correct = new Set(Array.isArray(q.correct) ? (q.correct as string[]) : [q.correct as string]);
  const p = new Set(picked);
  let tp = 0;
  let fp = 0;
  for (const x of p) correct.has(x) ? tp++ : fp++;
  return clamp01((tp - fp) / correct.size);
}
export function scoreScenario(q: QuestionLike, r: { choice?: string; rationales?: string[] }): number {
  const opt = q.options?.find((o) => o.id === r.choice);
  const credit = clamp01(opt?.credit ?? 0);
  const valid = (q.rationales ?? []).filter((x) => x.valid).map((x) => x.id);
  if (!q.rationales?.length || !valid.length) return credit;
  const picked = new Set(r.rationales ?? []);
  let tp = 0;
  let fp = 0;
  for (const x of picked) valid.includes(x) ? tp++ : fp++;
  const rat = clamp01((tp - fp) / valid.length);
  return clamp01(SCENARIO_CHOICE_SHARE * credit + (1 - SCENARIO_CHOICE_SHARE) * rat);
}
export function scoreDecisionComparison(q: QuestionLike, r: Record<string, Record<string, number>>): number {
  const crit = q.criteria ?? [];
  const model = q.model_scores ?? {};
  let dev = 0;
  let wsum = 0;
  for (const [opt, row] of Object.entries(model))
    for (const c of crit) {
      const m = row[c.id];
      const l = r?.[opt]?.[c.id];
      if (typeof m !== 'number') continue;
      dev += c.weight * (typeof l === 'number' ? Math.abs(l - m) / 4 : 1);
      wsum += c.weight;
    }
  return wsum ? clamp01(1 - dev / wsum) : 0;
}
export function scoreArchitectureReview(checklist: { id: string; flaw: boolean }[], marked: string[]): number {
  const flaws = checklist.filter((c) => c.flaw).map((c) => c.id);
  if (!flaws.length) return 0;
  const m = new Set(marked);
  let tp = 0;
  let fp = 0;
  for (const x of m) flaws.includes(x) ? tp++ : fp++;
  return clamp01((tp - 0.5 * fp) / flaws.length);
}
export function scoreCard(grade: 'known' | 'almost' | 'missed'): number {
  return grade === 'known' ? 1 : grade === 'almost' ? 0.5 : 0;
}
export function scoreResponse(q: QuestionLike, response: any): number {
  switch (q.type) {
    case 'mcq': return scoreMcq(q, response?.picked ?? []);
    case 'scenario': return scoreScenario(q, response ?? {});
    case 'decision_comparison': return scoreDecisionComparison(q, response?.matrix ?? {});
    case 'architecture_review': return scoreArchitectureReview(q.checklist ?? [], response?.marked ?? []);
    case 'card': return scoreCard(response?.grade ?? 'missed');
  }
}
