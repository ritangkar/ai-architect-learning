import { useEffect, useRef, useState } from 'preact/hooks';
import { BASE } from '../lib/url';

interface Hit { url: string; title: string; excerpt: string; type?: string }
export default function Search() {
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [pillar, setPillar] = useState('');
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [err, setErr] = useState('');
  const pf = useRef<any>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { input.current?.focus(); const p = new URLSearchParams(location.search).get('q'); if (p) setQ(p); }, []);
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!q.trim()) { setHits(null); return; }
      try {
        if (!pf.current) {
          pf.current = await import(/* @vite-ignore */ `${BASE}pagefind/pagefind.js`);
          await pf.current.options({ basePath: `${BASE}pagefind/` });
        }
        const filters: Record<string, string> = {};
        if (pillar) filters.pillar = pillar;
        const res = await pf.current.search(q, { filters });
        const data: Hit[] = await Promise.all(res.results.slice(0, 20).map(async (r: any) => { const d = await r.data(); return { url: d.url, title: d.meta?.title ?? d.url, excerpt: d.excerpt, type: d.meta?.type }; }));
        if (alive) { setHits(type ? data.filter((h) => (h.type ?? '').toLowerCase() === type) : data); setErr(''); }
      } catch (e: any) {
        if (alive) setErr('Search is built when the site is built, so it is not available in the development server. Run a production build to use it.');
      }
    })();
    return () => { alive = false; };
  }, [q, type, pillar]);
  return (
    <div class="stack">
      <h1>Search</h1>
      <p class="muted small">Searches topics, lessons, cases, patterns and sources. The index is built with the site and the search runs entirely in your browser: nothing you type is sent anywhere. Shortcut: press <kbd>/</kbd> on any page.</p>
      <form role="search" class="filters" onSubmit={(e) => e.preventDefault()}>
        <div class="field"><label for="sq">Search</label><input id="sq" ref={input} type="search" value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} style="min-width:min(100%,320px)" /></div>
        <div class="field"><label for="st">Type</label><select id="st" value={type} onChange={(e) => setType((e.target as HTMLSelectElement).value)}><option value="">All</option><option value="topic">Topic</option><option value="case">Case</option><option value="pattern">Pattern</option></select></div>
        <div class="field"><label for="sp">Pillar</label><select id="sp" value={pillar} onChange={(e) => setPillar((e.target as HTMLSelectElement).value)}><option value="">All</option><option value="P1">P1</option><option value="P2">P2</option><option value="P3">P3</option></select></div>
      </form>
      {err ? <p class="callout warn" role="status">{err}</p> : null}
      <div aria-live="polite">{hits && !err ? <p>{hits.length} result{hits.length === 1 ? '' : 's'}</p> : null}
        <ul style="list-style:none;padding:0">{(hits ?? []).map((h) => <li class="card" style="margin-bottom:8px" key={h.url}><a href={h.url}><strong>{h.title}</strong></a> {h.type ? <span class="badge neutral">{h.type}</span> : null}<p class="small" dangerouslySetInnerHTML={{ __html: h.excerpt }} /></li>)}</ul>
      </div>
    </div>
  );
}
