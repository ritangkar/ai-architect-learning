import { useEffect, useRef, useState } from 'preact/hooks';
import { useApp } from '../lib/app/hooks';
import { routeCase } from '../lib/engine/recommender';
import { caseUrl, patternUrl, topicUrl } from '../lib/url';
import { ErrorBox, Loading, StateBadge, pct, toast } from './ui';

export default function CasePanel({ caseId }: { caseId: string }) {
  const { app, error } = useApp();
  const [overlay, setOverlay] = useState<string | null>(null);
  const dlg = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState<string[]>([]);
  const [conf, setConf] = useState<number | undefined>();
  const [outcome, setOutcome] = useState<{ score: number; regress: boolean; passed: boolean } | null>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!app) return;
    if (!loaded.current) {
      loaded.current = true;
      const n = app.exerciseWork(`case-${caseId}`);
      if (n?.data?.answer) setAnswer(n.data.answer);
      const ex = app.caseProgress(caseId)?.exercise;
      if (ex) setChecked(ex.checked);
    }
    const els = document.querySelectorAll<HTMLElement>('[data-case-section]');
    const io = new IntersectionObserver((entries) => { for (const e of entries) if (e.isIntersecting) app.viewCaseSection(caseId, (e.target as HTMLElement).dataset.caseSection!); }, { threshold: 0.4 });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [app]);
  useEffect(() => { if (overlay) dlg.current?.showModal?.(); }, [overlay]);

  if (error) return <ErrorBox error={error} />;
  if (!app) return <Loading what="Checking your prerequisites" />;
  const { core, learner: L } = app;
  const c = core.cases.find((x) => x.id === caseId)!;
  const prog = app.caseProgress(caseId);
  const route = routeCase(L, caseId);
  const resume = app.profile.resume;
  const resumeHere = resume?.caseId === caseId;
  const queued = app.profile.queuedCaseId === caseId;
  const rubric = [...c.lessons.map((l) => `Your answer reflected this lesson: ${l}`), 'You separated what the sources document from what is Unknown, rather than filling gaps with assumptions.'];
  const closeOverlay = () => { dlg.current?.close(); setOverlay(null); opener.current?.focus(); };
  const ot = overlay ? core.topics.find((t) => t.id === overlay) : null;

  return (
    <div class="stack" data-testid="case-panel">
      {prog?.revisitBeforeContinuing ? <div class="banner warn" role="alert"><p><strong>Revisit before continuing.</strong> Your last review exercise for this case scored below the threshold, so its prerequisite topics were re-opened and their revision cards queued: {c.prereq_topics.map((p) => <a key={p} href={topicUrl(p)} style="margin-right:6px">{p}</a>)}</p></div> : null}
      <section class="card stack" aria-labelledby="pq-h">
        <h2 id="pq-h">Prerequisites for this case</h2>
        {c.prereq_topics.length ? <ul style="list-style:none;padding:0">{c.prereq_topics.map((p) => {
          const t = core.topics.find((x) => x.id === p)!;
          return <li key={p} style="margin-bottom:8px"><a href={topicUrl(p)}>{p} {t.title}</a> <StateBadge state={L.derived.topics[p].state} />{' '}
            <button type="button" class="btn sm" onClick={(e) => { opener.current = e.currentTarget as HTMLElement; setOverlay(p); }}>Where this concept is used</button></li>;
        })}</ul> : <p class="muted">No prerequisite topics are recorded for this case.</p>}
        {route ? (
          <div class="callout warn" role="note"><p style="color:var(--text)"><strong>Gap in the way:</strong> <a href={topicUrl(route.topicId)}>{route.topicId}</a> is {route.state === 'gap' ? 'a gap' : 'untested'}. Study it at <strong>{route.depth}</strong> depth first, then return here.</p>
            <button type="button" class="btn primary" onClick={async () => { await app.setResume({ caseId, section: [...(prog?.viewedSections ?? [])].pop(), viaTopic: route.topicId }); location.href = topicUrl(route.topicId); }}>Fix gaps first, then return</button>
            <span class="small muted" style="margin-left:8px">You can also read the case now; it is advisory, not locked.</span></div>
        ) : <p class="callout ok" role="note" style="color:var(--text)">All prerequisites are in place or compressed on current evidence.</p>}
        {resumeHere && !route ? <div class="callout ok"><p style="color:var(--text)">Welcome back. {resume?.section ? <>You were at <a href={`#${resume.section}`} onClick={() => app.setResume(null)}>{resume.section.replace(/-/g, ' ')}</a>.</> : 'Your prerequisite work is done.'} <button type="button" class="btn sm" onClick={() => app.setResume(null)}>Clear resume point</button></p></div> : null}
        <div class="row"><button type="button" class="btn" aria-pressed={queued} onClick={() => app.queueCase(queued ? null : caseId)}>{queued ? 'Queued: click to unqueue' : 'Queue this case'}</button>
          <span class="small muted">Sections viewed: {prog?.viewedSections.length ?? 0}</span></div>
      </section>

      <dialog ref={dlg} aria-labelledby="ov-h" onClose={() => setOverlay(null)} style="max-width:min(640px,92vw);border-radius:10px;border:1px solid var(--border-strong);background:var(--surface);color:var(--text)">
        {ot ? <div class="stack">
          <h2 id="ov-h">{ot.id} {ot.title}</h2>
          <p class="small muted">Why it matters for this case and where else it appears.</p>
          <h3>What you should be able to do</h3><ul>{ot.obj.map((o) => <li key={o}>{o}</li>)}</ul>
          {ot.pat.filter((p) => c.patterns.includes(p)).length ? <p>Patterns shared with this case: {ot.pat.filter((p) => c.patterns.includes(p)).map((p) => <a key={p} href={patternUrl(p)} style="margin-right:6px">{p} {core.patterns[p]}</a>)}</p> : null}
          <p>Other cases that need it: {ot.verified_case_ids.filter((x) => x !== caseId).length ? ot.verified_case_ids.filter((x) => x !== caseId).map((x) => <a key={x} href={caseUrl(x)} style="margin-right:6px">{x}</a>) : 'none yet'}</p>
          <div class="row"><a class="btn primary" href={topicUrl(ot.id)}>Open the topic</a><button type="button" class="btn" onClick={closeOverlay}>Close</button></div>
        </div> : null}
      </dialog>

      {c.review_exercise ? (
        <section class="card stack" aria-labelledby="ex-h" id="exercise-panel">
          <h2 id="ex-h">Review exercise</h2>
          <p class="reading" style="max-width:none">{c.review_exercise}</p>
          <div class="field"><label for="ans">Your answer (kept on this device)</label>
            <textarea id="ans" value={answer} onInput={(e) => setAnswer((e.target as HTMLTextAreaElement).value)} onBlur={() => app.saveExerciseWork(`case-${caseId}`, { answer }).then(async () => { /* stored as exercise note */ })} /></div>
          <fieldset style="border:0;padding:0;margin:0"><legend><strong>Self-score against the case's lessons</strong> <span class="muted small">(not machine-graded; be honest, a low score reopens the prerequisite topics, which is the point)</span></legend>
            <div style="display:grid;gap:8px;margin-top:8px">{rubric.map((r) => <label key={r} class={`choice ${checked.includes(r) ? 'picked' : ''}`}><input type="checkbox" checked={checked.includes(r)} onChange={() => setChecked(checked.includes(r) ? checked.filter((x) => x !== r) : [...checked, r])} /><span>{r}</span></label>)}</div></fieldset>
          <fieldset style="border:0;padding:0;margin:0"><legend>Confidence in your answer (1–5)</legend><div class="row">{[1, 2, 3, 4, 5].map((n) => <label key={n} class={`choice ${conf === n ? 'picked' : ''}`} style="min-width:56px;justify-content:center"><input type="radio" name="cx" checked={conf === n} onChange={() => setConf(n)} />{n}</label>)}</div></fieldset>
          <div><button type="button" class="btn primary" onClick={async () => { const o = await app.submitCaseExercise(caseId, checked.filter((x) => rubric.includes(x)), rubric.length, { answer, checked }, conf); setOutcome(o); toast(o.passed ? 'Exercise recorded as passed' : o.regress ? 'Exercise recorded: revisit the prerequisites' : 'Exercise recorded'); }}>Record my score</button></div>
          {(outcome || prog?.exercise) ? <p role="status" class={`callout ${(outcome?.regress ?? prog?.revisitBeforeContinuing) ? 'warn' : 'ok'}`} style="color:var(--text)">Score {pct(outcome?.score ?? prog?.exercise?.score)}. {(outcome?.passed ?? prog?.exercise?.passed) ? 'Passed: this counts toward the case gate and marks the demonstrated patterns as studied.' : (outcome?.regress ?? prog?.revisitBeforeContinuing) ? 'Below the threshold: the case’s prerequisite topics were re-opened and revision queued. Revisit before continuing.' : 'Recorded, not yet at the pass threshold.'}</p> : null}
        </section>
      ) : <section class="empty" id="exercise-panel">No review exercise is recorded for this case yet.</section>}
    </div>
  );
}
