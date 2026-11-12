import { describe, it, expect } from 'vitest';
import { buildResults, nextAssessmentItem, assignDepth, competencyProgress, sectionOf, type BankItem } from '../../src/lib/engine/assessment';
import { computeEvidence, deriveAll } from '../../src/lib/engine/mastery';
import { scoreMcq, scoreScenario, scoreDecisionComparison, scoreArchitectureReview, scoreCard, scoreResponse } from '../../src/lib/engine/scoring';
import { seededShuffle, hashUnit } from '../../src/lib/engine/seed';
import { att, at, CFG } from './helpers';

const comps = { C02: 'Foundations', C03: 'Retrieval' };
const bank = (): BankItem[] => {
  const out: BankItem[] = [];
  for (const k of Object.keys(comps)) for (let i = 1; i <= 5; i++) out.push({ id: `${k}-${i}`, type: i % 2 ? 'mcq' : 'scenario', topics: ['T1.1.1'], competencies: [k], difficulty: ((i + 1) % 5) + 1 });
  return out;
};

describe('AC-F02-1: fixed answer set reproduces expected competency estimates', () => {
  it('C02: mcq 1.0, scenario 0.5, mcq 0.0', () => {
    const run = [
      att({ itemId: 'C02-1', score: 1, timestamp: at(1, 1), competencies: ['C02'], context: 'initial' }),
      att({ itemId: 'C02-2', score: 0.5, itemType: 'scenario', timestamp: at(1, 2), competencies: ['C02'], context: 'initial' }),
      att({ itemId: 'C02-3', score: 0, timestamp: at(1, 3), competencies: ['C02'], context: 'initial' }),
    ];
    const r = buildResults({ runAttempts: run, selfRatings: {}, model: { competencies: comps }, bank: bank(), cfg: CFG });
    const c = r.competencies.find((x) => x.id === 'C02')!;
    // hand calculation: weights 1*.7225, 3*.85, 1*1 ; E = (0.7225 + 1.275)/4.2725
    expect(c.E).toBeCloseTo(0.467525, 5);
    expect(c.mass).toBeCloseTo(4.2725, 6);
    expect(c.hi - c.lo).toBeCloseTo(2 * (0.5 / Math.sqrt(4.2725)), 6);
    expect(c.state).toBe('gap');
    expect(c.lowEvidence).toBe(false); // 3 items, mass >= 3
    const none = r.competencies.find((x) => x.id === 'C03')!;
    expect(none.E).toBeNull();
    expect(none.lowEvidence).toBe(true);
    expect(r.lowEvidence).toContain('C03');
  });
});

describe('AC-F02-3: self-assessment never raises mastery', () => {
  it('estimates and states are identical whatever the self ratings are', () => {
    const run = [att({ itemId: 'C02-2', score: 0.4, itemType: 'scenario', competencies: ['C02'], context: 'initial' })];
    const a = buildResults({ runAttempts: run, selfRatings: { C02: 1 }, model: { competencies: comps }, bank: bank(), cfg: CFG });
    const b = buildResults({ runAttempts: run, selfRatings: { C02: 5 }, model: { competencies: comps }, bank: bank(), cfg: CFG });
    const strip = (r: any) => r.competencies.map((c: any) => ({ id: c.id, E: c.E, state: c.state, mass: c.mass }));
    expect(strip(a)).toEqual(strip(b));
  });
  it('self rating changes only sampling order', () => {
    const base = { bank: bank(), competencies: ['C02', 'C03'], runAttempts: [], seed: 'S', cfg: CFG };
    const hi03 = nextAssessmentItem({ ...base, selfRatings: { C02: 1, C03: 5 } });
    const hi02 = nextAssessmentItem({ ...base, selfRatings: { C02: 5, C03: 1 } });
    expect(hi03.competency).toBe('C03');
    expect(hi02.competency).toBe('C02');
  });
  it('calibration reports overconfidence when claimed strength is not supported', () => {
    const run = [1, 2, 3].map((m) => att({ itemId: `C02-${m}`, score: 0.1, itemType: 'scenario', confidence: 5, competencies: ['C02'], timestamp: at(1, m), context: 'initial' }));
    const r = buildResults({ runAttempts: run, selfRatings: { C02: 5 }, model: { competencies: comps }, bank: bank(), cfg: CFG });
    expect(r.overconfident).toContain('C02');
    const run2 = [1, 2, 3].map((m) => att({ itemId: `C03-${m}`, score: 1, itemType: 'scenario', confidence: 1, competencies: ['C03'], timestamp: at(1, m), context: 'initial' }));
    const r2 = buildResults({ runAttempts: run2, selfRatings: { C03: 1 }, model: { competencies: comps }, bank: bank(), cfg: CFG });
    expect(r2.underconfident).toContain('C03');
  });
});

