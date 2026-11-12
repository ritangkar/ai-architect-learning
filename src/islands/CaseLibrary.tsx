import { useApp } from '../lib/app/hooks';
import { caseUrl, patternUrl } from '../lib/url';
import { prereqMet } from '../lib/engine/learner';
import { ErrorBox, Loading } from './ui';
import { useQueryState } from './filters';
import type { CaseInfo } from '../lib/app/bundle';

const D = { industry: '', category: '', pattern: '', tech: '', tier: '', ready: '', sap: '', q: '' };
const isSap = (c: CaseInfo) => /\bSAP\b/i.test(`${c.company} ${c.title} ${c.tech.join(' ')}`) || c.prereq_topics.some((t) => t.startsWith('T2.'));

export default function CaseLibrary() {
  const { app, error } = useApp();
  const [f, set, clear] = useQueryState(D);
  if (error) return <ErrorBox error={error} />;
  if (!app) return <Loading what="Loading the case library" />;
  const { core, learner: L } = app;
  const tiers = Object.entries(core.counts.casesByTier).sort();
  const industries = [...new Set(core.cases.map((c) => c.industry))].sort();
  const cats = [...new Set(core.cases.flatMap((c) => c.category))].sort();
  const techs = [...new Set(core.cases.flatMap((c) => c.tech))].sort();
  const ready = (c: CaseInfo) => c.prereq_topics.every((t) => prereqMet(L, t));
  const rows = core.cases.filter((c) =>
    (!f.industry || c.industry === f.industry) && (!f.category || c.category.includes(f.category)) && (!f.pattern || c.patterns.includes(f.pattern)) && (!f.tech || c.tech.includes(f.tech)) && (!f.tier || c.tier === f.tier) &&
    (!f.ready || (f.ready === 'yes') === ready(c)) && (!f.sap || (f.sap === 'yes') === isSap(c)) && (!f.q || `${c.company} ${c.title} ${c.depth}`.toLowerCase().includes(f.q.toLowerCase())));
  const real = rows.filter((c) => !c.simulation);
  const sims = rows.filter((c) => c.simulation);
  const Card = ({ c }: { c: CaseInfo }) => {
    const r = ready(c);
    const prog = app.caseProgress(c.id);
    return (
      <article class="card">
        <div class="row" style="justify-content:space-between"><span class={`badge tier-${c.tier}`}>Tier {c.tier}</span>{c.simulation ? <span class="badge sim">SIMULATION</span> : null}{c.verify ? <span class="badge warn">verify before use</span> : null}</div>
        <h3><a href={caseUrl(c.id)}>{c.company}: {c.title}</a></h3>
        <p class="small muted">{c.industry}</p>
        <p class="small">{c.category.join(' · ')}</p>
        <p class="small">Patterns: {c.patterns.map((p) => <a key={p} href={patternUrl(p)} style="margin-right:6px">{p}</a>)}</p>
        <p class="small muted">{c.depth} · {c.decisions} documented decision(s) · {c.facts} verified fact(s)</p>
        <p class="small">{r ? <span class="badge tier-A">prerequisites in place</span> : <span class="badge warn">prerequisite gaps</span>} {prog?.exercise?.passed ? <span class="badge tier-A">exercise passed</span> : null}</p>
      </article>
    );
  };
  return (
    <div class="stack">
      <div class="card">
        <p><strong>{core.counts.cases} cases catalogued.</strong> By tier: {tiers.map(([t, n]) => `Tier ${t}: ${n}`).join(' · ')}.</p>
        {core.catalogNote ? <p class="callout warn" role="note"><span class="prov U">note</span> {core.catalogNote}</p> : null}
        <p class="small muted">Tier A: builder-authored technical source. A-provisional: primary source identified, full body not yet read. B: structured analysis with limited depth. C: catalogue stub (marketing or secondary): no invented detail. Counts above are computed from the catalogue; any larger target in project documents is aspirational.</p>
      </div>
      <form class="filters" role="search" aria-label="Filter cases" onSubmit={(e) => e.preventDefault()}>
        <div class="field"><label for="c-q">Text</label><input id="c-q" type="search" value={f.q} onInput={(e) => set('q', (e.target as HTMLInputElement).value)} /></div>
        <div class="field"><label for="c-i">Industry</label><select id="c-i" value={f.industry} onChange={(e) => set('industry', (e.target as HTMLSelectElement).value)}><option value="">All</option>{industries.map((x) => <option key={x} value={x}>{x}</option>)}</select></div>
        <div class="field"><label for="c-c">Category</label><select id="c-c" value={f.category} onChange={(e) => set('category', (e.target as HTMLSelectElement).value)}><option value="">All</option>{cats.map((x) => <option key={x}>{x}</option>)}</select></div>
        <div class="field"><label for="c-p">Pattern</label><select id="c-p" value={f.pattern} onChange={(e) => set('pattern', (e.target as HTMLSelectElement).value)}><option value="">All</option>{Object.entries(core.patterns).map(([k, v]) => <option key={k} value={k}>{k} {v}</option>)}</select></div>
        <div class="field"><label for="c-t">Technology</label><select id="c-t" value={f.tech} onChange={(e) => set('tech', (e.target as HTMLSelectElement).value)}><option value="">All</option>{techs.map((x) => <option key={x}>{x}</option>)}</select></div>
        <div class="field"><label for="c-r">Tier / evidence depth</label><select id="c-r" value={f.tier} onChange={(e) => set('tier', (e.target as HTMLSelectElement).value)}><option value="">All</option>{tiers.map(([t]) => <option key={t} value={t}>Tier {t}</option>)}</select></div>
        <div class="field"><label for="c-y">Prerequisites</label><select id="c-y" value={f.ready} onChange={(e) => set('ready', (e.target as HTMLSelectElement).value)}><option value="">Any</option><option value="yes">In place</option><option value="no">Gaps</option></select></div>
        <div class="field"><label for="c-s">SAP relevance</label><select id="c-s" value={f.sap} onChange={(e) => set('sap', (e.target as HTMLSelectElement).value)}><option value="">Any</option><option value="yes">SAP-related</option><option value="no">Not SAP</option></select></div>
        <button type="button" class="btn" onClick={clear}>Clear filters</button>
      </form>
      <p role="status" aria-live="polite">{rows.length} of {core.cases.length} cases match.</p>
      <div class="grid cols-2">{real.map((c) => <Card key={c.id} c={c} />)}</div>
      {!rows.length ? <div class="empty">No case matches these filters.</div> : null}
      <section aria-labelledby="sims"><h2 id="sims">Simulations</h2>
        <p class="small muted">Constructed teaching scenarios are never mixed with real cases and always carry a SIMULATION badge.</p>
        {sims.length ? <div class="grid cols-2">{sims.map((c) => <Card key={c.id} c={c} />)}</div> : <div class="empty">No simulation cases authored yet. Capstone simulations are planned for a later content phase.</div>}
      </section>
    </div>
  );
}
