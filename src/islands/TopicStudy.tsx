import { useEffect, useState } from 'preact/hooks';
import { useApp } from '../lib/app/hooks';
import { caseUrl, topicUrl } from '../lib/url';
import { prereqMet } from '../lib/engine/learner';
import { ErrorBox, Loading, StateBadge, pct, toast } from './ui';
import { QuizPanel } from './QuizPanel';
import type { Depth } from '../lib/engine/types';

const DEPTHS: { id: Depth; label: string; hint: string }[] = [
  { id: 'compress', label: 'Compress', hint: 'summary and key terms (10–20 min)' },
  { id: 'standard', label: 'Standard', hint: 'guided lesson and worked example (45–90 min)' },
  { id: 'deep', label: 'Deep', hint: 'extended material and refresh (90–180 min)' },
];

export default function TopicStudy({ topicId, part }: { topicId: string; part: 'top' | 'bottom' }) {
  const { app, error } = useApp(true);
  const [depth, setDepth] = useState<Depth>('standard');
  const [quiz, setQuiz] = useState<{ ids: string[]; i: number } | null>(null);
  useEffect(() => {
    if (!app) return;
    const d = app.depthChoice(topicId) ?? (app.settings.defaultDepth !== 'auto' ? app.settings.defaultDepth : app.learner.depth[topicId].depth);
    setDepth(d as Depth);
  }, [app, topicId]);
  useEffect(() => { document.getElementById('lesson-root')?.setAttribute('data-depth', depth); }, [depth]);
  if (error) return <ErrorBox error={error} />;
  if (!app) return <Loading what="Loading your state for this topic" />;
  const { core, learner: L } = app;
  const t = core.topics.find((x) => x.id === topicId)!;
  const ev = L.derived.topics[topicId];
  const assigned = L.depth[topicId];
  const downstream = core.topics.filter((x) => x.pre.includes(topicId));
  const qs = app.questions.filter((q) => q.topics.includes(topicId));
  const unmet = t.pre.filter((p) => !prereqMet(L, p));
  const resume = app.profile.resume;
  const returnCase = resume && core.cases.find((c) => c.id === resume.caseId && (c.prereq_topics.includes(topicId) || resume.viaTopic === topicId));
  const read = app.lessonViewedCount(topicId);
  const choose = async (d: Depth) => { setDepth(d); await app.setDepthChoice(topicId, d); };
  const q = quiz ? app.q(quiz.ids[quiz.i]) : undefined;

  return (
    <div class="stack" data-testid="topic-study">
      {part === 'top' ? <>
      <section class="card" aria-labelledby="ts-h">
        <h2 id="ts-h">Your state on this topic</h2>
        <div class="row"><StateBadge state={ev.state} /> <span>Evidence score {pct(ev.E)} from {ev.n} answer{ev.n === 1 ? '' : 's'}</span> {ev.lowEvidence ? <span class="badge warn">low evidence</span> : null}</div>
        <p class="small muted">Assigned depth: <strong>{assigned.depth}</strong>. {assigned.reason} Reading, watching or marking a lesson read never changes this; only answering questions and exercises does.</p>
        {returnCase ? <div class="callout ok" role="note"><p style="color:var(--text)">You came here from case <a href={caseUrl(returnCase.id)}>{returnCase.company}: {returnCase.title}</a>. {unmet.length === 0 && ev.state !== 'gap' && ev.state !== 'unknown' ? 'This prerequisite looks in place now: ' : 'Finish this topic’s check questions, then '}<a class="btn sm primary" href={caseUrl(returnCase.id)}>Return to the case</a></p></div> : null}
      </section>

      <fieldset class="card" style="margin:0">
        <legend><strong>Lesson depth</strong></legend>
        <div class="row" role="radiogroup" aria-label="Lesson depth">
          {DEPTHS.map((d) => <label key={d.id} class={`choice ${depth === d.id ? 'picked' : ''}`}><input type="radio" name="depth" checked={depth === d.id} onChange={() => choose(d.id)} /><span><strong>{d.label}</strong> <span class="muted small">{d.hint}{assigned.depth === d.id ? ' · assigned' : ''}</span></span></label>)}
        </div>
        <p class="small muted">Switching is instant and remembered for this topic on this device.</p>
      </fieldset>

      <section class="card" aria-labelledby="pre-h">
        <h2 id="pre-h">Prerequisites</h2>
        {t.pre.length ? <ul style="list-style:none;padding:0">{t.pre.map((p) => { const pt = core.topics.find((x) => x.id === p)!; return <li key={p} style="margin-bottom:6px"><a href={topicUrl(p)}>{p} {pt.title}</a> <StateBadge state={L.derived.topics[p].state} />{prereqMet(L, p) ? null : <span class="callout warn small" style="display:inline-block;margin:0 0 0 8px;padding:2px 8px"> not yet in place: consider this first</span>}</li>; })}</ul> : <p class="muted">None: this is an entry-point topic.</p>}
        <h3>Next topics unlocked</h3>
        {downstream.length ? <ul style="list-style:none;padding:0">{downstream.map((d) => <li key={d.id} style="margin-bottom:6px"><a href={topicUrl(d.id)}>{d.id} {d.title}</a> <StateBadge state={L.derived.topics[d.id].state} /></li>)}</ul> : <p class="muted">No topic depends directly on this one.</p>}
      </section>

      </> : <>
      <section class="card stack" aria-labelledby="rd-h">
        <h2 id="rd-h">Lesson progress</h2>
        <p>{read ? `You marked this lesson read ${read} time${read === 1 ? '' : 's'}.` : 'Not marked as read.'} <span class="muted small">This records that you read it. It does <strong>not</strong> change your mastery estimate.</span></p>
        <div><button class="btn" type="button" onClick={async () => { await app.lessonViewed(topicId); toast(t.cards ? `Marked read. ${t.cards} revision card(s) added to your queue.` : 'Marked read.'); }}>Mark lesson as read</button></div>
        <p class="small muted">Revision cards for this topic: {t.cards}{t.cards ? ' (added to your review queue when you mark the lesson read or answer a check question).' : '. None authored yet.'}</p>
      </section>

      <section class="card" aria-labelledby="qz-h">
        <h2 id="qz-h">Check questions</h2>
        {!qs.length ? <div class="empty">No check questions are written for this topic yet. Mastery cannot be assessed here until they are.</div> : !quiz ? (
          <div class="stack"><p>{qs.length} question{qs.length === 1 ? '' : 's'} available. Answers are the only thing that updates your estimate for this topic.</p>
            <button class="btn primary" onClick={() => setQuiz({ ids: [...qs].sort((a, b) => a.difficulty - b.difficulty || a.id.localeCompare(b.id)).map((x) => x.id), i: 0 })}>Start check questions</button></div>
        ) : q ? (
          <QuizPanel key={q.id} q={q} seed={`quiz|${topicId}|${app.snap.attempts.length}`} heading={`Question ${quiz.i + 1} of ${quiz.ids.length}`} onSubmit={async (r) => { await app.answerQuestion(q, r.response, { confidence: r.confidence, timeMs: r.timeMs, context: 'quiz', optionOrder: r.optionOrder }); }} onNext={() => (quiz.i + 1 < quiz.ids.length ? setQuiz({ ...quiz, i: quiz.i + 1 }) : setQuiz(null))} nextLabel={quiz.i + 1 < quiz.ids.length ? 'Next question' : 'Finish'} />
        ) : null}
      </section>
      </>}
    </div>
  );
}
