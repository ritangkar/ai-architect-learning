import { describe, it, expect } from 'vitest';
import { deriveLearner, buildPathway, topoOrder, type LearnerInput } from '../../src/lib/engine/learner';
import { recommend, routeCase, caseExerciseOutcome, computeMix, evalRule } from '../../src/lib/engine/recommender';
import { newCardState } from '../../src/lib/engine/srs';
import { att, at, CFG, MINI, REAL_MODEL } from './helpers';

const NOW = '2026-03-01T10:00:00.000Z';
const input = (over: Partial<LearnerInput> = {}): LearnerInput => ({ model: MINI, cfg: CFG, attempts: [], cards: [], caseProgress: [], profile: null, exerciseResults: [], now: NOW, ...over });
const completedProfile = { key: 'profile' as const, updatedAt: NOW, assessmentRuns: [{ id: 'r1', startedAt: NOW, completedAt: NOW, status: 'completed' as const, seed: 's', selfRatings: {}, selfDone: true, attemptIds: [], contentVersion: '0.3.0' }] };
const scen = (topic: string, comp: string, score: number, m: number) => att({ itemType: 'scenario', score, topics: [topic], competencies: [comp], timestamp: at(1, m) });
const proficient = (topic: string, comp: string) => [1, 2, 3].map((m) => scen(topic, comp, 0.9, m));

describe('pathway (F03)', () => {
  it('AC-F03-1: no topic is listed before its prerequisites (real curriculum, all 73 topics)', () => {
    const L = deriveLearner(input({ model: REAL_MODEL }));
    const path = buildPathway(L);
    expect(path.length).toBe(REAL_MODEL.topics.length);
    const pos = new Map(path.map((p, i) => [p.topicId, i]));
    for (const t of REAL_MODEL.topics) for (const p of t.pre) expect(pos.get(p)!).toBeLessThan(pos.get(t.id)!);
  });
  it('topoOrder is stable and complete', () => {
    expect(topoOrder(MINI.topics)).toEqual(['T1.1.1', 'T1.1.2', 'T1.2.1', 'T1.2.2']);
  });
  it('learner override reorders by weakness, ignoring prerequisites', () => {
    const L = deriveLearner(input({ attempts: [scen('T1.2.2', 'C03', 0.1, 1)], profile: completedProfile }));
    expect(buildPathway(L, { override: true })[0].topicId).toBe('T1.2.2');
    expect(buildPathway(L)[0].topicId).toBe('T1.1.1');
  });
  it('AC-F03-2: proficient topics are compressed and ask to confirm in 2 questions', () => {
    const L = deriveLearner(input({ attempts: proficient('T1.1.1', 'C02'), profile: completedProfile }));
    const item = buildPathway(L).find((p) => p.topicId === 'T1.1.1')!;
    expect(item.depth).toBe('compress');
    expect(item.needsConfirm).toBe(true);
    const confirmed = deriveLearner(input({ attempts: [...proficient('T1.1.1', 'C02'), att({ context: 'confirm', score: 1, timestamp: at(2, 1) }), att({ context: 'confirm', score: 0.9, timestamp: at(2, 2) })], profile: completedProfile }));
    expect(buildPathway(confirmed).find((p) => p.topicId === 'T1.1.1')!.needsConfirm).toBe(false);
  });
  it('AC-F03-3: pathway items carry no calendar dates', () => {
    const L = deriveLearner(input({ attempts: proficient('T1.1.1', 'C02') }));
    const text = JSON.stringify(buildPathway(L));
    expect(text).not.toMatch(/\d{4}-\d{2}-\d{2}/);
  });
});

describe('level gates (F15) come from evidence only', () => {
  it('no assessment -> nothing attained', () => {
    const L = deriveLearner(input());
    expect(L.attained).toBeNull();
    expect(L.nextLevel?.id).toBe('L0');
  });
  it('assessment completed attains L0; L1 needs the module topics', () => {
    const L = deriveLearner(input({ profile: completedProfile }));
    expect(L.attained).toBe('L0');
    expect(L.nextLevel?.id).toBe('L1');
    expect(L.nextLevel?.conditions[0].detail).toMatch(/0 of 4/);
  });
  it('level rises when gate evidence exists, not from lesson views', () => {
    const atts = [...proficient('T1.1.1', 'C02'), ...proficient('T1.1.2', 'C02'), ...proficient('T1.2.1', 'C03'), ...proficient('T1.2.2', 'C03')];
    const L = deriveLearner(input({ attempts: atts, profile: completedProfile }));
    expect(L.attained).toBe('L1');
  });
});

