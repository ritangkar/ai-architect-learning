import { useEffect, useState } from 'preact/hooks';
import { useApp } from '../lib/app/hooks';
import { scoreArchitectureReview } from '../lib/engine/scoring';
import { topicUrl, url } from '../lib/url';
import { ErrorBox, Loading, download, pct, toast } from './ui';
import type { Exercise as Ex } from '../lib/content/schemas';
import { adrMarkdown } from '../lib/app/adr';
import type { AppState } from '../lib/app/state';

async function saveResult(app: AppState, ex: Ex, score: number, response: any) {
  const passed = score >= (app.core.engine.pass_threshold ?? 0.7);
  await app.recordAttempt({ itemId: `exercise:${ex.id}`, itemType: 'architecture_review', topics: ex.topics, competencies: ex.competencies, response, score, timeMs: 0, context: 'exercise', exerciseId: ex.id });
  await app.saveExerciseWork(ex.id, { ...response, result: { exerciseId: ex.id, kind: ex.kind, simulation: !!ex.simulation, score, passed, at: app.now() } });
  return passed;
}

function ArchReview({ ex, app }: { ex: Ex; app: AppState }) {
  const saved = app.exerciseWork(ex.id)?.data;
  const [marked, setMarked] = useState<string[]>(saved?.marked ?? []);
  const [notes, setNotes] = useState<string>(saved?.notes ?? '');
  const [done, setDone] = useState(!!saved?.result);
  const score = scoreArchitectureReview(ex.checklist!, marked);
  return (
    <div class="stack">
      <div class="card"><pre style="white-space:pre-wrap;font-family:var(--font-ui)">{ex.design}</pre></div>
      <fieldset disabled={done} style="border:0;padding:0;margin:0"><legend><strong>Mark each statement that is a real flaw or risk.</strong></legend>
        <div style="display:grid;gap:8px;margin-top:8px">{ex.checklist!.map((c) => <label key={c.id} class={`choice ${marked.includes(c.id) ? 'picked' : ''} ${done && c.flaw ? 'correct' : ''} ${done && marked.includes(c.id) && !c.flaw ? 'wrong' : ''}`}><input type="checkbox" checked={marked.includes(c.id)} onChange={() => setMarked((m) => (m.includes(c.id) ? m.filter((x) => x !== c.id) : [...m, c.id]))} /><span>{c.text}{done ? <strong>{c.flaw ? ' (real flaw)' : ' (not a flaw)'}</strong> : null}{done && c.explanation ? <span class="muted small"> {c.explanation}</span> : null}</span></label>)}</div></fieldset>
      <div class="field"><label for="notes">Your own findings (free text, not machine-graded)</label><textarea id="notes" value={notes} onInput={(e) => setNotes((e.target as HTMLTextAreaElement).value)} onBlur={() => app.saveExerciseWork(ex.id, { notes })} disabled={done} /></div>
      {!done ? <div><button class="btn primary" onClick={async () => { await saveResult(app, ex, score, { marked, notes }); setDone(true); }}>Submit review</button></div> : (
        <div class="callout info" role="status" style="color:var(--text)"><p><strong>Score {pct(score)}.</strong> This is exercise evidence for {ex.topics.join(', ')}.</p>
          {ex.model_findings?.length ? <><h3>Model findings</h3><ul>{ex.model_findings.map((m) => <li key={m}>{m}</li>)}</ul></> : null}
          <button class="btn" onClick={() => { setDone(false); setMarked([]); }}>Try again with a fresh attempt</button></div>
      )}
    </div>
  );
}

