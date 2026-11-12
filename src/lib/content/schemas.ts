// Zod schemas consistent with handoff/schemas/*.schema.json (loose: unknown keys pass through, as in the JSON Schemas).
import { z } from 'zod';

export const QTYPES = ['mcq', 'scenario', 'decision_comparison', 'architecture_review', 'card'] as const;
export type QType = (typeof QTYPES)[number];
export const APPLIED_TYPES: QType[] = ['scenario', 'decision_comparison', 'architecture_review'];

const srcId = z.string().regex(/^SRC-\d{3}$/);
const topicId = z.string().regex(/^T[1-3]\.\d+\.\d+$/);
const compId = z.string().regex(/^C\d{2}$/);
const patId = z.string().regex(/^PAT\d{2}$/);

export const TopicSchema = z.looseObject({
  id: topicId,
  title: z.string().min(3),
  module: z.string().regex(/^M[1-3]\.\d+$/),
  pillar: z.enum(['P1', 'P2', 'P3']),
  pre: z.array(z.string()),
  comps: z.array(compId).min(1),
  obj: z.array(z.string()).min(1),
  res: z.array(z.tuple([z.string(), z.string()])),
  pat: z.array(patId).optional(),
  cases: z.array(z.string()).optional(),
  hands: z.enum(['none', 'browser', 'optional_local']),
  sap_status: z.string().nullable().optional(),
  assessment_plan: z.record(z.string(), z.any()),
  verified_case_ids: z.array(z.string().regex(/^CS-\d{3}$/)).optional(),
});
export type Topic = z.infer<typeof TopicSchema>;

export const SourceSchema = z.looseObject({
  id: srcId,
  title: z.string(),
  url: z.url(),
  grade: z.string(),
  supports: z.array(z.string()).optional(),
  verify: z.boolean().optional(),
  verify_reason: z.string().optional(),
  checked_on: z.string().optional(),
});
export type Source = z.infer<typeof SourceSchema>;

const pair = z.tuple([z.string().min(1), z.string()]);
export const DecisionSchema = z.looseObject({
  decision: z.string(),
  selected: z.string(),
  alternatives: z.string(),
  reasoning: z.string(),
  basis: z.string(),
  source: z.string(),
});
export const CaseSchema = z.looseObject({
  id: z.string().regex(/^CS-\d{3}$/),
  company: z.string(),
  industry: z.string(),
  title: z.string(),
  problem: z.string(),
  category: z.array(z.string()).min(1),
  tier: z.enum(['A', 'A-provisional', 'B', 'C']),
  depth: z.string().optional(),
  sources: z.array(srcId).min(1),
  technologies_stated: z.array(z.string()).optional(),
  patterns: z.array(patId),
  prereq_topics: z.array(topicId),
  facts: z.array(pair).min(1),
  interpretations: z.array(pair).optional(),
  reconstructed: z.array(pair).optional(),
  unknown: z.array(z.string()),
  decisions: z.array(DecisionSchema),
  review_exercise: z.string().optional(),
  lessons: z.array(z.string()).optional(),
  adaptation: z.string().optional(),
  simulation: z.boolean().optional(),
});
export type Case = z.infer<typeof CaseSchema>;

const opt = z.looseObject({ id: z.string(), text: z.string() });
export const QuestionSchema = z
  .looseObject({
    id: z.string(),
    type: z.enum(QTYPES),
    topics: z.array(z.string()).min(1),
    competencies: z.array(z.string()).min(1),
    difficulty: z.number().int().min(1).max(5),
    stem: z.string(),
    options: z.array(opt).optional(),
    correct: z.any().optional(),
    explanation: z.string(),
    model_answer: z.string().optional(),
    rubric: z.array(z.looseObject({ criterion: z.string(), points: z.number() })).optional(),
    sourceCaseId: z.string().nullable().optional(),
    status: z.enum(['draft', 'reviewed', 'published']),
    to_verify: z.boolean().optional(),
    constraints: z.array(z.string()).optional(),
    rationales: z.array(z.looseObject({ id: z.string(), text: z.string(), valid: z.boolean() })).optional(),
    criteria: z.array(z.looseObject({ id: z.string(), name: z.string(), weight: z.number() })).optional(),
    model_scores: z.record(z.string(), z.record(z.string(), z.number())).optional(),
    design: z.string().optional(),
    checklist: z.array(z.looseObject({ id: z.string(), text: z.string(), flaw: z.boolean(), explanation: z.string().optional() })).optional(),
  })
  .superRefine((q, ctx) => {
    const bad = (m: string) => ctx.addIssue({ code: 'custom', message: m });
    const ids = new Set((q.options ?? []).map((o) => o.id));
    if (q.type === 'mcq') {
      if ((q.options?.length ?? 0) < 2) bad('mcq needs >= 2 options');
      const cs = Array.isArray(q.correct) ? q.correct : [q.correct];
      if (!cs.length || cs.some((c) => !ids.has(c))) bad('mcq.correct must reference option ids');
    }
    if (q.type === 'scenario') {
      if ((q.options?.length ?? 0) < 2) bad('scenario needs >= 2 options');
      if (!ids.has(q.correct)) bad('scenario.correct must be an option id');
      if ((q.options ?? []).some((o) => typeof (o as any).credit !== 'number')) bad('scenario options need numeric credit (0..1)');
      if (!q.model_answer) bad('scenario needs model_answer');
    }
    if (q.type === 'decision_comparison') {
      if (!q.criteria?.length || (q.options?.length ?? 0) < 2 || !q.model_scores) bad('decision_comparison needs criteria, options, model_scores');
    }
    if (q.type === 'architecture_review') {
      if (!q.design || !q.checklist?.some((c) => c.flaw)) bad('architecture_review needs design and a checklist with at least one flaw');
    }
  });
