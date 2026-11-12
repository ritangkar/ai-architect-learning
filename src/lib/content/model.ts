import type { Content } from './types';
import type { Model } from '../engine/types';

/** Client-safe slice of the content that the engine needs. */
export function toModel(c: Content): Model {
  const cardsByTopic: Record<string, number> = {};
  for (const k of c.cards) cardsByTopic[k.topicId] = (cardsByTopic[k.topicId] ?? 0) + 1;
  return {
    topics: c.topics.map((t) => ({ id: t.id, title: t.title, module: t.module, pillar: t.pillar, pre: t.pre, comps: t.comps, pat: t.pat ?? [], verified_case_ids: t.verified_case_ids ?? [], hands: t.hands, sap: !!t.sap_status })),
    modules: c.modules,
    competencies: c.competencies,
    patterns: c.patterns,
    cases: c.cases.map((k) => ({ id: k.id, title: k.title, company: k.company, industry: k.industry, tier: k.tier, prereq_topics: k.prereq_topics, patterns: k.patterns, simulation: k.simulation, category: k.category })),
    exercises: c.exercises.map((e) => ({ id: e.id, kind: e.kind, title: e.title, topics: e.topics, competencies: e.competencies, simulation: e.simulation, est_minutes: e.est_minutes })),
    levels: c.levels,
    gates: c.gates,
    cardsByTopic,
  };
}
