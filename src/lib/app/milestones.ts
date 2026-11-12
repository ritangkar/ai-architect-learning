// Subtle milestones (F15). Every milestone states the evidence it was earned from; none is based on lesson views.
import type { AppState } from './state';
import { atLeast } from '../engine/mastery';

export interface Milestone { id: string; title: string; earned: boolean; because: string }

export function milestones(app: AppState): Milestone[] {
  const L = app.learner;
  const core = app.core;
  const out: Milestone[] = [];
  const runs = L.assessmentsCompleted;
  out.push({ id: 'first-assessment', title: 'First assessment completed', earned: runs > 0, because: runs > 0 ? `You completed ${runs} initial assessment run(s).` : 'Complete the initial assessment.' });
  const firstCase = L.casesPassed[0];
  out.push({ id: 'first-case', title: 'First case with a passed review exercise', earned: !!firstCase, because: firstCase ? `Review exercise for ${firstCase} scored at or above the pass threshold.` : 'Study a case and pass its review exercise.' });
  for (const [pid, pname] of Object.entries(core.pillars)) {
    const mods = Object.entries(core.modules).filter(([, m]) => m.pillar === pid).map(([id]) => id);
    const done = mods.find((m) => core.model.topics.filter((t) => t.module === m).every((t) => atLeast(L.derived.topics[t.id].state, 'proficient')));
    out.push({ id: `module-${pid}`, title: `First module proficient in ${pname}`, earned: !!done, because: done ? `Every topic in module ${done} is proficient or better on assessed evidence.` : 'Reach proficient on every topic of one module in this pillar.' });
  }
  const comps = Object.keys(core.competencies);
  const allDev = comps.every((k) => atLeast(L.derived.competencies[k].state, 'developing'));
  out.push({ id: 'all-developing', title: 'All competencies at least developing', earned: allDev, because: allDev ? 'All competency estimates are at developing or better.' : `${comps.filter((k) => !atLeast(L.derived.competencies[k].state, 'developing')).length} competencies are not yet at developing.` });
  const mastered = core.model.topics.find((t) => L.derived.topics[t.id].state === 'mastered');
  out.push({ id: 'first-mastered', title: 'First topic mastered', earned: !!mastered, because: mastered ? `${mastered.id} met every mastery condition, including a correct review after a week.` : 'Mastery needs applied items on two days and a correct review at least 7 days after you first reached proficient.' });
  const reviewed = app.snap.attempts.some((a) => a.context === 'review');
  out.push({ id: 'first-review', title: 'First revision session', earned: reviewed, because: reviewed ? 'You answered revision items.' : 'Answer a card in the review queue.' });
  const exported = !!app.meta.lastExportAt;
  out.push({ id: 'first-backup', title: 'First backup exported', earned: exported, because: exported ? 'You exported your progress.' : 'Export a backup from Settings.' });
  return out;
}

/** Patterns count as studied when a case demonstrating them has been completed and its review exercise passed (spec F09). */
export function patternsStudied(app: AppState): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const id of app.learner.casesPassed) {
    const c = app.core.cases.find((x) => x.id === id);
    for (const p of c?.patterns ?? []) (out[p] ??= []).push(id);
  }
  return out;
}
