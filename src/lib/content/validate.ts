// Relational build-time validators (functional spec section 6 / AC-F03-4, AC-F06-3, AC-F08-4).
import type { Content, Issue } from './types';

const err = (file: string, message: string, path?: string): Issue => ({ level: 'error', file, path, message });
const warn = (file: string, message: string, path?: string): Issue => ({ level: 'warning', file, path, message });

export function findCycle(topics: { id: string; pre: string[] }[]): string[] | null {
  const pre = new Map(topics.map((t) => [t.id, t.pre]));
  const state = new Map<string, 0 | 1 | 2>();
  const stack: string[] = [];
  let found: string[] | null = null;
  const visit = (id: string): void => {
    if (found) return;
    state.set(id, 1);
    stack.push(id);
    for (const p of pre.get(id) ?? []) {
      if (!pre.has(p)) continue;
      if (state.get(p) === 1) {
        found = [...stack.slice(stack.indexOf(p)), p];
        return;
      }
      if (!state.get(p)) visit(p);
      if (found) return;
    }
    stack.pop();
    state.set(id, 2);
  };
  for (const t of topics) if (!state.get(t.id)) visit(t.id);
  return found;
}

function dupes(ids: string[]): string[] {
  const seen = new Set<string>();
  const d = new Set<string>();
  for (const i of ids) (seen.has(i) ? d : seen).add(i);
  return [...d];
}