export type Question = z.infer<typeof QuestionSchema>;

export const CardSchema = z.looseObject({
  id: z.string(),
  topicId: z.string(),
  front: z.string(),
  back: z.string(),
  competencies: z.array(z.string()).optional(),
  status: z.enum(['draft', 'reviewed', 'published']).optional(),
});
export type Card = z.infer<typeof CardSchema>;

export const ResourceSchema = z.looseObject({
  id: z.string(),
  title: z.string(),
  sourceKey: z.string().optional(),
  url: z.string(),
  topics: z.array(z.string()).min(1),
  whyUseful: z.string().min(10),
  focus: z.string().min(5),
  objectiveRelation: z.string().optional(),
  cost: z.enum(['free', 'paid']),
  language: z.string().optional(),
  lastChecked: z.string().optional(),
  status: z.enum(['verified', 'to_verify', 'broken']),
  kind: z.enum(['doc', 'video', 'paper', 'article', 'course', 'spec']).optional(),
  videoId: z.string().optional(),
});
export type Resource = z.infer<typeof ResourceSchema>;

export const LessonFrontmatterSchema = z.looseObject({
  topicId: z.string(),
  depthVariants: z.looseObject({ compress: z.any().optional(), standard: z.any().optional(), deep: z.any().optional() }).optional(),
  lastReviewed: z.string(),
  sources: z.array(z.string()).optional(),
  diagrams: z.array(z.string()).optional(),
  status: z.enum(['draft', 'reviewed', 'published']).optional(),
});
export type LessonFrontmatter = z.infer<typeof LessonFrontmatterSchema>;

export const DiagramSchema = z.looseObject({
  id: z.string(),
  title: z.string(),
  description: z.string().min(10),
  reconstructed: z.boolean().optional(),
  direction: z.enum(['LR', 'TB']).optional(),
  nodes: z.array(z.looseObject({ id: z.string(), label: z.string(), group: z.string().optional() })).min(1),
  edges: z.array(z.looseObject({ from: z.string(), to: z.string(), label: z.string().optional() })),
});
export type Diagram = z.infer<typeof DiagramSchema>;

export const ExerciseSchema = z.looseObject({
  id: z.string(),
  kind: z.enum(['architecture_review', 'options_analysis', 'discovery_drill', 'requirements_critique']),
  title: z.string(),
  summary: z.string(),
  topics: z.array(z.string()).min(1),
  competencies: z.array(z.string()).min(1),
  simulation: z.boolean().optional(),
  scenario: z.string(),
  status: z.enum(['draft', 'reviewed', 'published']),
  est_minutes: z.number().optional(),
  // kind-specific (validated in validate.ts)
  design: z.string().optional(),
  checklist: z.array(z.looseObject({ id: z.string(), text: z.string(), flaw: z.boolean(), explanation: z.string().optional() })).optional(),
  model_findings: z.array(z.string()).optional(),
  options: z.array(z.looseObject({ id: z.string(), name: z.string(), description: z.string() })).optional(),
  criteria: z.array(z.looseObject({ id: z.string(), name: z.string(), weight: z.number() })).optional(),
  guidance: z.string().optional(),
  categories: z.array(z.looseObject({ id: z.string(), name: z.string(), hint: z.string() })).optional(),
  model_questions: z.array(z.looseObject({ category: z.string(), question: z.string() })).optional(),
  requirements: z.array(z.looseObject({ id: z.string(), text: z.string(), defects: z.array(z.string()) })).optional(),
  defect_types: z.array(z.looseObject({ id: z.string(), name: z.string() })).optional(),
});
export type Exercise = z.infer<typeof ExerciseSchema>;

export const ModuleSchema = z.looseObject({ pillar: z.enum(['P1', 'P2', 'P3']), title: z.string() });
export const LevelSchema = z.looseObject({ id: z.string(), name: z.string(), exit_gate: z.string().optional(), entry: z.string().optional() });
export const ResourceSourceSchema = z.looseObject({ name: z.string(), domain_hint: z.string(), url_status: z.string() });
