import { useEffect, useMemo, useState } from 'preact/hooks';
import { useApp } from '../lib/app/hooks';
import { dueQueue, isDue, type CardState } from '../lib/engine/srs';
import { topicUrl, url } from '../lib/url';
import { ErrorBox, Loading, pct } from './ui';
import { QuizPanel } from './QuizPanel';
import type { AppState } from '../lib/app/state';

function CardReview({ app, s, onNext }: { app: AppState; s: CardState; onNext: () => void }) {
  const card = app.core.cards.find((c) => `card:${c.id}` === s.id);
  const [shown, setShown] = useState(false);
  const [conf, setConf] = useState<number | undefined>();
  const [t0] = useState(Date.now());
  useEffect(() => { setShown(false); setConf(undefined); }, [s.id]);
  if (!card) return <p class="callout warn">This card's content was removed from the curriculum. It is kept in your records and flagged as an orphan. <button class="btn sm" onClick={onNext}>Skip</button></p>;
  const rate = async (grade: 'known' | 'almost' | 'missed') => { await app.reviewCardResult(s.id, { grade, confidence: conf, timeMs: Date.now() - t0 }); onNext(); };
  return (
    <div class="card stack">
      <p class="small muted">Box {s.box} · topic <a href={topicUrl(s.topicId)}>{s.topicId}</a></p>
      <p class="reading" style="max-width:none"><strong>{card.front}</strong></p>
      {!shown ? <button class="btn primary" onClick={() => setShown(true)}>Show answer</button> : (
        <>
          <div class="callout info"><p style="color:var(--text)">{card.back}</p></div>
          <fieldset style="border:0;padding:0;margin:0"><legend>How confident were you before looking? <span class="muted small">(1 guessing, 5 certain)</span></legend>
            <div class="row">{[1, 2, 3, 4, 5].map((n) => <label key={n} class={`choice ${conf === n ? 'picked' : ''}`} style="min-width:56px;justify-content:center"><input type="radio" name="cc" checked={conf === n} onChange={() => setConf(n)} />{n}</label>)}</div></fieldset>
          <div class="row"><button class="btn" onClick={() => rate('known')}>I knew it</button><button class="btn" onClick={() => rate('almost')}>Almost</button><button class="btn" onClick={() => rate('missed')}>I did not know it</button></div>
        </>
      )}
      <div class="row"><button class="btn sm" onClick={async () => { await app.snooze(s.id, 3); onNext(); }}>Snooze 3 days</button><button class="btn sm" onClick={() => app.resetCardBox(s.id)}>Reset to box 1</button></div>
    </div>
  );
}

export default function Review() {
  const { app, error } = useApp(true);
  const [queue, setQueue] = useState<string[] | null>(null);
  const [idx, setIdx] = useState(0);
  const [started, setStarted] = useState(false);
  useEffect(() => { if (app && queue === null) setQueue(dueQueue(app.snap.cardState, app.now(), (s) => 1 - (app.learner.derived.topics[s.topicId]?.E ?? 0.5)).map((s) => s.id)); }, [app]);
  const upcoming = useMemo(() => (app ? [...app.snap.cardState].filter((s) => !isDue(s, app.now())).sort((a, b) => (a.dueAt < b.dueAt ? -1 : 1)) : []), [app?.version]);
  if (error) return <ErrorBox error={error} />;
  if (!app || queue === null) return <Loading what="Loading your review queue" />;
  const total = app.snap.cardState.length;
  const cur = started && idx < queue.length ? app.snap.cardState.find((s) => s.id === queue[idx]) : undefined;
  const next = () => setIdx((i) => i + 1);
  return (
    <div class="stack">
      <h1>Review</h1>
      <p class="muted small">Revision dates only schedule reviews; they are not deadlines. Overdue items wait without penalty. Intervals and box moves come from the engine configuration.</p>
      {total === 0 ? <div class="empty"><p>No revision cards yet.</p><p class="small">Cards are added when you mark a lesson as read or answer check questions, and missed questions are queued here automatically.</p><p><a class="btn" href={url('curriculum/')}>Browse topics</a></p></div> : null}
      {total > 0 && !started ? (
        <div class="card"><p><strong>{queue.length}</strong> item{queue.length === 1 ? '' : 's'} due now, {total} in your schedule.</p>
          <button class="btn primary" disabled={!queue.length} onClick={() => setStarted(true)}>{queue.length ? 'Start reviewing' : 'Nothing due right now'}</button></div>
      ) : null}
      {started && cur ? (
        <div class="stack">
          <p class="small muted" aria-live="polite">Item {idx + 1} of {queue.length}</p>
          {cur.kind === 'card' ? <CardReview key={cur.id} app={app} s={cur} onNext={next} /> : (() => {
            const q = app.q(cur.refId);
            return q ? <QuizPanel key={cur.id} q={q} seed={`rev|${cur.id}|${cur.reviews}`} heading="Missed question: try again" onSubmit={async (r) => { await app.reviewCardResult(cur.id, { score: r.score, confidence: r.confidence, timeMs: r.timeMs, response: r.response }); }} onNext={next} /> : <p class="callout warn">This question was removed from the bank. It is retained and flagged. <button class="btn sm" onClick={next}>Skip</button></p>;
          })()}
        </div>
      ) : null}
      {started && !cur ? <div class="callout ok"><p style="color:var(--text)">That is everything due for now. Your schedule has been updated.</p><p><a class="btn" href={url('')}>Back to dashboard</a></p></div> : null}
      {upcoming.length ? (
        <section class="card"><h2>Scheduled</h2><div class="table-wrap"><table class="stack-table"><thead><tr><th scope="col">Item</th><th scope="col">Topic</th><th scope="col">Box</th><th scope="col">Next review</th><th scope="col">Actions</th></tr></thead>
          <tbody>{upcoming.slice(0, 30).map((s) => <tr key={s.id}><td data-label="Item">{s.id}</td><td data-label="Topic"><a href={topicUrl(s.topicId)}>{s.topicId}</a></td><td data-label="Box">{s.box}</td><td data-label="Next review">{s.snoozedUntil && s.snoozedUntil > app.now() ? `snoozed until ${s.snoozedUntil.slice(0, 10)}` : s.dueAt.slice(0, 10)}</td><td data-label="Actions"><button class="btn sm" onClick={() => app.resetCardBox(s.id)}>Reset</button></td></tr>)}</tbody></table></div>
          {upcoming.length > 30 ? <p class="small muted">Showing 30 of {upcoming.length}.</p> : null}
          <p class="small muted">Overall recall so far: {pct(app.snap.attempts.filter((a) => a.context === 'review').reduce((s, a, _, arr) => s + a.score / arr.length, 0) || null)}</p></section>
      ) : null}
    </div>
  );
}
