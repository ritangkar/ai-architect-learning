import { useEffect, useState } from 'preact/hooks';
import { useApp } from '../lib/app/hooks';
import { url } from '../lib/url';
import { ErrorBox, Loading, ago } from './ui';
import { QuizPanel } from './QuizPanel';
import type { AssessmentRun } from '../lib/engine/learner';

export default function Assessment() {
  const { app, error } = useApp(true);
  const [busy, setBusy] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [cur, setCur] = useState<string | null>(null); // the question on screen (kept until the learner presses Next)
  const run = app?.activeRun;

  useEffect(() => {
    if (!app || !run || !run.selfDone || cur !== null) return;
    const answered = new Set(app.runAttempts(run).map((a) => a.itemId));
    const pending = run.pendingItemId && app.q(run.pendingItemId) && !answered.has(run.pendingItemId) ? run.pendingItemId : undefined; // resume at the same question after a refresh
    if (pending) { setCur(pending); return; }
    const next = app.nextForRun(run);
    if (next.item) { const id = next.item.id; app.setPending(run, id).then(() => setCur(id)); } // persisted before it is shown, so a refresh resumes here
    else app.completeRun(run).then(() => { location.href = url(`assessment/results/?run=${run.id}`); });
  }, [app?.version, run?.id, run?.selfDone, cur]);

  if (error) return <ErrorBox error={error} />;
  if (!app) return <Loading what="Loading the assessment" />;
  const { core } = app;
  const comps = Object.entries(core.competencies);
  const past = app.profile.assessmentRuns.filter((r) => r.status !== 'in_progress').sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
  const bankSize = app.questions.length;

  if (!run) {
    return (
      <div class="stack">
        <h1>Initial assessment</h1>
        <div class="card stack">
          <p class="reading">Three parts, taken in this order: <strong>Section C</strong>, a short self-rating of each competency (used only to check your calibration and to decide which areas to probe first; it can never raise your level); then <strong>Section A</strong> concept questions (about {Math.round(core.engine.initial_assessment.weights.concept_mcq * 100)}% of the weight) and <strong>Section B</strong> architecture scenarios (about {Math.round(core.engine.initial_assessment.weights.scenario * 100)}%), interleaved adaptively.</p>
          <ul>
            <li>Progress is saved after every answer. If you reload, you return to the same question.</li>
            <li>The assessment stops probing a competency once the evidence is clear, after at least {core.engine.initial_assessment.min_items_per_competency_before_stop} items.</li>
            <li>The question bank currently holds {bankSize} items. Competencies with fewer items than the target are reported as <strong>low evidence</strong>, not guessed.</li>
            <li>Scenario justification text is <strong>not machine-graded</strong>.</li>
            <li>You can retake it at any time. Earlier runs are kept.</li>
          </ul>
          <p><button type="button" class="btn primary" disabled={busy || bankSize === 0} onClick={async () => { setBusy(true); await app.startRun(); setBusy(false); }}>{past.length ? 'Retake the assessment' : 'Start the assessment'}</button></p>
          {bankSize === 0 ? <p class="callout warn">No assessment questions are available yet.</p> : null}
        </div>
        {past.length ? (
          <section aria-labelledby="hist"><h2 id="hist">Previous runs</h2>
            <ul>{past.map((r) => <li key={r.id}>{r.status === 'completed' ? <a href={url(`assessment/results/?run=${r.id}`)}>Completed {ago(r.completedAt ?? r.startedAt)}</a> : <span>Abandoned run from {ago(r.startedAt)}</span>} · {r.attemptIds.length} items</li>)}</ul></section>
        ) : null}
      </div>
    );
  }

  if (!run.selfDone) {
    const all = comps.every(([id]) => ratings[id]);
    return (
      <div class="stack">
        <h1>Section C: self-rating</h1>
        <p class="stepper" aria-label="Progress"><span class="badge neutral">Step 1 of 2: self-rating</span></p>
        <p class="reading">Rate how well you could <em>apply</em> each competency in a client engagement today: 1 = never done it, 5 = could lead it. This never raises your level; it is compared with what you then demonstrate.</p>
        <form class="stack" onSubmit={async (e) => { e.preventDefault(); await app.saveSelfRatings(run.id, ratings); }}>
          {comps.map(([id, name]) => (
            <fieldset key={id} class="card" style="margin:0">
              <legend><strong>{id}</strong> {name}</legend>
              <div class="row">{[1, 2, 3, 4, 5].map((n) => <label key={n} class={`choice ${ratings[id] === n ? 'picked' : ''}`} style="min-width:56px;justify-content:center"><input type="radio" name={`self-${id}`} checked={ratings[id] === n} onChange={() => setRatings((r) => ({ ...r, [id]: n }))} required />{n}</label>)}</div>
            </fieldset>
          ))}
          <div class="row"><button class="btn primary" type="submit" disabled={!all}>Continue to the questions</button>
            <button type="button" class="btn" onClick={() => app.abandonRun()}>Cancel this run</button></div>
        </form>
      </div>
    );
  }

  const progress = app.nextForRun(run).progress;
  const answered = app.runAttempts(run).length;
  const currentId = cur;
  const q = currentId ? app.q(currentId) : undefined;
  const covered = Object.values(progress).filter((p) => p.stopped || p.asked >= core.engine.initial_assessment.min_items_per_competency_before_stop).length;
  if (!q) return <Loading what="Preparing the next question" />;
  const section = q.type === 'mcq' || q.type === 'card' ? 'A' : 'B';
  return (
    <div class="stack">
      <h1>Initial assessment</h1>
      <p class="stepper" aria-label="Progress"><span class="badge neutral">Answered {answered}</span> <span class="badge neutral">Competencies with enough evidence: {covered} of {comps.length}</span> <span class="badge neutral">Section {section}</span></p>
      <QuizPanel
        key={q.id}
        q={q}
        seed={run.seed}
        heading={`Question ${app.runAttempts(run).some((a) => a.itemId === q.id) ? answered : answered + 1} · Section ${section === 'A' ? 'A (concept)' : 'B (scenario)'}`}
        onSubmit={async (r) => { await app.answerInitial(run as AssessmentRun, q, r.response, { confidence: r.confidence, timeMs: r.timeMs, seed: run.seed, optionOrder: r.optionOrder }); }}
        onNext={() => setCur(null)}
        nextLabel="Next question"
      />
      <div class="row">
        <button type="button" class="btn" onClick={async () => { if (confirm('Finish now? Competencies with little evidence will be reported as low evidence.')) { await app.completeRun(run); location.href = url(`assessment/results/?run=${run.id}`); } }}>Finish now</button>
        <button type="button" class="btn" onClick={async () => { if (confirm('Abandon this run? Your answers so far are kept in your history.')) await app.abandonRun(); }}>Abandon this run</button>
      </div>
    </div>
  );
}
