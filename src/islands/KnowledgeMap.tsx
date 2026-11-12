import { useEffect, useMemo, useState } from 'preact/hooks';
import { useApp } from '../lib/app/hooks';
import { recommend } from '../lib/engine/recommender';
import { topoOrder } from '../lib/engine/learner';
import { patternsStudied } from '../lib/app/milestones';
import { renderDiagram } from '../lib/render/diagram';
import { caseUrl, patternUrl, topicUrl, url, dataUrl } from '../lib/url';
import { ErrorBox, Loading, StateBadge, pct } from './ui';
import type { Graph } from '../lib/content/graph';

type Preset = 'pattern' | 'multi' | 'before' | 'studied' | 'weak' | 'next';
const PRESETS: { id: Preset; label: string }[] = [
  { id: 'pattern', label: 'Which cases demonstrate pattern X?' },
  { id: 'multi', label: 'Which cases use multi-agent orchestration?' },
  { id: 'before', label: 'Which topics come before case Y?' },
  { id: 'studied', label: 'Which patterns have I studied?' },
  { id: 'weak', label: 'What are my weakest competencies?' },
  { id: 'next', label: 'What should I learn next?' },
];

export default function KnowledgeMap() {
  const { app, error } = useApp();
  const [graph, setGraph] = useState<Graph | null>(null);
  const [preset, setPreset] = useState<Preset>('pattern');
  const [pat, setPat] = useState('PAT06');
  const [cs, setCs] = useState('');
  const [view, setView] = useState<'list' | 'graph'>('list');
  useEffect(() => { fetch(dataUrl('graph')).then((r) => r.json()).then(setGraph).catch(() => setGraph(null)); }, []);
  const core = app?.core;
  useEffect(() => { if (core && !cs) setCs(core.cases[0]?.id ?? ''); }, [core]);

  const result = useMemo(() => {
    if (!app || !graph) return null;
    const { core: c, learner: L } = app;
    const edges = graph.edges;
    if (preset === 'pattern') return { kind: 'cases' as const, items: edges.filter((e) => e.type === 'demonstrates' && e.to === pat).map((e) => e.from), why: `Cases linked to ${pat} ${c.patterns[pat]} by a "demonstrates" edge in the knowledge graph.` };
    if (preset === 'multi') {
      const byPat = new Set(edges.filter((e) => e.type === 'demonstrates' && e.to === 'PAT06').map((e) => e.from));
      const byCat = new Set(c.cases.filter((x) => x.category.some((k) => /multi-agent/i.test(k))).map((x) => x.id));
      return { kind: 'cases' as const, items: [...new Set([...byPat, ...byCat])].sort(), why: 'Cases that demonstrate PAT06 Supervisor multi-agent, or are categorised "Multi-agent architectures".' };
    }
    if (preset === 'before') {
      const need = new Set<string>();
      const walk = (id: string) => { if (need.has(id)) return; need.add(id); edges.filter((e) => e.type === 'requires' && e.from === id).forEach((e) => walk(e.to)); };
      edges.filter((e) => e.type === 'requires' && e.from === cs).forEach((e) => walk(e.to));
      const order = topoOrder(c.model.topics);
      return { kind: 'topics' as const, items: order.filter((t) => need.has(t)), why: `Prerequisite topics of ${cs} and everything they require, in study order.`, edgesFor: edges.filter((e) => e.type === 'requires' && (e.from === cs || need.has(e.from))) };
    }
    if (preset === 'studied') { const s = patternsStudied(app); return { kind: 'patterns' as const, items: Object.keys(c.patterns), studied: s, why: 'A pattern is studied when a case demonstrating it has a passed review exercise.' }; }
    if (preset === 'weak') return { kind: 'comps' as const, items: Object.keys(c.competencies).filter((k) => L.derived.competencies[k].E !== null).sort((a, b) => L.derived.competencies[a].E! - L.derived.competencies[b].E!).slice(0, 6), why: 'Lowest evidence-based estimates first. Competencies with no evidence yet are omitted.' };
    return { kind: 'rec' as const, items: recommend(L).slots.map((s) => s.primary), why: 'The same deterministic recommender as the dashboard.' };
  }, [app?.version, graph, preset, pat, cs]);

  if (error) return <ErrorBox error={error} />;
  if (!app || !core) return <Loading what="Loading the knowledge map" />;
  const caseName = (id: string) => { const x = core.cases.find((k) => k.id === id); return x ? `${x.company}: ${x.title}` : id; };
  const diagram = () => {
    if (!result || !graph) return '';
    try {
      if (preset === 'pattern' || preset === 'multi') {
        const items = result.items as string[];
        const pid = preset === 'pattern' ? pat : 'PAT06';
        return renderDiagram({ id: 'map-' + preset, title: `Cases demonstrating ${pid}`, description: `Graph of ${items.length} cases linked to pattern ${pid}.`, direction: 'LR', nodes: [...items.map((i) => ({ id: i, label: caseName(i) })), { id: pid, label: `${pid} ${core.patterns[pid]}` }], edges: items.map((i) => ({ from: i, to: pid, label: 'demonstrates' })) } as any, { illustrativeLabel: 'Generated from the knowledge graph' });
      }
      if (preset === 'before' && 'edgesFor' in result) {
        const ids = new Set<string>([cs, ...(result.items as string[])]);
        return renderDiagram({ id: 'map-before', title: `Topics before ${cs}`, description: `Prerequisite graph for ${cs}.`, direction: 'LR', nodes: [...ids].map((i) => ({ id: i, label: i === cs ? caseName(i) : `${i} ${core.topics.find((t) => t.id === i)?.title ?? ''}` })), edges: (result.edgesFor ?? []).filter((e: any) => ids.has(e.from) && ids.has(e.to)).map((e: any) => ({ from: e.to, to: e.from })) } as any, { illustrativeLabel: 'Generated from the knowledge graph' });
      }
    } catch { return ''; }
    return '';
  };
  const gHtml = view === 'graph' ? diagram() : '';
  return (
    <div class="stack">
      <h1>Knowledge map</h1>
      <p class="muted">Pick a question; every answer is two interactions or fewer. The list is the primary view; the graph is an optional extra for relationship questions.</p>
      {!graph ? <p class="callout warn" role="note">The graph data could not be loaded, so queries that need it are unavailable.</p> : null}
      <div role="radiogroup" aria-label="Question" class="row">
        {PRESETS.map((p) => <label key={p.id} class={`choice ${preset === p.id ? 'picked' : ''}`}><input type="radio" name="preset" checked={preset === p.id} onChange={() => setPreset(p.id)} />{p.label}</label>)}
      </div>
      {preset === 'pattern' ? <div class="field"><label for="mp">Pattern</label><select id="mp" value={pat} onChange={(e) => setPat((e.target as HTMLSelectElement).value)}>{Object.entries(core.patterns).map(([k, v]) => <option key={k} value={k}>{k} {v}</option>)}</select></div> : null}
      {preset === 'before' ? <div class="field"><label for="mc">Case</label><select id="mc" value={cs} onChange={(e) => setCs((e.target as HTMLSelectElement).value)}>{core.cases.map((c) => <option key={c.id} value={c.id}>{c.id} {c.company}: {c.title}</option>)}</select></div> : null}
      {result ? (
        <section class="card" aria-live="polite" aria-labelledby="mr-h">
          <h2 id="mr-h">Answer</h2>
          <p class="small muted">{result.why}</p>
          {result.kind === 'cases' ? (result.items.length ? <ul>{(result.items as string[]).map((id) => <li key={id}><a href={caseUrl(id)}>{id} {caseName(id)}</a> <span class={`badge tier-${core.cases.find((x) => x.id === id)?.tier}`}>Tier {core.cases.find((x) => x.id === id)?.tier}</span></li>)}</ul> : <p class="empty">No catalogued case demonstrates this yet. That is a coverage gap, not an error.</p>) : null}
          {result.kind === 'topics' ? <ol>{(result.items as string[]).map((id) => <li key={id}><a href={topicUrl(id)}>{id} {core.topics.find((t) => t.id === id)?.title}</a> <StateBadge state={app.learner.derived.topics[id].state} /></li>)}</ol> : null}
          {result.kind === 'patterns' ? <ul>{(result.items as string[]).map((id) => <li key={id}>{(result as any).studied[id] ? '✓ studied' : '○ not yet'} · <a href={patternUrl(id)}>{id} {core.patterns[id]}</a></li>)}</ul> : null}
          {result.kind === 'comps' ? (result.items.length ? <ol>{(result.items as string[]).map((k) => <li key={k}>{k} {core.competencies[k]}: {pct(app.learner.derived.competencies[k].E)} <StateBadge state={app.learner.derived.competencies[k].state} /></li>)}</ol> : <p class="empty">No evidence yet. <a href={url('assessment/')}>Take the assessment</a>.</p>) : null}
          {result.kind === 'rec' ? <ol>{(result.items as any[]).map((a) => <li key={a.id}><strong>{a.title}</strong> ({a.action}): {a.because.join('; ')}.</li>)}</ol> : null}
          {(preset === 'pattern' || preset === 'multi' || preset === 'before') ? (
            <div style="margin-top:12px"><div class="tabs" role="tablist" aria-label="View"><button role="tab" aria-selected={view === 'list'} onClick={() => setView('list')}>List</button><button role="tab" aria-selected={view === 'graph'} onClick={() => setView('graph')}>Graph (optional)</button></div>
              {view === 'graph' ? (gHtml ? <div dangerouslySetInnerHTML={{ __html: gHtml }} /> : <p class="callout warn" role="note">The graph view could not be drawn here, so the list above is the answer.</p>) : null}</div>
          ) : null}
        </section>
      ) : <Loading what="Loading graph" />}
    </div>
  );
}
