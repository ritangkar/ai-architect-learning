import path from 'node:path';
import { loadContent } from '../../src/lib/content/load';
import { toModel } from '../../src/lib/content/model';
import type { Attempt, EngineConfig, Model } from '../../src/lib/engine/types';

export const REAL = loadContent(path.resolve('content'));
export const CFG: EngineConfig = structuredClone(REAL.content.engine);
export const REAL_MODEL: Model = toModel(REAL.content);

let n = 0;
export function att(p: Partial<Attempt> & { score: number }): Attempt {
  n++;
  return {
    id: p.id ?? `a${String(n).padStart(4, '0')}`,
    itemId: p.itemId ?? `Q${n}`,
    itemType: p.itemType ?? 'mcq',
    timestamp: p.timestamp ?? new Date(Date.UTC(2026, 0, 1, 0, n)).toISOString(),
    contentVersion: '0.3.0',
    topics: p.topics ?? ['T1.1.1'],
    competencies: p.competencies ?? ['C02'],
    response: {},
    timeMs: 1000,
    context: p.context ?? 'quiz',
    ...p,
  } as Attempt;
}
export const at = (day: number, minute = 0) => new Date(Date.UTC(2026, 0, day, 0, minute)).toISOString();

/** A tiny hand-made model for golden recommender outputs. */
export const MINI: Model = {
  topics: [
    { id: 'T1.1.1', title: 'Base A', module: 'M1.1', pillar: 'P1', pre: [], comps: ['C02'], pat: [], verified_case_ids: [] },
    { id: 'T1.1.2', title: 'Base B', module: 'M1.1', pillar: 'P1', pre: ['T1.1.1'], comps: ['C02'], pat: ['PAT01'], verified_case_ids: ['CS-001'] },
    { id: 'T1.2.1', title: 'Mid C', module: 'M1.2', pillar: 'P1', pre: ['T1.1.2'], comps: ['C03'], pat: ['PAT01'], verified_case_ids: ['CS-001'] },
    { id: 'T1.2.2', title: 'Top D', module: 'M1.2', pillar: 'P1', pre: ['T1.2.1'], comps: ['C03'], pat: [], verified_case_ids: [] },
  ],
  modules: { 'M1.1': { pillar: 'P1', title: 'One' }, 'M1.2': { pillar: 'P1', title: 'Two' } },
  competencies: { C02: 'Foundations', C03: 'Retrieval' },
  patterns: { PAT01: 'RAG' },
  cases: [{ id: 'CS-001', title: 'Demo case', company: 'Acme', industry: 'Retail', tier: 'A', prereq_topics: ['T1.1.2', 'T1.2.1'], patterns: ['PAT01'] }],
  exercises: [{ id: 'EX-1', kind: 'architecture_review', title: 'Review it', topics: ['T1.2.1'], competencies: ['C03'] }],
  levels: [{ id: 'L0', name: 'Orientation' }, { id: 'L1', name: 'Foundation' }],
  gates: { levels: { L0: [{ type: 'assessment_completed', min: 1, label: 'x' }], L1: [{ type: 'modules_satisfied', modules: ['M1.1', 'M1.2'], min_state: 'proficient', allow_compressed: true, label: 'y' }] } },
};
