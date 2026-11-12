import { useMemo } from 'preact/hooks';
import { useApp } from '../lib/app/hooks';
import { topicUrl, url } from '../lib/url';
import { ErrorBox, Loading, RangeBar, StateBadge, pct, ago } from './ui';

export default function AssessmentResults() {
  const { app, error } = useApp(true);
  const runId = useMemo(() => new URLSearchParams(location.search).get('run'), []);
  if (error) return <ErrorBox error={error} />;
  if (!app) return <Loading what="Loading results" />;
  const runs = app.profile.assessmentRuns.filter((r) => r.status === 'completed').sort((a, b) => ((a.completedAt ?? '') < (b.completedAt ?? '') ? 1 : -1));
  const run = runs.find((r) => r.id === runId) ?? runs[0];
  if (!run) return <div class="empty"><p>No completed assessment yet.</p><p><a class="btn primary" href={url('assessment/')}>Go to the assessment</a></p></div>;
  const res = app.resultsFor(run);
  const { core, learner: L } = app;
  const name = (id: string) => `${id} ${core.competencies[id]}`;
  const depth = core.model.topics.map((t) => L.depth[t.id]);
  const compressed = depth.filter((d) => d.depth === 'compress');
  const deepened = depth.filter((d) => d.depth === 'deep');
  const title = (id: string) => core.topics.find((t) => t.id === id)!.title;
  return (
    <div class="stack">
      <h1>Assessment results</h1>
      <p class="muted">Run completed {ago(run.completedAt ?? run.startedAt)} · {res.itemsAnswered} items answered.</p>
      <div class="callout info"><p><strong>Read this with care.</strong> Estimates come only from the items you answered. Ranges widen when evidence is thin. Scenario justification text is not machine-graded and thresholds are heuristics, not certifications.</p></div>

      <div class="grid cols-2">
        <section class="card"><h2>Strengths</h2>{res.strengths.length ? <ul>{res.strengths.map((id) => <li key={id}>{name(id)}</li>)}</ul> : <p class="muted">No competency is yet both strong and well evidenced.</p>}</section>
        <section class="card"><h2>Gaps</h2>{res.gaps.length ? <ul>{res.gaps.map((id) => <li key={id}>{name(id)}</li>)}</ul> : <p class="muted">No well-evidenced gaps.</p>}</section>
        <section class="card"><h2>Overconfident</h2>{res.overconfident.length ? <><p class="small muted">Your confidence ran ahead of your results.</p><ul>{res.overconfident.map((id) => <li key={id}>{name(id)}</li>)}</ul></> : <p class="muted">None detected.</p>}</section>
        <section class="card"><h2>Underconfident</h2>{res.underconfident.length ? <><p class="small muted">You did better than you expected.</p><ul>{res.underconfident.map((id) => <li key={id}>{name(id)}</li>)}</ul></> : <p class="muted">None detected.</p>}</section>
      </div>

      <section class="card"><h2>Competency estimates</h2>
        <div class="table-wrap"><table class="stack-table">
          <thead><tr><th scope="col">Competency</th><th scope="col">Estimate (range)</th><th scope="col">State</th><th scope="col">Items</th><th scope="col">Self-rating</th><th scope="col">Calibration</th></tr></thead>
          <tbody>{res.competencies.map((c) => (
            <tr key={c.id}>
              <td data-label="Competency"><strong>{c.id}</strong> {c.name}</td>
              <td data-label="Estimate">{pct(c.E)} {c.E !== null ? `(${pct(c.lo)}–${pct(c.hi)})` : ''}<RangeBar e={c.E} lo={c.lo} hi={c.hi} label={c.name} /></td>
              <td data-label="State">{c.lowEvidence ? <span class="badge warn">low evidence</span> : <StateBadge state={c.state} />}</td>
              <td data-label="Items">{c.n}{c.stopReason ? <span class="muted small"> · {({ 'confident-high': 'stopped: clearly strong', 'confident-low': 'stopped: clearly weak', 'max-items': 'stopped: item cap', 'bank-exhausted': 'bank exhausted' } as any)[c.stopReason]}</span> : null}</td>
              <td data-label="Self-rating">{c.selfRating ?? 'n/a'}</td>
              <td data-label="Calibration">{c.calibrationLabel === 'unknown' ? 'n/a' : c.calibrationLabel}</td>
            </tr>))}</tbody>
        </table></div>
        {res.lowEvidence.length ? <p class="small">Low evidence ({res.lowEvidence.length}): the question bank has few items for these, or you finished early. They are shown, not guessed.</p> : null}
      </section>

      <section class="card" aria-labelledby="depth-h">
        <h2 id="depth-h">How this shapes your pathway</h2>
        <h3>Compressed ({compressed.length})</h3>
        {compressed.length ? <ul>{compressed.slice(0, 40).map((d) => <li key={d.topicId}><a href={topicUrl(d.topicId)}>{d.topicId} {title(d.topicId)}</a><span class="muted small"> — {d.reason}</span></li>)}</ul> : <p class="muted">None yet. Topics compress once the evidence shows proficiency.</p>}
        <h3>Deepened ({deepened.length})</h3>
        {deepened.length ? <ul>{deepened.slice(0, 40).map((d) => <li key={d.topicId}><a href={topicUrl(d.topicId)}>{d.topicId} {title(d.topicId)}</a><span class="muted small"> — {d.reason}</span></li>)}</ul> : <p class="muted">None.</p>}
        <p class="small muted">Everything else is standard depth. Topics you were not asked about stay "not yet assessed"; a compress or deepen suggestion based on a competency estimate is marked as inferred and never counts as mastery.</p>
        <p><a class="btn primary" href={url('pathway/')}>Accept and open my pathway</a> <a class="btn" href={url('assessment/')}>Retake the assessment</a></p>
      </section>
      {runs.length > 1 ? <section><h2>History</h2><ul>{runs.map((r) => <li key={r.id}><a href={url(`assessment/results/?run=${r.id}`)}>{r.id === run.id ? 'This run' : 'Run'} completed {ago(r.completedAt ?? r.startedAt)}</a> · {r.attemptIds.length} items</li>)}</ul></section> : null}
    </div>
  );
}
