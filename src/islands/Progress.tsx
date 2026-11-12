import { useApp } from '../lib/app/hooks';
import { milestones, patternsStudied } from '../lib/app/milestones';
import { caseUrl, patternUrl, topicUrl, url } from '../lib/url';
import { ErrorBox, Loading, RangeBar, StateBadge, pct } from './ui';

export default function Progress() {
  const { app, error } = useApp();
  if (error) return <ErrorBox error={error} />;
  if (!app) return <Loading what="Loading progress" />;
  const { core, learner: L } = app;
  const ms = milestones(app);
  const studied = patternsStudied(app);
  const gaps = core.model.topics.filter((t) => L.derived.topics[t.id].state === 'gap').sort((a, b) => (L.derived.topics[a.id].E ?? 0) - (L.derived.topics[b.id].E ?? 0));
  const weakComps = Object.entries(core.competencies).filter(([k]) => L.derived.competencies[k].E !== null).sort((a, b) => L.derived.competencies[a[0]].E! - L.derived.competencies[b[0]].E!).slice(0, 5);
  const orph = L.derived;
  return (
    <div class="stack">
      <h1>Progress</h1>
      <section class="card" aria-labelledby="lv"><h2 id="lv">Levels and gates</h2>
        <p>Attained: <strong>{L.attained ?? 'none yet'}</strong>. A level is attained only when every condition of its gate is met by assessed evidence.</p>
        {L.levels.map((lv) => (
          <details class="acc" key={lv.id} open={lv.id === L.nextLevel?.id}>
            <summary>{lv.met ? '✓' : '○'} {lv.id} {lv.name} <span class="muted small" style="margin-left:8px">{lv.met ? 'gate met' : `${lv.conditions.filter((c) => c.met).length} of ${lv.conditions.length} conditions met`}</span></summary>
            <div><ul style="list-style:none;padding:0">{lv.conditions.map((c) => <li key={c.label}><span aria-hidden="true">{c.met ? '✓' : '○'}</span><span class="visually-hidden">{c.met ? 'Met: ' : 'Not met: '}</span> {c.label} <span class="muted">({c.detail})</span></li>)}</ul></div>
          </details>
        ))}
      </section>

      <section class="card" aria-labelledby="ms"><h2 id="ms">Milestones</h2>
        <ul style="list-style:none;padding:0">{ms.map((m) => <li key={m.id}><span aria-hidden="true">{m.earned ? '✓' : '○'}</span> <strong>{m.title}</strong> <span class="visually-hidden">{m.earned ? '(earned)' : '(not yet)'}</span><br /><span class="muted small">{m.earned ? 'Earned because: ' : 'How: '}{m.because}</span></li>)}</ul>
        {app.settings.showStreak ? <p class="small muted">Active days in a row: {app.streakDays()}. Missed days carry no penalty and never reset anything that matters.</p> : null}
      </section>

      <section class="card" aria-labelledby="hm"><h2 id="hm">Topic heat map</h2>
        <p class="small muted">Each square is a topic. Colour, symbol and the text label together show its state.</p>
        {Object.entries(core.modules).map(([mid, m]) => (
          <div key={mid}><h3>{mid} {m.title}</h3>
            <ul class="pill-list">{core.model.topics.filter((t) => t.module === mid).map((t) => <li key={t.id}><a href={topicUrl(t.id)} title={`${t.title}`}><StateBadge state={L.derived.topics[t.id].state} label={`${t.id} ${L.derived.topics[t.id].state}`} /></a></li>)}</ul></div>
        ))}
      </section>

      <div class="grid cols-2">
        <section class="card" aria-labelledby="gp"><h2 id="gp">Gaps and suggested actions</h2>
          {gaps.length ? <ul>{gaps.map((t) => <li key={t.id}><a href={topicUrl(t.id)}>{t.id} {t.title}</a> <span class="muted small">score {pct(L.derived.topics[t.id].E)}. Suggested: study at deep depth, then re-answer its check questions.</span></li>)}</ul> : <p class="muted">No topic is in gap on current evidence.</p>}
          <h3>Weakest competencies</h3>
          {weakComps.length ? <ul>{weakComps.map(([k, n]) => { const e = L.derived.competencies[k]; return <li key={k}>{k} {n}: {pct(e.E)} {e.lowEvidence ? '(low evidence)' : ''}<RangeBar e={e.E} lo={e.lo} hi={e.hi} label={n} /></li>; })}</ul> : <p class="muted">No competency evidence yet.</p>}
        </section>
        <section class="card" aria-labelledby="pt"><h2 id="pt">Patterns studied</h2>
          <p class="small muted">A pattern counts as studied when a case that demonstrates it has been completed and its review exercise passed.</p>
          <ul>{Object.entries(core.patterns).map(([id, name]) => <li key={id}>{studied[id] ? '✓' : '○'} <a href={patternUrl(id)}>{id} {name}</a>{studied[id] ? <span class="muted small"> via {studied[id].map((c) => <a key={c} href={caseUrl(c)}>{c}</a>)}</span> : null}</li>)}</ul>
        </section>
      </div>
      {orph.orphanAttemptIds.length ? <div class="callout warn"><p><strong>{orph.orphanAttemptIds.length} retained record(s)</strong> refer to topics that no longer exist in the curriculum ({orph.orphanTopicIds.join(', ')}). They are kept, flagged and excluded from the metrics above.</p></div> : null}
      <p><a class="btn" href={url('competencies/')}>Competency detail</a></p>
    </div>
  );
}
