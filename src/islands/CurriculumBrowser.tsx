import { useApp } from '../lib/app/hooks';
import { caseUrl, moduleUrl, patternUrl, topicUrl } from '../lib/url';
import { ErrorBox, Loading, StateBadge } from './ui';
import { useQueryState } from './filters';

const D = { pillar: '', competency: '', state: '', hands: '', q: '' };

export default function CurriculumBrowser() {
  const { app, error } = useApp();
  const [f, set, clear] = useQueryState(D);
  if (error) return <ErrorBox error={error} />;
  if (!app) return <Loading what="Loading the curriculum" />;
  const { core, learner: L } = app;
  const match = (t: (typeof core.topics)[number]) =>
    (!f.pillar || t.pillar === f.pillar) && (!f.competency || t.comps.includes(f.competency)) && (!f.state || L.derived.topics[t.id].state === f.state) && (!f.hands || t.hands === f.hands) &&
    (!f.q || `${t.id} ${t.title} ${t.obj.join(' ')}`.toLowerCase().includes(f.q.toLowerCase()));
  const shown = core.topics.filter(match);
  return (
    <div class="stack">
      <h1>Curriculum</h1>
      <p class="muted">{core.counts.topics} topics in {Object.keys(core.modules).length} modules across {Object.keys(core.pillars).length} pillars. Filters combine (all must match) and are kept in the page address so you can bookmark a view.</p>
      <form class="filters" role="search" aria-label="Filter topics" onSubmit={(e) => e.preventDefault()}>
        <div class="field"><label for="f-q">Text</label><input id="f-q" type="search" value={f.q} onInput={(e) => set('q', (e.target as HTMLInputElement).value)} /></div>
        <div class="field"><label for="f-p">Pillar</label><select id="f-p" value={f.pillar} onChange={(e) => set('pillar', (e.target as HTMLSelectElement).value)}><option value="">All</option>{Object.entries(core.pillars).map(([k, v]) => <option value={k} key={k}>{k} {v}</option>)}</select></div>
        <div class="field"><label for="f-c">Competency</label><select id="f-c" value={f.competency} onChange={(e) => set('competency', (e.target as HTMLSelectElement).value)}><option value="">All</option>{Object.entries(core.competencies).map(([k, v]) => <option value={k} key={k}>{k} {v}</option>)}</select></div>
        <div class="field"><label for="f-s">State</label><select id="f-s" value={f.state} onChange={(e) => set('state', (e.target as HTMLSelectElement).value)}><option value="">All</option>{['unknown', 'gap', 'developing', 'proficient', 'mastered'].map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
        <div class="field"><label for="f-h">Hands-on</label><select id="f-h" value={f.hands} onChange={(e) => set('hands', (e.target as HTMLSelectElement).value)}><option value="">All</option><option value="none">None</option><option value="browser">Browser only</option><option value="optional_local">Optional local</option></select></div>
        <button type="button" class="btn" onClick={clear}>Clear filters</button>
      </form>
      <p role="status" aria-live="polite">{shown.length} of {core.topics.length} topics match.</p>
      {Object.entries(core.modules).map(([mid, m]) => {
        const ts = shown.filter((t) => t.module === mid);
        if (!ts.length) return null;
        return (
          <section key={mid} aria-labelledby={`m-${mid}`}>
            <h2 id={`m-${mid}`}><a href={moduleUrl(mid)}>{mid} {m.title}</a> <span class="muted small">({core.pillars[m.pillar]})</span></h2>
            <div class="grid cols-2">
              {ts.map((t) => {
                const ev = L.derived.topics[t.id];
                return (
                  <article class="card" key={t.id}>
                    <h3><a href={topicUrl(t.id)}>{t.id} {t.title}</a></h3>
                    <div class="row"><StateBadge state={ev.state} /><span class="badge neutral">{L.depth[t.id].depth}</span>{t.hasLesson ? <span class="badge tier-A">lesson ({t.lessonStatus})</span> : <span class="badge neutral">lesson not written yet</span>}{t.sap_status ? <span class="badge warn">SAP status note</span> : null}</div>
                    <p class="small muted">Competencies: {t.comps.join(', ')} · Hands-on: {t.hands}</p>
                    {t.sap_status ? <p class="small"><strong>Status:</strong> {t.sap_status}</p> : null}
                    {t.verified_case_ids.length ? <p class="small">Cases: {t.verified_case_ids.map((c) => <a key={c} href={caseUrl(c)} style="margin-right:6px">{c}</a>)}</p> : null}
                    {t.pat.length ? <p class="small">Patterns: {t.pat.map((p) => <a key={p} href={patternUrl(p)} style="margin-right:6px">{p}</a>)}</p> : null}
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
      {!shown.length ? <div class="empty">No topic matches these filters. <button class="btn sm" onClick={clear}>Clear filters</button></div> : null}
    </div>
  );
}
