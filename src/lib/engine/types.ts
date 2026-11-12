export type QType = 'mcq' | 'scenario' | 'decision_comparison' | 'architecture_review' | 'card';
export const APPLIED: QType[] = ['scenario', 'decision_comparison', 'architecture_review'];
export type MasteryState = 'unknown' | 'gap' | 'developing' | 'proficient' | 'mastered';
export type Depth = 'compress' | 'standard' | 'deep';
export type Context = 'initial' | 'quiz' | 'review' | 'exercise' | 'confirm' | 'case_exercise';

/** Append-only evidence record. Never mutated or deleted. */
export interface Attempt {
  id: string;
  itemId: string;
  itemType: QType;
  timestamp: string; // ISO
  contentVersion: string;
  topics: string[];
  competencies: string[];
  response: unknown;
  score: number; // 0..1
  confidence?: number; // 1..5
  timeMs: number;
  seed?: string;
  optionOrder?: string[];
  context: Context;
  runId?: string;
  caseId?: string;
  exerciseId?: string;
}

export interface EngineConfig {
  evidence_weights: Record<string, number>;
  recency_decay_per_newer_attempt: number;
  max_attempts_considered: number;
  state_thresholds: {
    unknown_below_mass: number;
    gap_below: number;
    developing_below: number;
    proficient: { min_score: number; min_mass: number; min_applied_items: number; applied_min_score: number };
    mastered: { min_score: number; min_applied_items: number; applied_min_score: number; distinct_days: number; review_after_days: number };
  };
  overconfidence: { confidence_min: number; score_below: number; negative_weight_multiplier: number };
  competency_interval_halfwidth: string;
  calibration_window_items: number;
  calibration?: { flag_threshold: number };
  initial_assessment: {
    weights: { concept_mcq: number; scenario: number; self_assessment_calibration: number };
    min_items_per_competency_before_stop: number;
    stop_if_interval_above: number;
    stop_if_interval_below: number;
    interval_confidence: number;
    scenario_free_text_is_self_scored: boolean;
    section_pattern?: ('A' | 'B')[];
    max_items_per_competency?: number;
  };
  recommender: {
    weights: Record<'gapSeverity' | 'unblockValue' | 'caseRelevance' | 'reviewDue' | 'levelFit', number>;
    gap_severity_values: { gap: number; unknown: number; other: string };
    level_fit: { advances_gate: number; otherwise: number };
    session_mix_target: Record<'learn' | 'case' | 'exercise' | 'revise', number>;
    mix_shifts: { when: string; add: Partial<Record<'learn' | 'case' | 'exercise' | 'revise', number>> }[];
    routing: { gap_depth: Depth; unknown_depth: Depth; store_resume_pointer: boolean };
    case_exercise_regression_below: number;
    alternatives_per_slot: number;
    tie_break: string;
    estimated_minutes?: { learn: Record<Depth, number>; case: number; exercise: number; revise: number };
  };
  spaced_review: {
    box_intervals_days: number[];
    correct_moves_up: number;
    incorrect_drops: number;
    min_box: number;
    low_confidence_correct_advances: boolean;
    low_confidence_threshold: number;
  };
  backup_reminder: { days: number; new_attempts: number };
  import_max_bytes: number;
  freshness: { stale_after_days: number };
  session_length_hint_minutes: number;
  pass_threshold?: number;
}

export interface ModelTopic { id: string; title: string; module: string; pillar: string; pre: string[]; comps: string[]; pat: string[]; verified_case_ids: string[]; hands?: string; sap?: boolean }
export interface ModelCase { id: string; title: string; company: string; industry: string; tier: string; prereq_topics: string[]; patterns: string[]; simulation?: boolean; category?: string[] }
export interface ModelExercise { id: string; kind: string; title: string; topics: string[]; competencies: string[]; simulation?: boolean; est_minutes?: number }
export interface Model {
  topics: ModelTopic[];
  modules: Record<string, { pillar: string; title: string }>;
  competencies: Record<string, string>;
  patterns: Record<string, string>;
  cases: ModelCase[];
  exercises: ModelExercise[];
  levels: { id: string; name: string; exit_gate?: string }[];
  gates: { levels: Record<string, any[]> };
  cardsByTopic?: Record<string, number>;
}
