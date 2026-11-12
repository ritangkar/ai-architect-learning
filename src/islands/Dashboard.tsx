import { useMemo } from 'preact/hooks';
import { useApp } from '../lib/app/hooks';
import { recommend, type Activity } from '../lib/engine/recommender';
import { caseUrl, exerciseUrl, topicUrl, url } from '../lib/url';
import { ErrorBox, Loading, RangeBar, StateBadge, pct, toast, download, ago } from './ui';
import type { AppState } from '../lib/app/state';

function hrefFor(a: Activity): string {
  if (a.action === 'learn') return topicUrl(a.refId);
  if (a.action === 'case') return caseUrl(a.refId);
  if (a.action === 'exercise') return exerciseUrl(a.refId);
  return url('review/');
}
function ActivityCard({ a, app, label }: { a: Activity; app: AppState; label: string }) {
  const go = async (e: Event) => {
    if (a.thenReturnTo) { e.preventDefault(); await app.setResume({ caseId: a.thenReturnTo.caseId, viaTopic: a.refId }); location.href = hrefFor(a); }
  };
  return (
    <div class="card">
      <p class="small muted" style="margin:0">{label}</p>
      <h3 style="margin-top:4px"><a href={hrefFor(a)} onClick={go}>{a.title}</a></h3>
      <p class="small"><span class="badge neutral">{a.action}{a.depth ? ` · ${a.depth}` : ''}</span> <span class="muted">about {a.minutes} min</span></p>
      <p><strong>Because</strong> {a.because.join('; ')}.</p>
      {a.thenReturnTo ? <p class="small">Then return to <a href={caseUrl(a.thenReturnTo.caseId)}>{a.thenReturnTo.title}</a>.</p> : null}
    </div>
  );
}