export function validateContent(c: Content): Issue[] {
  const out: Issue[] = [];
  const topicIds = new Set(c.topics.map((t) => t.id));
  const topicById = new Map(c.topics.map((t) => [t.id, t]));
  const sourceIds = new Set(c.sources.map((s) => s.id));
  const caseIds = new Set(c.cases.map((x) => x.id));

  for (const [label, ids] of [
    ['topic', c.topics.map((t) => t.id)],
    ['case', c.cases.map((x) => x.id)],
    ['source', c.sources.map((x) => x.id)],
    ['question', c.questions.map((x) => x.id)],
    ['card', c.cards.map((x) => x.id)],
    ['resource', c.resources.map((x) => x.id)],
    ['exercise', c.exercises.map((x) => x.id)],
    ['diagram', c.diagrams.map((x) => x.id)],
  ] as [string, string[]][])
    for (const d of dupes(ids)) out.push(err(label + 's', `Duplicate ${label} id ${d}`));

  // topics
  for (const t of c.topics) {
    const f = `topic ${t.id}`;
    for (const p of t.pre) {
      if (p === t.id) out.push(err(f, 'Topic lists itself as prerequisite', 'pre'));
      else if (!topicIds.has(p)) out.push(err(f, `Dangling prerequisite ${p}`, 'pre'));
    }
    for (const k of t.comps) if (!(k in c.competencies)) out.push(err(f, `Unknown competency ${k}`, 'comps'));
    if (!t.comps.length) out.push(err(f, 'Topic has no competency', 'comps'));
    for (const p of t.pat ?? []) if (!(p in c.patterns)) out.push(err(f, `Unknown pattern ${p}`, 'pat'));
    const m = c.modules[t.module];
    if (!m) out.push(err(f, `Unknown module ${t.module}`, 'module'));
    else if (m.pillar !== t.pillar) out.push(err(f, `Pillar ${t.pillar} does not match module pillar ${m.pillar}`, 'pillar'));
    for (const [k] of t.res) if (k !== 'VIDEO' && !(k in c.resourceSources)) out.push(warn(f, `Resource slot key ${k} not in resource_sources`, 'res'));
    const derived = c.cases.filter((x) => x.prereq_topics.includes(t.id)).map((x) => x.id).sort();
    const declared = [...(t.verified_case_ids ?? [])].sort();
    if (JSON.stringify(derived) !== JSON.stringify(declared)) out.push(err(f, `verified_case_ids [${declared}] differs from cases that list this topic as prerequisite [${derived}]`, 'verified_case_ids'));
  }
  const cyc = findCycle(c.topics);
  if (cyc) out.push(err('curriculum/topics.json', `Prerequisite cycle: ${cyc.join(' -> ')}`, 'pre'));

  // cases
  for (const k of c.cases) {
    const f = `case ${k.id}`;
    if (!k.sources.length) out.push(err(f, 'Case has no sources', 'sources'));
    for (const s of k.sources) if (!sourceIds.has(s)) out.push(err(f, `Source ${s} is not in the source register`, 'sources'));
    k.facts.forEach(([text, s], i) => {
      if (!k.sources.includes(s)) out.push(err(f, `V fact cites source ${s} which is not in the case's source list`, `facts[${i}]`));
      if (!text.trim()) out.push(err(f, 'Empty fact text', `facts[${i}]`));
    });
    k.decisions.forEach((d, i) => {
      if (!k.sources.includes(d.source)) out.push(err(f, `Decision cites source ${d.source} which is not in the case's source list`, `decisions[${i}].source`));
    });
    if (k.tier === 'A' && k.decisions.length < 3) out.push(err(f, `Tier A case has ${k.decisions.length} documented decisions; at least 3 required`, 'decisions'));
    for (const p of k.patterns) if (!(p in c.patterns)) out.push(err(f, `Unknown pattern ${p}`, 'patterns'));
    for (const p of k.prereq_topics) if (!topicIds.has(p)) out.push(err(f, `Unknown prerequisite topic ${p}`, 'prereq_topics'));
    if (k.interpretations?.some(([, tag]) => tag !== 'I')) out.push(err(f, 'Interpretations must be tagged I', 'interpretations'));
    if (k.reconstructed?.some(([, tag]) => tag !== 'R')) out.push(err(f, 'Reconstructed entries must be tagged R', 'reconstructed'));
  }

  // sources
  for (const s of c.sources) if (s.verify && !s.verify_reason) out.push(warn(`source ${s.id}`, 'verify=true without verify_reason'));

  // questions
  const compsOfTopics = (ts: string[]) => new Set(ts.flatMap((t) => topicById.get(t)?.comps ?? []));
  for (const q of c.questions) {
    const f = `question ${q.id}`;
    if (!q.topics.length) out.push(err(f, 'Question has no topic', 'topics'));
    if (!q.competencies.length) out.push(err(f, 'Question has no competency', 'competencies'));
    for (const t of q.topics) if (!topicIds.has(t)) out.push(err(f, `Unknown topic ${t}`, 'topics'));
    for (const k of q.competencies) if (!(k in c.competencies)) out.push(err(f, `Unknown competency ${k}`, 'competencies'));
    const ok = compsOfTopics(q.topics);
    for (const k of q.competencies) if (!ok.has(k)) out.push(err(f, `Competency ${k} is not developed by any of the question's topics (${q.topics.join(', ')}); estimates are computed through topics`, 'competencies'));
    if (q.sourceCaseId && !caseIds.has(q.sourceCaseId)) out.push(err(f, `Unknown sourceCaseId ${q.sourceCaseId}`, 'sourceCaseId'));
    if (q.type === 'scenario') {
      const best = q.options?.find((o) => o.id === q.correct) as any;
      if (best && best.credit !== 1) out.push(err(f, 'The option named in correct must have credit 1', 'options'));
    }
  }

  // cards
  for (const k of c.cards) {
    if (!topicIds.has(k.topicId)) out.push(err(`card ${k.id}`, `Unknown topic ${k.topicId}`, 'topicId'));
    for (const x of k.competencies ?? []) if (!(x in c.competencies)) out.push(err(`card ${k.id}`, `Unknown competency ${x}`, 'competencies'));
  }

  // resources
  for (const r of c.resources) {
    const f = `resource ${r.id}`;
    for (const t of r.topics) if (!topicIds.has(t)) out.push(err(f, `Unknown topic ${t}`, 'topics'));
    if (r.sourceKey && !(r.sourceKey in c.resourceSources) && r.sourceKey !== 'VIDEO') out.push(err(f, `Unknown sourceKey ${r.sourceKey}`, 'sourceKey'));
    if (r.status === 'verified' && !r.lastChecked) out.push(err(f, 'verified resources need lastChecked', 'lastChecked'));
    if (!/^https:\/\//.test(r.url)) out.push(err(f, 'Resource URL must be https', 'url'));
  }

  // exercises
  for (const e of c.exercises) {
    const f = `exercise ${e.id}`;
    for (const t of e.topics) if (!topicIds.has(t)) out.push(err(f, `Unknown topic ${t}`, 'topics'));
    for (const k of e.competencies) if (!(k in c.competencies)) out.push(err(f, `Unknown competency ${k}`, 'competencies'));
    if (e.kind === 'architecture_review' && (!e.design || !e.checklist?.some((x) => x.flaw))) out.push(err(f, 'architecture_review needs design and a checklist with flaws'));
    if (e.kind === 'options_analysis' && ((e.options?.length ?? 0) < 4 || (e.options?.length ?? 0) > 5 || !e.criteria?.length)) out.push(err(f, 'options_analysis needs 4-5 options and criteria'));
    if (e.kind === 'discovery_drill' && (!e.categories?.length || !e.model_questions?.length)) out.push(err(f, 'discovery_drill needs categories and model_questions'));
    if (e.kind === 'requirements_critique' && (!e.requirements?.length || !e.defect_types?.length)) out.push(err(f, 'requirements_critique needs requirements and defect_types'));
  }

  // lessons and diagrams
  const diagramIds = new Set(c.diagrams.map((d) => d.id));
  for (const l of c.lessons) {
    const f = l.file;
    const t = topicById.get(l.topicId);
    if (!t) out.push(err(f, `Lesson for unknown topic ${l.topicId}`, 'topicId'));
    for (const s of l.frontmatter.sources ?? []) if (!sourceIds.has(s)) out.push(err(f, `Unknown source ${s}`, 'sources'));
    for (const d of l.frontmatter.diagrams ?? []) if (!diagramIds.has(d)) out.push(err(f, `Unknown diagram ${d}`, 'diagrams'));
    if (/\]\(\/(?!\/)/.test(l.body) || /href="\/(?!\/)/.test(l.body)) out.push(err(f, 'Lesson contains an absolute "/" link; internal links must go through the base-aware helper (use topic:T1.1.1 style links)', 'body'));
    if (t?.sap_status && !c.sapVerification[t.id]) out.push(err(f, 'SAP topic with a lesson needs an entry in curriculum/sap_verification.json (status note date and last-verified)'));
    if (!/^@@ \w+$/m.test(l.body)) out.push(err(f, 'Lesson body has no @@ section markers', 'body'));
    for (const m of l.body.matchAll(/^@@ (\w+)\s*$/gm)) if (!['summary', 'keyterms', 'why', 'lesson', 'example', 'deep'].includes(m[1])) out.push(err(f, `Unknown lesson block @@ ${m[1]}`, 'body'));
    if (!/^@@ summary\s*$/m.test(l.body)) out.push(err(f, 'Lesson needs an @@ summary block (shown at every depth)', 'body'));
  }
  for (const [id, v] of Object.entries(c.sapVerification)) if (!topicById.get(id)?.sap_status) out.push(warn('curriculum/sap_verification.json', `${id} has an entry but no sap_status in topics.json`));
  for (const t of c.topics) if (t.sap_status && !c.sapVerification[t.id]) out.push(err(`topic ${t.id}`, 'SAP topic without status/last-verified entry in sap_verification.json'));
  for (const d of c.diagrams) {
    const ids = new Set(d.nodes.map((n) => n.id));
    for (const e of d.edges) if (!ids.has(e.from) || !ids.has(e.to)) out.push(err(`diagram ${d.id}`, `Edge ${e.from}->${e.to} references an unknown node`));
  }

  // config references
  for (const [lvl, conds] of Object.entries(c.gates.levels ?? {}))
    for (const cond of conds as any[]) {
      for (const m of cond.modules ?? []) if (!(m in c.modules)) out.push(err('config/gates.json', `${lvl}: unknown module ${m}`));
      if (Array.isArray(cond.competencies)) for (const k of cond.competencies) if (!(k in c.competencies)) out.push(err('config/gates.json', `${lvl}: unknown competency ${k}`));
    }
  const w = c.engine?.initial_assessment?.weights;
  if (w && Math.abs(w.concept_mcq + w.scenario + w.self_assessment_calibration - 1) > 1e-9) out.push(err('config/engine.json', 'initial_assessment.weights must sum to 1'));
  const rw = c.engine?.recommender?.weights;
  if (rw && Math.abs(Object.values<number>(rw).reduce((a, b) => a + b, 0) - 1) > 1e-9) out.push(err('config/engine.json', 'recommender.weights must sum to 1'));

  return out;
}
