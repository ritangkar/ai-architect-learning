// Leitner-style spaced review (spec F11). Dates schedule revision only; they are not curriculum deadlines.
import type { EngineConfig } from './types';

export interface CardState {
  id: string; // `card:<cardId>` or `q:<questionId>`
  kind: 'card' | 'question';
  refId: string;
  topicId: string;
  competencies?: string[];
  box: number; // 1-based
  dueAt: string; // ISO
  lastReviewedAt?: string;
  snoozedUntil?: string;
  reviews: number;
  lapses: number;
  updatedAt: string;
}
const DAY = 86400000;
export const addDays = (iso: string, days: number) => new Date(Date.parse(iso) + days * DAY).toISOString();

export function newCardState(kind: 'card' | 'question', refId: string, topicId: string, now: string, competencies?: string[]): CardState {
  return { id: `${kind === 'card' ? 'card' : 'q'}:${refId}`, kind, refId, topicId, competencies, box: 1, dueAt: now, reviews: 0, lapses: 0, updatedAt: now };
}

/** Apply a review result. `correct` is judged by the caller (score >= pass threshold). */
export function reviewCard(s: CardState, r: { correct: boolean; confidence?: number }, now: string, cfg: EngineConfig): CardState {
  const c = cfg.spaced_review;
  const maxBox = c.box_intervals_days.length;
  let box = s.box;
  let lapses = s.lapses;
  if (r.correct) {
    const lowConf = typeof r.confidence === 'number' && r.confidence <= c.low_confidence_threshold;
    if (!(lowConf && !c.low_confidence_correct_advances)) box = Math.min(maxBox, box + c.correct_moves_up);
  } else {
    box = Math.max(c.min_box, box - c.incorrect_drops);
    lapses++;
  }
  return { ...s, box, lapses, reviews: s.reviews + 1, lastReviewedAt: now, dueAt: addDays(now, c.box_intervals_days[box - 1]), snoozedUntil: undefined, updatedAt: now };
}
export const snoozeCard = (s: CardState, days: number, now: string): CardState => ({ ...s, snoozedUntil: addDays(now, days), updatedAt: now });
export const resetCard = (s: CardState, now: string): CardState => ({ ...s, box: 1, dueAt: now, snoozedUntil: undefined, updatedAt: now });
export const isDue = (s: CardState, now: string) => s.dueAt <= now && !(s.snoozedUntil && s.snoozedUntil > now);

/** Due queue ordered by overdue time (most overdue first), then by weaker competency first. */
export function dueQueue(states: CardState[], now: string, weakness: (s: CardState) => number = () => 0): CardState[] {
  return states
    .filter((s) => isDue(s, now))
    .sort((a, b) => (a.dueAt < b.dueAt ? -1 : a.dueAt > b.dueAt ? 1 : weakness(b) - weakness(a) || (a.id < b.id ? -1 : 1)));
}