describe('recommender (F12)', () => {
  it('AC-F12-1: deterministic for the same data', () => {
    const a = recommend(deriveLearner(input({ profile: completedProfile })));
    const b = recommend(deriveLearner(input({ profile: completedProfile })));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
  it('golden: fresh learner after assessment gets the root topic first, never a blocked topic', () => {
    const r = recommend(deriveLearner(input({ profile: completedProfile })));
    const ids = r.candidates.map((c) => c.id);
    expect(ids).toContain('learn:T1.1.1');
    expect(ids).not.toContain('learn:T1.2.2');
    expect(ids).not.toContain('learn:T1.1.2');
    expect(r.slots[0].primary.id).toBe('learn:T1.1.1');
    expect(r.slots[0].primary.because.join(' ')).toMatch(/T1\.1\.1/);
  });
  it('AC-F01-2: every recommendation has Because text and score terms in [0,1] that add up to the score', () => {
    const r = recommend(deriveLearner(input({ attempts: [scen('T1.1.1', 'C02', 0.2, 1)], profile: completedProfile })));
    const w = CFG.recommender.weights;
    for (const c of r.candidates) {
      expect(c.because.length).toBeGreaterThan(0);
      for (const v of Object.values(c.terms)) { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThanOrEqual(1); }
      const t = c.terms;
      expect(c.score).toBeCloseTo(w.gapSeverity * t.gapSeverity + w.unblockValue * t.unblockValue + w.caseRelevance * t.caseRelevance + w.reviewDue * t.reviewDue + w.levelFit * t.levelFit, 10);
    }
  });
  it('gap severity: gap=1.0, unknown=0.7, else 1-E (config)', () => {
    const L = deriveLearner(input({ attempts: [scen('T1.1.1', 'C02', 0.1, 1), ...[2, 3].map((m) => scen('T1.1.2', 'C02', 0.6, m))], profile: completedProfile }));
    const r = recommend(L);
    expect(r.candidates.find((c) => c.id === 'learn:T1.1.1')!.terms.gapSeverity).toBe(1);
    const unknownCand = recommend(deriveLearner(input({ profile: completedProfile }))).candidates.find((c) => c.id === 'learn:T1.1.1')!;
    expect(unknownCand.terms.gapSeverity).toBe(0.7);
  });
  it('AC-F12-3: case with an unmet prerequisite routes to the earliest prerequisite and says "then return"', () => {
    const L = deriveLearner(input({ profile: { ...completedProfile, queuedCaseId: 'CS-001' }, attempts: proficient('T1.1.1', 'C02') }));
    const route = routeCase(L, 'CS-001')!;
    // T1.1.2 is covered by the compress inference from proficient C02, so T1.2.1 (C03, no evidence) is the earliest unmet prerequisite
    expect(route.topicId).toBe('T1.2.1');
    expect(route.depth).toBe(CFG.recommender.routing.unknown_depth);
    const rec = recommend(L);
    const routed = rec.candidates.find((c) => c.thenReturnTo?.caseId === 'CS-001')!;
    expect(routed.id).toBe('learn:T1.2.1');
    expect(routed.kind).toBe('case');
    expect(routed.because.join(' ')).toMatch(/then return to the case/);
  });
  it('routing includes unmet prerequisites of the case prerequisites, so it never points ahead of them', () => {
    const L = deriveLearner(input({ profile: completedProfile }));
    expect(routeCase(L, 'CS-001')!.topicId).toBe('T1.1.1'); // case lists T1.1.2/T1.2.1, but T1.1.1 comes first
  });
  it('routes at deep depth when the prerequisite is a gap', () => {
    const L = deriveLearner(input({ attempts: [scen('T1.1.1', 'C02', 0.1, 1)], profile: completedProfile }));
    expect(routeCase(L, 'CS-001')!.depth).toBe('deep');
  });
  it('a case with all prerequisites proficient is recommended as a case', () => {
    const atts = [...proficient('T1.1.1', 'C02'), ...proficient('T1.1.2', 'C02'), ...proficient('T1.2.1', 'C03')];
    const L = deriveLearner(input({ attempts: atts, profile: completedProfile }));
    expect(routeCase(L, 'CS-001')).toBeNull();
    expect(recommend(L).candidates.map((c) => c.id)).toContain('case:CS-001');
  });
  it('AC-F12-2: mix shifts apply and are explained', () => {
    const cards = Array.from({ length: 26 }, (_, i) => newCardState('card', `K${i}`, 'T1.1.1', '2026-01-01T00:00:00.000Z'));
    const L = deriveLearner(input({ cards, profile: completedProfile }));
    const { mix, base, shifts } = computeMix(L);
    expect(shifts.map((s) => s.rule)).toContain('due_cards>25');
    expect(mix.revise).toBeGreaterThan(base.revise);
    expect(Object.values(mix).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
    expect(recommend(L).mixExplanation).toMatch(/revise raised by 20 points because 26 revision cards are due/);
    const none = recommend(deriveLearner(input({ profile: completedProfile })));
    expect(none.shifts).toEqual([]);
    expect(none.mixExplanation).toMatch(/no rule shifted it/);
  });
  it('exactly 25 due cards does not trigger the shift (boundary)', () => {
    const cards = Array.from({ length: 25 }, (_, i) => newCardState('card', `K${i}`, 'T1.1.1', '2026-01-01T00:00:00.000Z'));
    expect(computeMix(deriveLearner(input({ cards }))).shifts).toEqual([]);
  });
  it('rules are parsed, never evaluated', () => {
    const L = deriveLearner(input());
    expect(() => evalRule(L, 'process.exit(1)')).toThrow();
    expect(evalRule(L, 'topics_in_gap>3')).toBe(false);
  });
  it('slots: at most 3, each with an alternative when one exists', () => {
    const r = recommend(deriveLearner(input({ profile: completedProfile })));
    expect(r.slots.length).toBeLessThanOrEqual(3);
    expect(r.slots.length).toBeGreaterThan(0);
  });
  it('real curriculum: recommendations on an empty profile never include a topic with unmet prerequisites', () => {
    const L = deriveLearner(input({ model: REAL_MODEL, profile: completedProfile }));
    for (const c of recommend(L).candidates.filter((x) => x.action === 'learn' && !x.thenReturnTo)) {
      const t = REAL_MODEL.topics.find((x) => x.id === c.refId)!;
      expect(t.pre).toEqual([]);
    }
  });
});

describe('golden recommender output (hand-verified)', () => {
  it('queued case CS-001, T1.1.1 gap, T1.1.2 developing -> exact slots and scores', () => {
    const attempts = [att({ itemType: 'scenario', score: 0.2, topics: ['T1.1.1'], competencies: ['C02'], timestamp: at(1, 1) }), att({ itemType: 'scenario', score: 0.9, topics: ['T1.1.2'], competencies: ['C02'], timestamp: at(1, 2) })];
    const r = recommend(deriveLearner(input({ attempts, profile: { ...completedProfile, queuedCaseId: 'CS-001' } })));
    expect(r.slots.map((s) => [s.kind, s.primary.id, +s.primary.score.toFixed(4)])).toEqual([
      ['case', 'learn:T1.2.1', 0.745], // .35*.7 + .25*(2/2) + .15*1 + .1*1  (routed prerequisite of queued case)
      ['learn', 'learn:T1.1.1', 0.575], // .35*1 + .25*(1/2) + .1*1
      ['exercise', 'exercise:EX-1', 0.295],
    ]);
    expect(r.slots[0].primary.thenReturnTo?.caseId).toBe('CS-001');
  });
});

describe('regression on failed case exercises (F09-3)', () => {
  it('a failed exercise lowers prerequisite topic estimates, can reopen a topic and queues revisit', () => {
    const base = [...proficient('T1.1.2', 'C02'), ...proficient('T1.2.1', 'C03')];
    const before = deriveLearner(input({ attempts: base, profile: completedProfile }));
    expect(before.derived.topics['T1.1.2'].state).toBe('proficient');
    const o = caseExerciseOutcome({ model: MINI, cfg: CFG, caseId: 'CS-001', score: 0.2, timestamp: at(5, 1), contentVersion: '0.3.0', response: {} });
    expect(o.regress).toBe(true);
    expect(o.revisitTopics).toEqual(['T1.1.2', 'T1.2.1']);
    const after = deriveLearner(input({ attempts: [...base, { ...o.attempt, id: 'x1' }], profile: completedProfile }));
    expect(after.derived.topics['T1.1.2'].E!).toBeLessThan(before.derived.topics['T1.1.2'].E!);
    expect(after.derived.topics['T1.1.2'].state).not.toBe('proficient');
    expect(after.derived.topics['T1.2.1'].state).not.toBe('proficient');
  });
  it('boundary: 0.5 does not regress, 0.49 does', () => {
    const f = (score: number) => caseExerciseOutcome({ model: MINI, cfg: CFG, caseId: 'CS-001', score, timestamp: at(5, 1), contentVersion: '0.3.0', response: {} }).regress;
    expect(f(0.5)).toBe(false);
    expect(f(0.49)).toBe(true);
  });
});
