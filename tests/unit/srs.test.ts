import { describe, it, expect } from 'vitest';
import { newCardState, reviewCard, snoozeCard, resetCard, dueQueue, isDue, addDays } from '../../src/lib/engine/srs';
import { CFG } from './helpers';

const NOW = '2026-03-01T10:00:00.000Z';
const fresh = () => newCardState('card', 'K1', 'T1.1.1', NOW);

describe('spaced review (F11)', () => {
  it('new cards are due immediately in box 1', () => {
    const s = fresh();
    expect(s.box).toBe(1);
    expect(isDue(s, NOW)).toBe(true);
  });
  it('correct moves up one box; interval comes from config', () => {
    const s = reviewCard(fresh(), { correct: true, confidence: 4 }, NOW, CFG);
    expect(s.box).toBe(2);
    expect(s.dueAt).toBe(addDays(NOW, CFG.spaced_review.box_intervals_days[1]));
  });
  it('incorrect drops two boxes with a floor of min_box', () => {
    let s = { ...fresh(), box: 5 };
    s = reviewCard(s, { correct: false }, NOW, CFG);
    expect(s.box).toBe(3);
    s = reviewCard(s, { correct: false }, NOW, CFG);
    expect(s.box).toBe(1);
    s = reviewCard(s, { correct: false }, NOW, CFG);
    expect(s.box).toBe(1);
    expect(s.lapses).toBe(3);
  });
  it('box never exceeds the last interval', () => {
    let s = { ...fresh(), box: 6 };
    s = reviewCard(s, { correct: true, confidence: 5 }, NOW, CFG);
    expect(s.box).toBe(6);
  });
  it('low-confidence correct answers do not advance (configurable)', () => {
    const s = reviewCard(fresh(), { correct: true, confidence: 2 }, NOW, CFG);
    expect(s.box).toBe(1);
    const cfg = structuredClone(CFG);
    cfg.spaced_review.low_confidence_correct_advances = true;
    expect(reviewCard(fresh(), { correct: true, confidence: 2 }, NOW, cfg).box).toBe(2);
  });
  it('penalties and moves are read from configuration', () => {
    const cfg = structuredClone(CFG);
    cfg.spaced_review.incorrect_drops = 1;
    cfg.spaced_review.correct_moves_up = 2;
    expect(reviewCard({ ...fresh(), box: 3 }, { correct: false }, NOW, cfg).box).toBe(2);
    expect(reviewCard(fresh(), { correct: true, confidence: 5 }, NOW, cfg).box).toBe(3);
  });
  it('snooze hides a card until the snooze ends; reset returns it to box 1 due now', () => {
    const s = snoozeCard({ ...fresh(), box: 4 }, 3, NOW);
    expect(isDue(s, NOW)).toBe(false);
    expect(isDue(s, addDays(NOW, 3))).toBe(true);
    const r = resetCard(s, NOW);
    expect(r.box).toBe(1);
    expect(isDue(r, NOW)).toBe(true);
  });
  it('queue is ordered by overdue time, then competency weakness; overdue items simply accumulate', () => {
    const a = { ...fresh(), id: 'card:A', dueAt: '2026-02-01T00:00:00.000Z' };
    const b = { ...fresh(), id: 'card:B', dueAt: '2026-02-20T00:00:00.000Z' };
    const c = { ...fresh(), id: 'card:C', dueAt: '2026-02-20T00:00:00.000Z' };
    const future = { ...fresh(), id: 'card:F', dueAt: '2026-04-01T00:00:00.000Z' };
    const q = dueQueue([b, future, c, a], NOW, (s) => (s.id === 'card:C' ? 1 : 0));
    expect(q.map((x) => x.id)).toEqual(['card:A', 'card:C', 'card:B']);
  });
});