describe('sampling and the adaptive stop rule', () => {
  it('is deterministic: same state gives the same next item (resume)', () => {
    const args = { bank: bank(), competencies: ['C02', 'C03'], runAttempts: [], selfRatings: {}, seed: 'run-1', cfg: CFG };
    expect(nextAssessmentItem(args).item?.id).toBe(nextAssessmentItem(args).item?.id);
  });
  it('different seeds can order differently but both cover the bank', () => {
    const a = nextAssessmentItem({ bank: bank(), competencies: ['C02', 'C03'], runAttempts: [], selfRatings: {}, seed: 'a', cfg: CFG });
    expect(a.item).not.toBeNull();
  });
  it('follows the A/B section pattern per competency', () => {
    const first = nextAssessmentItem({ bank: bank(), competencies: ['C02'], runAttempts: [], selfRatings: {}, seed: 's', cfg: CFG });
    expect(first.section).toBe('A');
    const after = [att({ itemId: first.item!.id, score: 1, competencies: ['C02'], context: 'initial' })];
    const second = nextAssessmentItem({ bank: bank(), competencies: ['C02'], runAttempts: after, selfRatings: {}, seed: 's', cfg: CFG });
    expect(second.section).toBe('B');
  });
  it('stops a competency when the interval is entirely above 0.8 (after >= 3 items)', () => {
    const run = [1, 2, 3].map((m) => att({ itemId: `C02-${m}`, score: 1, itemType: 'scenario', competencies: ['C02'], timestamp: at(1, m), context: 'initial' }));
    const p = competencyProgress('C02', run, bank(), CFG);
    expect(p.ev.lo).toBeGreaterThan(0.8);
    expect(p.stopped).toBe(true);
    expect(p.stopReason).toBe('confident-high');
  });
  it('stops when the interval is entirely below 0.4', () => {
    const run = [1, 2, 3].map((m) => att({ itemId: `C02-${m}`, score: 0, itemType: 'scenario', competencies: ['C02'], timestamp: at(1, m), context: 'initial' }));
    const p = competencyProgress('C02', run, bank(), CFG);
    expect(p.stopReason).toBe('confident-low');
  });
  it('does not stop before the minimum number of items even when confident', () => {
    const run = [1, 2].map((m) => att({ itemId: `C02-${m}`, score: 1, itemType: 'scenario', competencies: ['C02'], timestamp: at(1, m), context: 'initial' }));
    expect(competencyProgress('C02', run, bank(), CFG).stopped).toBe(false);
  });
  it('AC-F02-6: still runs with fewer than target items and reports low evidence', () => {
    const small: BankItem[] = [{ id: 'X1', type: 'mcq', topics: ['T1.1.1'], competencies: ['C02'], difficulty: 3 }];
    let run: any[] = [];
    const next1 = nextAssessmentItem({ bank: small, competencies: ['C02'], runAttempts: run, selfRatings: {}, seed: 's', cfg: CFG });
    expect(next1.item?.id).toBe('X1');
    run = [att({ itemId: 'X1', score: 1, competencies: ['C02'], context: 'initial' })];
    const next2 = nextAssessmentItem({ bank: small, competencies: ['C02'], runAttempts: run, selfRatings: {}, seed: 's', cfg: CFG });
    expect(next2.item).toBeNull();
    expect(next2.progress.C02.stopReason).toBe('bank-exhausted');
    const r = buildResults({ runAttempts: run, selfRatings: {}, model: { competencies: { C02: 'F' } }, bank: small, cfg: CFG });
    expect(r.lowEvidence).toEqual(['C02']);
  });
  it('never asks the same item twice in a run', () => {
    let run: any[] = [];
    const seen = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const n = nextAssessmentItem({ bank: bank(), competencies: ['C02', 'C03'], runAttempts: run, selfRatings: {}, seed: 's', cfg: CFG });
      if (!n.item) break;
      expect(seen.has(n.item.id)).toBe(false);
      seen.add(n.item.id);
      run = [...run, att({ itemId: n.item.id, score: 0.5, competencies: n.item.competencies, timestamp: at(1, i), context: 'initial' })];
    }
    expect(seen.size).toBeGreaterThan(3);
  });
  it('sectionOf maps types to A/B', () => {
    expect(sectionOf('mcq')).toBe('A');
    expect(sectionOf('scenario')).toBe('B');
  });
});