function Options({ ex, app }: { ex: Ex; app: AppState }) {
  const saved = app.exerciseWork(ex.id)?.data ?? {};
  const [w, setW] = useState<any>({ decision: saved.decision ?? '', chosen: saved.chosen ?? '', weights: saved.weights ?? {}, scores: saved.scores ?? {}, tradeoffs: saved.tradeoffs ?? '', risks: saved.risks ?? '', context: saved.context ?? '' });
  useEffect(() => { const t = setTimeout(() => app.saveExerciseWork(ex.id, w), 600); return () => clearTimeout(t); }, [w]);
  const weight = (id: string, d: number) => w.weights[id] ?? d;
  const total = (oid: string) => ex.criteria!.reduce((s, c) => s + weight(c.id, c.weight) * (w.scores[oid]?.[c.id] ?? 0), 0);
  const ranked = [...ex.options!].sort((a, b) => total(b.id) - total(a.id));
  return (
    <div class="stack">
      <div class="field"><label for="dec">Decision title</label><input id="dec" type="text" value={w.decision} onInput={(e) => { const v = (e.target as HTMLInputElement).value; setW((p: any) => ({ ...p, decision: v })); }} placeholder={ex.title} /></div>
      <div class="table-wrap"><table><caption class="small muted" style="text-align:left">Scores 1 (poor) to 5 (excellent). Adjust the weights to reflect this client.</caption>
        <thead><tr><th scope="col">Option</th>{ex.criteria!.map((c) => <th scope="col" key={c.id}>{c.name}<br /><label class="small muted" for={`w-${c.id}`}>weight</label> <input id={`w-${c.id}`} type="number" min={0} max={10} value={weight(c.id, c.weight)} style="width:64px" onInput={(e) => { const v = Number((e.target as HTMLInputElement).value); setW((p: any) => ({ ...p, weights: { ...p.weights, [c.id]: v } })); }} /></th>)}<th scope="col">Weighted total</th></tr></thead>
        <tbody>{ex.options!.map((o) => <tr key={o.id}><th scope="row">{o.name}<div class="small muted" style="font-weight:400">{o.description}</div></th>{ex.criteria!.map((c) => <td key={c.id}><label class="visually-hidden" for={`s-${o.id}-${c.id}`}>{o.name} on {c.name}</label><select id={`s-${o.id}-${c.id}`} value={w.scores[o.id]?.[c.id] ?? ''} onChange={(e) => { const v = Number((e.target as HTMLSelectElement).value); setW((p: any) => ({ ...p, scores: { ...p.scores, [o.id]: { ...(p.scores[o.id] ?? {}), [c.id]: v } } })); }}><option value="">–</option>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select></td>)}<td><strong>{total(o.id)}</strong></td></tr>)}</tbody></table></div>
      <p class="small muted">Highest weighted total: <strong>{ranked[0] && total(ranked[0].id) > 0 ? ranked[0].name : 'n/a yet'}</strong>. The matrix informs the decision; it does not make it. Check that your choice survives a change of weights.</p>
      <div class="field"><label for="ch">Your decision</label><select id="ch" value={w.chosen} onChange={(e) => { const v = (e.target as HTMLSelectElement).value; setW((p: any) => ({ ...p, chosen: v })); }}><option value="">Choose…</option>{ex.options!.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
      <div class="field"><label for="ctx">Context (optional; defaults to the scenario)</label><textarea id="ctx" value={w.context} onInput={(e) => { const v = (e.target as HTMLTextAreaElement).value; setW((p: any) => ({ ...p, context: v })); }} /></div>
      <div class="field"><label for="tr">Trade-offs and consequences</label><textarea id="tr" value={w.tradeoffs} onInput={(e) => { const v = (e.target as HTMLTextAreaElement).value; setW((p: any) => ({ ...p, tradeoffs: v })); }} /></div>
      <div class="field"><label for="rk">Risks and open questions</label><textarea id="rk" value={w.risks} onInput={(e) => { const v = (e.target as HTMLTextAreaElement).value; setW((p: any) => ({ ...p, risks: v })); }} /></div>
      {ex.guidance ? <details class="acc"><summary>Self-check guidance</summary><div><p>{ex.guidance}</p></div></details> : null}
      <p class="small muted">This exercise is self-judged, so it is saved and exported but does not feed your mastery estimate.</p>
      <div><button class="btn primary" onClick={() => { download(`adr-${ex.id}.md`, adrMarkdown(ex, w), 'text/markdown'); toast('ADR downloaded'); }}>Download ADR (Markdown)</button></div>
    </div>
  );
}

function Drill({ ex, app }: { ex: Ex; app: AppState }) {
  const saved = app.exerciseWork(ex.id)?.data ?? {};
  const [ans, setAns] = useState<Record<string, string>>(saved.ans ?? {});
  const [reveal, setReveal] = useState(!!saved.reveal);
  const [cov, setCov] = useState<string[]>(saved.cov ?? []);
  useEffect(() => { const t = setTimeout(() => app.saveExerciseWork(ex.id, { ans, reveal, cov }), 500); return () => clearTimeout(t); }, [ans, reveal, cov]);
  const mq = ex.model_questions!;
  return (
    <div class="stack">
      <p>Write the questions you would ask, by category. Then compare with the model list and tick the ones you covered.</p>
      {ex.categories!.map((c) => <div class="field" key={c.id}><label for={`cat-${c.id}`}>{c.name}</label><span class="small muted">{c.hint}</span><textarea id={`cat-${c.id}`} value={ans[c.id] ?? ''} disabled={reveal} onInput={(e) => { const v = (e.target as HTMLTextAreaElement).value; setAns((a) => ({ ...a, [c.id]: v })); }} /></div>)}
      {!reveal ? <div><button class="btn primary" onClick={() => setReveal(true)}>Reveal the model questions</button></div> : (
        <div class="card stack"><h3>Model questions</h3>
          {ex.categories!.map((c) => <div key={c.id}><h4>{c.name}</h4>{mq.filter((m) => m.category === c.id).map((m) => <label class="choice" key={m.question}><input type="checkbox" checked={cov.includes(m.question)} onChange={() => setCov((cs) => (cs.includes(m.question) ? cs.filter((x) => x !== m.question) : [...cs, m.question]))} /><span>{m.question}</span></label>)}</div>)}
          <p>You covered {cov.length} of {mq.length} model questions. <span class="muted small">Self-judged: saved and exported, not counted in mastery.</span></p></div>
      )}
    </div>
  );
}

function Critique({ ex, app }: { ex: Ex; app: AppState }) {
  const saved = app.exerciseWork(ex.id)?.data;
  const [marks, setMarks] = useState<Record<string, string[]>>(saved?.marks ?? {});
  const [done, setDone] = useState(!!saved?.result);
  const defects = ex.defect_types!;
  const scoreReq = (id: string) => { const truth = ex.requirements!.find((r) => r.id === id)!.defects; const m = marks[id] ?? []; const tp = m.filter((x) => truth.includes(x)).length; const fp = m.length - tp; return truth.length ? Math.max(0, (tp - 0.5 * fp) / truth.length) : m.length ? 0 : 1; };
  const score = ex.requirements!.reduce((s, r) => s + scoreReq(r.id), 0) / ex.requirements!.length;
  return (
    <div class="stack">
      <p>For each requirement, tick every defect it has. Some requirements are fine.</p>
      {ex.requirements!.map((r) => (
        <fieldset class="card" key={r.id} disabled={done} style="margin:0"><legend><strong>{r.id}</strong> “{r.text}”</legend>
          <div class="row">{defects.map((d) => { const on = (marks[r.id] ?? []).includes(d.id); const truth = r.defects.includes(d.id); return <label key={d.id} class={`choice ${on ? 'picked' : ''} ${done && truth ? 'correct' : ''} ${done && on && !truth ? 'wrong' : ''}`}><input type="checkbox" checked={on} onChange={() => setMarks((mk) => ({ ...mk, [r.id]: on ? (mk[r.id] ?? []).filter((x) => x !== d.id) : [...(mk[r.id] ?? []), d.id] }))} />{d.name}{done && truth ? ' ✓' : ''}</label>; })}</div></fieldset>
      ))}
      {!done ? <div><button class="btn primary" onClick={async () => { await saveResult(app, ex, score, { marks }); setDone(true); }}>Submit critique</button></div> : <p class="callout info" role="status" style="color:var(--text)">Score {pct(score)}. Ticks marked ✓ are the defects the model critique finds. This is exercise evidence for {ex.topics.join(', ')}. <button class="btn sm" onClick={() => { setDone(false); setMarks({}); }}>Try again</button></p>}
    </div>
  );
}

export default function Exercise({ exerciseId }: { exerciseId: string }) {
  const { app, error } = useApp();
  const [ex, setEx] = useState<Ex | null>(null);
  useEffect(() => { fetch(url('data/exercises.json')).then((r) => r.json()).then((all: Ex[]) => setEx(all.find((e) => e.id === exerciseId) ?? null)); }, []);
  if (error) return <ErrorBox error={error} />;
  if (!app || !ex) return <Loading what="Loading the exercise" />;
  return (
    <div class="stack">
      <div class="row"><span class="badge neutral">{ex.kind.replace('_', ' ')}</span>{ex.simulation ? <span class="badge sim">SIMULATION</span> : null}<span class="badge warn">draft</span></div>
      <h1>{ex.title}</h1>
      <div class="callout info"><p style="color:var(--text)"><strong>Scenario (constructed for teaching; not a real client).</strong> {ex.scenario}</p></div>
      <p class="small muted">Related topics: {ex.topics.map((t) => <a key={t} href={topicUrl(t)} style="margin-right:6px">{t}</a>)}. Your work is saved on this device only and is included in your progress export. No data leaves the browser.</p>
      {ex.kind === 'architecture_review' ? <ArchReview ex={ex} app={app} /> : ex.kind === 'options_analysis' ? <Options ex={ex} app={app} /> : ex.kind === 'discovery_drill' ? <Drill ex={ex} app={app} /> : <Critique ex={ex} app={app} />}
    </div>
  );
}
