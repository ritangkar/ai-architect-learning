import type { Attempt } from '../engine/types';
import type { CardState } from '../engine/srs';
import type { CaseProgress, Profile } from '../engine/learner';

export const DB_NAME = 'architect-lab';
export const STORES = ['meta', 'profile', 'attempts', 'topicState', 'cardState', 'caseProgress', 'notes', 'events', 'settings'] as const;
export type StoreName = (typeof STORES)[number];
export const KEY_PATH: Record<StoreName, string> = { meta: 'key', profile: 'key', attempts: 'id', topicState: 'topicId', cardState: 'id', caseProgress: 'caseId', notes: 'id', events: 'id', settings: 'key' };

export interface Meta { key: 'meta'; schemaVersion: number; installId: string; createdAt: string; contentVersionSeen?: string; lastExportAt?: string; attemptsAtLastExport?: number; noticeDismissedVersion?: string }
export interface Settings {
  key: 'settings';
  theme: 'system' | 'light' | 'dark';
  reducedMotion: 'system' | 'on' | 'off';
  density: 'comfortable' | 'compact';
  showStreak: boolean;
  defaultDepth: 'auto' | 'compress' | 'standard' | 'deep';
  sessionMinutes: number;
  updatedAt: string;
}
export interface Note { id: string; kind: 'note' | 'exercise' | 'case'; refId: string; data: any; updatedAt: string }
export interface LearnEvent { id: string; type: 'lessonViewed' | 'caseSectionViewed'; refId: string; timestamp: string }

/** Everything the user owns. `topicState` is a derived cache and is never exported. */
export interface Snapshot {
  profile: Profile | null;
  attempts: Attempt[];
  cardState: CardState[];
  caseProgress: CaseProgress[];
  notes: Note[];
  events: LearnEvent[];
  settings: Settings | null;
}
export const emptySnapshot = (): Snapshot => ({ profile: null, attempts: [], cardState: [], caseProgress: [], notes: [], events: [], settings: null });

export interface KV {
  mode: 'persistent' | 'session';
  getAll<T = any>(store: StoreName): Promise<T[]>;
  get<T = any>(store: StoreName, key: string): Promise<T | undefined>;
  put(store: StoreName, rec: any): Promise<void>;
  putMany(store: StoreName, recs: any[]): Promise<void>;
  delete(store: StoreName, key: string): Promise<void>;
  clear(store: StoreName): Promise<void>;
}