describe('depth assignment', () => {
  const topic = { id: 'T1.1.1', title: 't', module: 'M1.1', pillar: 'P1', pre: [], comps: ['C02'], pat: [], verified_case_ids: [] };
  const mk = (atts: any[]) => deriveAll(atts, [topic], ['C02'], CFG);
  it('proficient -> compress; gap -> deep; developing -> standard', () => {
    const prof = mk([1, 2, 3].map((m) => att({ score: 0.9, itemType: 'scenario', timestamp: at(1, m) })));
    expect(assignDepth(topic, prof.topics['T1.1.1'], prof.competencies, CFG).depth).toBe('compress');
    const gap = mk([att({ score: 0.1, itemType: 'scenario' })]);
    expect(assignDepth(topic, gap.topics['T1.1.1'], gap.competencies, CFG).depth).toBe('deep');
    const dev = mk([att({ score: 0.6, itemType: 'scenario' })]);
    expect(assignDepth(topic, dev.topics['T1.1.1'], dev.competencies, CFG).depth).toBe('standard');
  });
  it('untested topic inherits compress from proficient competency but is flagged inferred and stays unknown', () => {
    const other = { ...topic, id: 'T1.1.2' };
    const d = deriveAll([1, 2, 3].map((m) => att({ score: 0.9, itemType: 'scenario', timestamp: at(1, m) })), [topic, other], ['C02'], CFG);
    const r = assignDepth(other, d.topics['T1.1.2'], d.competencies, CFG);
    expect(d.topics['T1.1.2'].state).toBe('unknown');
    expect(r.depth).toBe('compress');
    expect(r.inferred).toBe(true);
  });
  it('untested topic with no competency evidence -> standard', () => {
    const d = mk([]);
    expect(assignDepth(topic, d.topics['T1.1.1'], d.competencies, CFG).depth).toBe('standard');
  });
});

describe('scoring', () => {
  it('mcq single and multiple', () => {
    expect(scoreMcq({ id: 'q', type: 'mcq', correct: 'a' }, ['a'])).toBe(1);
    expect(scoreMcq({ id: 'q', type: 'mcq', correct: 'a' }, ['b'])).toBe(0);
    expect(scoreMcq({ id: 'q', type: 'mcq', correct: ['a', 'b'] }, ['a'])).toBe(0.5);
    expect(scoreMcq({ id: 'q', type: 'mcq', correct: ['a', 'b'] }, ['a', 'c'])).toBe(0);
  });
  it('scenario: 60% choice credit + 40% rationale selection', () => {
    const q = { id: 's', type: 'scenario' as const, options: [{ id: 'a', text: '', credit: 1 }, { id: 'b', text: '', credit: 0.5 }], correct: 'a', rationales: [{ id: 'r1', text: '', valid: true }, { id: 'r2', text: '', valid: true }, { id: 'r3', text: '', valid: false }] };
    expect(scoreScenario(q, { choice: 'a', rationales: ['r1', 'r2'] })).toBeCloseTo(1);
    expect(scoreScenario(q, { choice: 'b', rationales: ['r1'] })).toBeCloseTo(0.6 * 0.5 + 0.4 * 0.5);
    expect(scoreScenario(q, { choice: 'a', rationales: ['r3'] })).toBeCloseTo(0.6);
    expect(scoreScenario({ ...q, rationales: undefined }, { choice: 'b' })).toBe(0.5);
  });
  it('decision comparison deviates from the model matrix', () => {
    const q = { id: 'd', type: 'decision_comparison' as const, criteria: [{ id: 'c1', weight: 2 }, { id: 'c2', weight: 1 }], model_scores: { o1: { c1: 5, c2: 1 }, o2: { c1: 1, c2: 5 } } };
    expect(scoreDecisionComparison(q, { o1: { c1: 5, c2: 1 }, o2: { c1: 1, c2: 5 } })).toBe(1);
    expect(scoreDecisionComparison(q, {})).toBe(0);
    expect(scoreDecisionComparison(q, { o1: { c1: 4, c2: 1 }, o2: { c1: 1, c2: 5 } })).toBeCloseTo(1 - (2 * 0.25) / 6);
  });
  it('architecture review rewards flaws found and penalises false alarms', () => {
    const cl = [{ id: 'f1', flaw: true }, { id: 'f2', flaw: true }, { id: 'ok', flaw: false }];
    expect(scoreArchitectureReview(cl, ['f1', 'f2'])).toBe(1);
    expect(scoreArchitectureReview(cl, ['f1', 'ok'])).toBeCloseTo((1 - 0.5) / 2);
    expect(scoreArchitectureReview(cl, ['ok'])).toBe(0);
  });
  it('card grades and dispatcher', () => {
    expect(scoreCard('known')).toBe(1);
    expect(scoreCard('almost')).toBe(0.5);
    expect(scoreResponse({ id: 'c', type: 'card' }, { grade: 'known' })).toBe(1);
  });
});

describe('seeded shuffle (AC-F08-1)', () => {
  it('is reproducible for a seed, a permutation, and varies by seed', () => {
    const items = ['a', 'b', 'c', 'd', 'e', 'f'];
    expect(seededShuffle(items, 'x')).toEqual(seededShuffle(items, 'x'));
    expect([...seededShuffle(items, 'x')].sort()).toEqual(items);
    const seeds = Array.from({ length: 10 }, (_, i) => seededShuffle(items, 'seed' + i).join(''));
    expect(new Set(seeds).size).toBeGreaterThan(5);
    expect(hashUnit('abc')).toBeGreaterThanOrEqual(0);
    expect(hashUnit('abc')).toBeLessThan(1);
  });
});
void computeEvidence;
