import { describe, it, expect } from 'vitest';
import { computeEvidence, halfwidth, calibration, calibrationLabel, deriveAll, effectiveScore } from '../../src/lib/engine/mastery';
import { att, at, CFG } from './helpers';

const many = (n: number, f: (i: number) => any) => Array.from({ length: n }, (_, i) => att(f(i)));

describe('evidence score and mass (spec 8.1-8.2)', () => {
  it('has no evidence -> unknown', () => {
    const e = computeEvidence([], CFG);
    expect(e.E).toBeNull();
    expect(e.state).toBe('unknown');
  });
  it('matches a hand-computed value with weights and recency decay', () => {
    // mcq 1.0 (w1), scenario 0.5 (w3), mcq 0 (w1); decay .85^(2,1,0)
    const e = computeEvidence([att({ score: 1, timestamp: at(1, 1) }), att({ score: 0.5, itemType: 'scenario', timestamp: at(1, 2) }), att({ score: 0, timestamp: at(1, 3) })], CFG);
    const den = 0.7225 + 3 * 0.85 + 1;
    expect(e.mass).toBeCloseTo(den, 10);
    expect(e.E).toBeCloseTo((0.7225 * 1 + 3 * 0.85 * 0.5) / den, 10);
    expect(e.n).toBe(3);
  });
  it('recent attempts weigh more than old ones', () => {
    const up = computeEvidence([att({ score: 0, timestamp: at(1, 1) }), att({ score: 1, timestamp: at(1, 2) })], CFG).E!;
    const down = computeEvidence([att({ score: 1, timestamp: at(1, 1) }), att({ score: 0, timestamp: at(1, 2) })], CFG).E!;
    expect(up).toBeGreaterThan(down);
  });
  it('only the last max_attempts_considered attempts count', () => {
    const old = many(5, (i) => ({ score: 0, timestamp: at(1, i) }));
    const recent = many(12, (i) => ({ score: 1, timestamp: at(2, i) }));
    const e = computeEvidence([...old, ...recent], CFG);
    expect(e.n).toBe(12);
    expect(e.E).toBeCloseTo(1, 10);
  });
});

describe('state boundaries', () => {
  it('mass below 3 -> unknown, even with perfect scores', () => {
    expect(computeEvidence([att({ score: 1 }), att({ score: 1 })], CFG).state).toBe('unknown'); // mass 1.85
  });
  it('mass exactly 3 is no longer unknown', () => {
    const e = computeEvidence([att({ score: 1, itemType: 'scenario', timestamp: at(1, 1) })], CFG); // mass 3
    expect(e.mass).toBe(3);
    expect(e.state).not.toBe('unknown');
  });
  it('E just under 0.5 is gap; exactly 0.5 is developing', () => {
    const gap = computeEvidence([att({ score: 0.49, itemType: 'scenario' })], CFG);
    const dev = computeEvidence([att({ score: 0.5, itemType: 'scenario' })], CFG);
    expect(gap.state).toBe('gap');
    expect(dev.state).toBe('developing');
  });
  it('E just under 0.7 is developing', () => {
    expect(computeEvidence([att({ score: 0.699, itemType: 'scenario' })], CFG).state).toBe('developing');
  });
  it('proficient needs E>=0.7, mass>=6 and an applied item >=0.7', () => {
    const two = computeEvidence([1, 2, 3].map((m) => att({ score: 0.8, itemType: 'scenario', timestamp: at(1, m) })), CFG);
    expect(two.mass).toBeGreaterThanOrEqual(6);
    expect(two.state).toBe('proficient');
    const lowMass = computeEvidence([att({ score: 0.9, itemType: 'scenario' }), att({ score: 0.9, timestamp: at(1, 5) })], CFG); // mass 3.85 < 6
    expect(lowMass.state).toBe('developing');
  });
  it('AC-F09-2: no proficient or mastered with zero applied evidence, however good the MCQs', () => {
    const cfg = structuredClone(CFG);
    cfg.evidence_weights.mcq = 5; // make mass easy
    const e = computeEvidence(many(12, (i) => ({ score: 1, timestamp: at(1, i) })), cfg);
    expect(e.mass).toBeGreaterThan(6);
    expect(e.E).toBeCloseTo(1);
    expect(e.state).toBe('developing');
    expect(e.appliedItems).toBe(0);
  });
  it('applied item scoring below 0.7 does not satisfy the applied requirement', () => {
    const a = [att({ score: 0.69, itemType: 'scenario', timestamp: at(1, 1) }), ...many(8, (i) => ({ score: 1, timestamp: at(1, 10 + i) }))];
    const e = computeEvidence(a, CFG);
    expect(e.E).toBeGreaterThan(0.7);
    expect(e.state).toBe('developing');
  });
});

