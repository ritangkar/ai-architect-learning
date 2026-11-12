import type { Topic, Source, Case, Question, Card, Resource, LessonFrontmatter, Diagram, Exercise } from './schemas';

export interface Lesson { topicId: string; frontmatter: LessonFrontmatter; body: string; file: string }
export interface SapVerification { statusNoteDate: string; lastVerified: string | null; note?: string }
export interface Content {
  site: { siteName: string; contentVersion: string; storageNoticeVersion: string; streakVisibleByDefault: boolean };
  engine: any;
  gates: { levels: Record<string, any[]> };
  pillars: Record<string, string>;
  modules: Record<string, { pillar: string; title: string }>;
  competencies: Record<string, string>;
  patterns: Record<string, string>;
  levels: { id: string; name: string; exit_gate?: string; entry?: string }[];
  resourceSources: Record<string, { name: string; domain_hint: string; url_status: string }>;
  depthModel: Record<string, any>;
  topics: Topic[];
  sources: Source[];
  cases: Case[];
  catalog: { status?: string; backlog?: any[]; coverage_gaps?: string[]; tier_definitions?: Record<string, string> };
  questions: Question[];
  cards: Card[];
  resources: Resource[];
  lessons: Lesson[];
  diagrams: Diagram[];
  exercises: Exercise[];
  sapVerification: Record<string, SapVerification>;
}
export interface Issue { level: 'error' | 'warning'; file: string; path?: string; message: string }
