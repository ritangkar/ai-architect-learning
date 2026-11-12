// Node-side: shapes the validated content into the JSON bundles that browser islands fetch from /data/*.json.
import type { Content } from '../content/types';
import { toModel } from '../content/model';
import type { EngineConfig, Model } from '../engine/types';

export interface TopicInfo { id: string; title: string; module: string; pillar: string; pre: string[]; comps: string[]; obj: string[]; hands: string; sap_status: string | null; verified_case_ids: string[]; pat: string[]; hasLesson: boolean; lessonStatus: string | null; resources: number; questions: number; cards: number; verifyFlag: boolean }
export interface CaseInfo { id: string; company: string; industry: string; title: string; tier: string; category: string[]; patterns: string[]; tech: string[]; prereq_topics: string[]; depth: string; sources: string[]; simulation: boolean; decisions: number; facts: number; verify: boolean; review_exercise: string | null; lessons: string[] }
export interface ExerciseInfo { id: string; kind: string; title: string; summary: string; topics: string[]; competencies: string[]; simulation: boolean; est_minutes: number | null }
export interface Core {
  site: { siteName: string; contentVersion: string; storageNoticeVersion: string; streakVisibleByDefault: boolean };
  engine: EngineConfig;
  model: Model;
  pillars: Record<string, string>;
  modules: Record<string, { pillar: string; title: string }>;
  competencies: Record<string, string>;
  patterns: Record<string, string>;
  levels: { id: string; name: string; exit_gate?: string }[];
  topics: TopicInfo[];
  cases: CaseInfo[];
  cards: { id: string; topicId: string; front: string; back: string; competencies: string[] }[];
  exercises: ExerciseInfo[];
  sources: { id: string; title: string; grade: string; verify: boolean }[];
  counts: { topics: number; cases: number; casesByTier: Record<string, number>; questions: number; cards: number; lessons: number; resources: number; sources: number; exercises: number };
  catalogNote: string | null;
}

export function buildCore(c: Content): Core {
  const verifySources = new Set(c.sources.filter((s) => s.verify).map((s) => s.id));
  const qCount: Record<string, number> = {};
  for (const q of c.questions) for (const t of q.topics) qCount[t] = (qCount[t] ?? 0) + 1;
  const cCount: Record<string, number> = {};
  for (const k of c.cards) cCount[k.topicId] = (cCount[k.topicId] ?? 0) + 1;
  const rCount: Record<string, number> = {};
  for (const r of c.resources) for (const t of r.topics) rCount[t] = (rCount[t] ?? 0) + 1;
  const casesByTier: Record<string, number> = {};
  for (const k of c.cases) casesByTier[k.tier] = (casesByTier[k.tier] ?? 0) + 1;
  const caseCitesVerify = (id: string) => c.cases.find((k) => k.id === id)!.sources.some((s) => verifySources.has(s));
  return {
    site: c.site,
    engine: c.engine,
    model: toModel(c),
    pillars: c.pillars,
    modules: c.modules,
    competencies: c.competencies,
    patterns: c.patterns,
    levels: c.levels,
    topics: c.topics.map((t) => {
      const lesson = c.lessons.find((l) => l.topicId === t.id);
      const lessonSources = lesson?.frontmatter.sources ?? [];
      return {
        id: t.id, title: t.title, module: t.module, pillar: t.pillar, pre: t.pre, comps: t.comps, obj: t.obj, hands: t.hands, sap_status: t.sap_status ?? null, verified_case_ids: t.verified_case_ids ?? [], pat: t.pat ?? [],
        hasLesson: !!lesson, lessonStatus: lesson?.frontmatter.status ?? null, resources: rCount[t.id] ?? 0, questions: qCount[t.id] ?? 0, cards: cCount[t.id] ?? 0,
        verifyFlag: lessonSources.some((s) => verifySources.has(s)) || (t.verified_case_ids ?? []).some(caseCitesVerify) || !!t.sap_status,
      };
    }),
    cases: c.cases.map((k) => ({
      id: k.id, company: k.company, industry: k.industry, title: k.title, tier: k.tier, category: k.category, patterns: k.patterns, tech: k.technologies_stated ?? [], prereq_topics: k.prereq_topics, depth: k.depth ?? '', sources: k.sources,
      simulation: !!k.simulation, decisions: k.decisions.length, facts: k.facts.length, verify: k.sources.some((s) => verifySources.has(s)), review_exercise: k.review_exercise ?? null, lessons: k.lessons ?? [],
    })),
    cards: c.cards.map((k) => ({ id: k.id, topicId: k.topicId, front: k.front, back: k.back, competencies: k.competencies ?? [] })),
    exercises: c.exercises.map((e) => ({ id: e.id, kind: e.kind, title: e.title, summary: e.summary, topics: e.topics, competencies: e.competencies, simulation: !!e.simulation, est_minutes: e.est_minutes ?? null })),
    sources: c.sources.map((s) => ({ id: s.id, title: s.title, grade: s.grade, verify: !!s.verify })),
    counts: { topics: c.topics.length, cases: c.cases.length, casesByTier, questions: c.questions.length, cards: c.cards.length, lessons: c.lessons.length, resources: c.resources.length, sources: c.sources.length, exercises: c.exercises.length },
    catalogNote: c.catalog.status ?? null,
  };
}
