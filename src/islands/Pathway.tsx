import { useMemo, useState } from 'preact/hooks';
import { useApp } from '../lib/app/hooks';
import { buildPathway } from '../lib/engine/learner';
import { topicUrl, url } from '../lib/url';
import { ErrorBox, Loading, StateBadge, pct } from './ui';
import { QuizPanel } from './QuizPanel';
import type { AppState } from '../lib/app/state';

function Confirm({ app, topicId, onDone }: { app: AppState; topicId: string; onDone: () => void }) {
  const qs = app.questions.filter((q) => q.topics.includes(topicId)).sort((a, b) => (a.type === 'mcq' ? 1 : 0) - (b.type === 'mcq' ? 1 : 0) || a.id.localeCompare(b.id)).slice(0, 2);
  const [i, setI] = useState(0);
  if (qs.length < 2) return <p class="callout warn">Only {qs.length} question{qs.length === 1 ? ' is' : 's are'} available for this topic, so it cannot yet be confirmed in 2 questions. <a href={topicUrl(topicId)}>Study the topic</a> instead.</p>;
  const q = qs[i];
  return (
    <div class="card">
      <QuizPanel key={q.id} q={q} seed={`confirm|${topicId}`} heading={`Confirm ${topicId}: question ${i + 1} of 2`} onSubmit={async (r) => { await app.answerQuestion(q, r.response, { confidence: r.confidence, timeMs: r.timeMs, context: 'confirm', optionOrder: r.optionOrder }); }} onNext={() => (i === 0 ? setI(1) : onDone())} nextLabel={i === 0 ? 'Next question' : 'Done'} />
    </div>
  );
}

export default function Pathway() {
  const { app, error } = useApp(true);
  const [override, setOverride] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const path = useMemo(() => (app ? buildPathway(app.learner, { override }) : []), [app?.version, override]);
  if (error) return <ErrorBox error={error} />;
  if (!app) return <Loading what="Building your pathway" />;
  const { core, learner: L } = app;
  const mins = (d: string) => (core.levels && (app.core as any).depthMinutes?.[d]) ?? ({ compress: '10–20', standard: '45–90', deep: '90–180' } as any)[d];
  if (L.assessmentsCompleted === 0 && app.snap.attempts.length === 0) {
    return <div class="stack"><h1>Pathway</h1><div class="empty"><p>Your pathway is built from your assessment results. Until then every topic is shown at standard depth, in prerequisite order.</p><p><a class="btn primary" href={url('assessment/')}>Take the initial assessment</a></p></div>{renderList()}</div>;
  }
  return <div class="stack"><h1>Pathway</h1>{renderList()}</div>;

  function renderList() {
    let lastModule = '';
    return (
      <div class="stack">
        <div class="callout info"><p>Topics are ordered so that prerequisites come first. Nothing is locked: you can open any topic, and you will see a warning if a prerequisite is a gap or untested. The pathway recalculates after every assessed answer. There are no dates here; pace is yours.</p></div>
        <label class="choice" style="max-width:520px"><input type="checkbox" checked={override} onChange={(e) => setOverride((e.target as HTMLInputElement).checked)} /><span>Override: show weakest topics first, ignoring prerequisite order</span></label>
        {path.map((p) => {
          const t = core.topics.find((x) => x.id === p.topicId)!;
          const head = t.module !== lastModule && !override ? (lastModule = t.module, <h2 key={'h' + t.module}>{t.module} {core.modules[t.module].title}</h2>) : null;
          return (
            <div key={p.topicId}>
              {head}
              <div class="card" style="margin-bottom:8px">
                <div class="row" style="justify-content:space-between">
                  <h3 style="margin:0"><a href={topicUrl(p.topicId)}>{t.id} {t.title}</a></h3>
                  <span class="row"><StateBadge state={p.state} /><span class="badge neutral">{p.depth}{p.inferred ? ' (inferred)' : ''}</span></span>
                </div>
                <p class="small muted" style="margin:4px 0">{p.reason} <span>Typical time at this depth: {mins(p.depth)} min.</span></p>
                {p.blocking.length ? <p class="callout warn small" role="note"><strong>Prerequisite warning:</strong> {p.blocking.map((b) => core.topics.find((x) => x.id === b)!.title + ` (${b})`).join('; ')} {p.blocking.length === 1 ? 'is' : 'are'} not yet in place. You can still open this topic.</p> : null}
                {p.needsConfirm ? <p><button type="button" class="btn sm" onClick={() => setConfirming(confirming === p.topicId ? null : p.topicId)}>Confirm in 2 questions</button></p> : p.depth === 'compress' && p.confirmed ? <p class="small"><span class="badge tier-A">confirmed</span></p> : null}
                {confirming === p.topicId ? <Confirm app={app!} topicId={p.topicId} onDone={() => setConfirming(null)} /> : null}
              </div>
            </div>
          );
        })}
        <p class="small muted">{pct(path.filter((p) => p.state === 'proficient' || p.state === 'mastered').length / Math.max(1, path.length))} of topics are proficient or better on direct evidence.</p>
      </div>
    );
  }
}