describe('mastered', () => {
  const base = () => [
    att({ score: 0.9, itemType: 'scenario', timestamp: at(1, 1) }),
    att({ score: 0.9, itemType: 'scenario', timestamp: at(1, 2) }),
  ];
  it('is not reached without a later correct review', () => {
    const a = [...base(), att({ score: 0.95, itemType: 'scenario', timestamp: at(3, 1) })];
    expect(computeEvidence(a, CFG).state).toBe('proficient');
  });
  it('requires applied items on two different days and a review >=7 days after first proficient', () => {
    const a = [...base(), att({ score: 0.95, itemType: 'scenario', timestamp: at(3, 1) }), att({ score: 0.9, itemType: 'card', context: 'review', timestamp: at(12, 1) })];
    const e = computeEvidence(a, CFG);
    expect(e.firstProficientAt).toBe(at(3, 1)); // two scenarios give mass 5.55 (<6); the third crosses the line
    expect(e.state).toBe('mastered');
  });
  it('a review only 6 days later is not enough', () => {
    const a = [...base(), att({ score: 0.95, itemType: 'scenario', timestamp: at(3, 1) }), att({ score: 0.9, itemType: 'card', context: 'review', timestamp: at(7, 1) })];
    expect(computeEvidence(a, CFG).state).toBe('proficient');
  });
  it('applied items all on the same day are not enough', () => {
    const a = [...base(), att({ score: 0.95, itemType: 'scenario', timestamp: at(1, 3) }), att({ score: 0.9, itemType: 'card', context: 'review', timestamp: at(12, 1) })];
    expect(computeEvidence(a, CFG).state).toBe('proficient');
  });
});

describe('overconfidence (spec 8.2)', () => {
  it('confidence 4-5 with score < 0.4 multiplies the negative contribution by 1.5', () => {
    expect(effectiveScore(att({ score: 0.2, confidence: 5 }), CFG)).toBe(0); // 1 - 1.5*0.8 = -0.2 clamps at 0
    expect(effectiveScore(att({ score: 0.35, confidence: 4 }), CFG)).toBeCloseTo(1 - 1.5 * 0.65, 10);
    expect(effectiveScore(att({ score: 0.2, confidence: 3 }), CFG)).toBe(0.2);
    expect(effectiveScore(att({ score: 0.4, confidence: 5 }), CFG)).toBe(0.4);
  });
  it('lowers the topic estimate relative to the same answers with low confidence', () => {
    const hi = computeEvidence([att({ score: 0.1, confidence: 5, itemType: 'scenario' })], CFG).E!;
    const lo = computeEvidence([att({ score: 0.1, confidence: 2, itemType: 'scenario' })], CFG).E!;
    expect(hi).toBeLessThan(lo);
  });
});

describe('competency interval and derivation', () => {
  it('half-width = 0.5/sqrt(mass), from config', () => {
    expect(halfwidth(CFG, 4)).toBeCloseTo(0.25);
    expect(halfwidth(CFG, 25)).toBeCloseTo(0.1);
  });
  it('rejects unsupported expressions instead of evaluating them', () => {
    const cfg = { ...CFG, competency_interval_halfwidth: 'process.exit(1)' };
    expect(() => halfwidth(cfg, 4)).toThrow();
  });
  it('derives topic and competency state from attempts, and flags orphans', () => {
    const topics = [{ id: 'T1.1.1', comps: ['C02'] }, { id: 'T1.1.2', comps: ['C02'] }];
    const a = [att({ score: 1, itemType: 'scenario' }), att({ score: 0.2, topics: ['T9.9.9'], competencies: ['C02'] })];
    const d = deriveAll(a, topics, ['C02'], CFG);
    expect(d.topics['T1.1.1'].n).toBe(1);
    expect(d.orphanAttemptIds).toEqual([a[1].id]);
    expect(d.orphanTopicIds).toEqual(['T9.9.9']);
    expect(d.competencies.C02.n).toBe(1); // orphan excluded from active metrics
    expect(d.competencies.C02.coverage).toEqual({ touched: 1, total: 2 });
  });
  it('is a pure function of the log: same attempts in any order give the same result', () => {
    const topics = [{ id: 'T1.1.1', comps: ['C02'] }];
    const a = [att({ score: 1, timestamp: at(1, 1) }), att({ score: 0, timestamp: at(1, 2) }), att({ score: 0.5, itemType: 'scenario', timestamp: at(1, 3) })];
    expect(deriveAll([...a].reverse(), topics, ['C02'], CFG)).toEqual(deriveAll(a, topics, ['C02'], CFG));
  });
});

describe('calibration', () => {
  it('= mean(confidence/5) - mean(score), last 20 items', () => {
    const a = [att({ score: 1, confidence: 5 }), att({ score: 0, confidence: 5 }), att({ score: 0, confidence: 5 }), att({ score: 1, confidence: 5 })];
    expect(calibration(a, CFG).index).toBeCloseTo(1 - 0.5);
    expect(calibrationLabel(0.5, CFG)).toBe('overconfident');
    expect(calibrationLabel(-0.4, CFG)).toBe('underconfident');
    expect(calibrationLabel(0.1, CFG)).toBe('calibrated');
    expect(calibration([], CFG).index).toBeNull();
  });
  it('uses only the last calibration_window_items', () => {
    const a = [...many(30, () => ({ score: 0, confidence: 5 })), ...many(20, () => ({ score: 1, confidence: 5 }))];
    expect(calibration(a, CFG).index).toBeCloseTo(0);
    expect(calibration(a, CFG).n).toBe(20);
  });
});