export default function Dashboard() {
  const { app, error } = useApp();
  const rec = useMemo(() => (app ? recommend(app.learner) : null), [app?.version]);
  if (error) return <ErrorBox error={error} />;
  if (!app || !rec) return <Loading what="Loading your dashboard" />;
  const { core, learner: L } = app;
  const hasData = L.assessmentsCompleted > 0 || app.snap.attempts.length > 0;
  const run = app.activeRun;

  if (!hasData) {
    return (
      <div class="stack">
        <h1>{core.site.siteName}</h1>
        <div class="card" style="border-color:var(--accent)">
          <h2>Start with the initial assessment</h2>
          <p class="reading">This portal builds your learning path from evidence, not from what you tick as complete. The initial assessment mixes concept questions, architecture scenarios and a short self-rating (used only to check your calibration). It takes roughly 30 to 60 minutes, can be paused at any point, and can be retaken.</p>
          <p><a class="btn primary" href={url('assessment/')}>{run ? 'Resume the assessment' : 'Start the initial assessment'}</a></p>
        </div>
        <div class="callout info"><p><strong>Where your data lives.</strong> Everything stays in this browser on this device. Clearing site data or switching device loses it unless you export a backup (Settings). There is no account, no sync and no server.</p></div>
        <section aria-labelledby="whatsinside"><h2 id="whatsinside">What is in the portal today</h2>
          <ul>
            <li>{core.counts.topics} topics across {Object.keys(core.pillars).length} pillars, {Object.keys(core.competencies).length} competencies and {Object.keys(core.patterns).length} architecture patterns.</li>
            <li>{core.counts.cases} catalogued cases ({Object.entries(core.counts.casesByTier).map(([t, n]) => `${n} Tier ${t}`).join(', ')}).</li>
            <li>{core.counts.questions} assessment questions, {core.counts.cards} revision cards and {core.counts.lessons} written lessons so far. Content grows in phases; missing lessons say so honestly.</li>
          </ul>
        </section>
      </div>
    );
  }

  const bk = app.backupStatus();
  const next = L.nextLevel;
  const attained = core.levels.find((l) => l.id === L.attained);
  const comps = Object.entries(core.competencies);
  const studied = core.cases.filter((c) => ['A', 'B'].includes(c.tier));
  const recent = [...app.snap.attempts].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)).slice(0, 6);
  return (
    <div class="stack">
      <h1>Dashboard</h1>
      {!app.noticeDismissed() ? (
        <div class="banner info" role="note"><p>Your progress lives only in this browser on this device. Export a backup from <a href={url('settings/')}>Settings</a> before clearing site data or switching device. <button type="button" class="btn sm" onClick={() => app.dismissNotice()}>Dismiss</button></p></div>
      ) : null}
      {bk.due ? (
        <div class="banner warn" role="status"><p><strong>Backup suggested.</strong> {bk.reason}{' '}
          <button type="button" class="btn sm" onClick={async () => { const { filename, text } = await app.exportData(); download(filename, text); toast('Backup downloaded'); }}>Export backup now</button></p></div>
      ) : null}
      {run ? <div class="banner info"><p>An assessment is in progress. <a href={url('assessment/')}>Resume it</a>.</p></div> : null}

      <section aria-labelledby="rec-h">
        <h2 id="rec-h">Recommended next</h2>
        <div class="grid cols-3">
          {rec.slots.length ? rec.slots.map((s) => (
            <div key={s.primary.id}>
              <ActivityCard a={s.primary} app={app} label={`${s.kind[0].toUpperCase()}${s.kind.slice(1)} slot`} />
              {s.alternatives.map((alt) => <p class="small" key={alt.id}>Alternative: <a href={hrefFor(alt)}>{alt.title}</a> ({alt.action})</p>)}
            </div>
          )) : <div class="empty">Nothing to recommend right now. Browse the <a href={url('curriculum/')}>curriculum</a>.</div>}
        </div>
        <p class="small muted">{rec.mixExplanation} <a href={url('curriculum/')}>Choose your own</a>.</p>
        <p class="small muted">Target session mix now: {(['learn', 'case', 'exercise', 'revise'] as const).map((k) => `${k} ${Math.round(rec.mix[k] * 100)}%`).join(', ')}. Session length hint: {app.settings.sessionMinutes} minutes (advisory).</p>
      </section>

      <div class="grid cols-2">
        <section class="card" aria-labelledby="lvl-h">
          <h2 id="lvl-h">Level</h2>
          <p>Attained: <strong>{attained ? `${attained.id} ${attained.name}` : 'none yet'}</strong>. Levels change only when gate evidence is met.</p>
          {next ? <><p>Next gate: <strong>{next.id} {next.name}</strong></p>
            <ul class="small" style="list-style:none;padding:0">{next.conditions.map((c) => <li key={c.label}><span aria-hidden="true">{c.met ? '✓' : '○'}</span> <span class="visually-hidden">{c.met ? 'Met: ' : 'Not met: '}</span>{c.label} <span class="muted">({c.detail})</span></li>)}</ul></> : <p>All level gates are met.</p>}
          <p><a href={url('progress/')}>All levels and gates</a></p>
        </section>
        <section class="card" aria-labelledby="rev-h">
          <h2 id="rev-h">Revision</h2>
          <p><strong>{L.dueTotal}</strong> item{L.dueTotal === 1 ? '' : 's'} due. Items simply wait for you; nothing is lost by waiting.</p>
          <p><a class="btn" href={url('review/')}>Open the review queue</a></p>
          <h3>Cases</h3>
          <p>{L.casesPassed.length} of {studied.length} Tier A/B cases with a passed review exercise. Catalogue holds {core.counts.cases} cases in total.</p>
        </section>
      </div>

      <section aria-labelledby="comp-h" class="card">
        <h2 id="comp-h">Competencies</h2>
        <p class="small muted">Bar = estimate; shaded range = plausible range given how much evidence exists. Wide ranges mean low evidence.</p>
        <div class="stack">
          {comps.map(([id, name]) => {
            const e = L.derived.competencies[id];
            return (
              <div key={id} class="sparkbar">
                <span class="nowrap"><strong>{id}</strong></span>
                <div><div class="small">{name} {e.lowEvidence ? <span class="badge warn">low evidence</span> : null}</div><RangeBar e={e.E} lo={e.lo} hi={e.hi} label={name} /></div>
                <span class="small"><StateBadge state={e.state} /> {pct(e.E)}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section class="card" aria-labelledby="act-h">
        <h2 id="act-h">Recent activity</h2>
        {recent.length ? <ul>{recent.map((a) => <li key={a.id}>{ago(a.timestamp)} · {a.context} · {a.itemId} · score {pct(a.score)}</li>)}</ul> : <p class="muted">No assessed activity yet.</p>}
        {app.settings.showStreak ? <p class="small muted">Active days in a row: {app.streakDays()}. Missed days carry no penalty.</p> : null}
      </section>
    </div>
  );
}
