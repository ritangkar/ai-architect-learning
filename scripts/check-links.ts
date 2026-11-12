// Internal mode (build gate): every internal href/src in dist must live under the base path, resolve to a file, and anchors must exist.
// External mode (report only): probes external URLs; failures are WARNINGS written to reports/link-report.json and never drop a resource.
import fs from 'node:fs';
import path from 'node:path';
import { loadContent } from '../src/lib/content/load';
// @ts-ignore plain JS helper
import { resolveSite } from './site-config.mjs';

const mode = process.argv.includes('--external') ? 'external' : 'internal';
const { base } = resolveSite();
const dist = path.resolve('dist');

function walk(dir: string, out: string[] = []): string[] {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) { if (f.name !== 'pagefind') walk(p, out); } else if (f.name.endsWith('.html')) out.push(p);
  }
  return out;
}
const idsCache = new Map<string, Set<string>>();
function ids(file: string): Set<string> {
  if (!idsCache.has(file)) idsCache.set(file, new Set([...fs.readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  return idsCache.get(file)!;
}
function resolveTarget(p: string): string | null {
  const rel = p.slice(base === '/' ? 0 : base.length);
  const f = path.join(dist, rel);
  if (!f.startsWith(dist)) return null;
  if (fs.existsSync(f) && fs.statSync(f).isFile()) return f;
  const idx = path.join(f, 'index.html');
  return fs.existsSync(idx) ? idx : null;
}

if (mode === 'internal') {
  if (!fs.existsSync(dist)) { console.error('dist/ not found. Run the build first.'); process.exit(1); }
  const errors: string[] = [];
  let checked = 0;
  const prefix = base === '/' ? '/' : base + '/';
  for (const page of walk(dist)) {
    const html = fs.readFileSync(page, 'utf8');
    const rel = path.relative(dist, page);
    for (const m of html.matchAll(/\s(href|src)="([^"]*)"/g)) {
      const v = m[2].replace(/&amp;/g, '&');
      if (!v || v.startsWith('#') && v.length === 1) continue;
      if (/^(https?:|mailto:|data:|tel:)/.test(v)) continue;
      checked++;
      if (v.startsWith('#')) { if (!ids(page).has(v.slice(1))) errors.push(`${rel}: missing in-page anchor ${v}`); continue; }
      if (!v.startsWith('/')) { errors.push(`${rel}: relative internal URL "${v}" (must be built with url())`); continue; }
      if (v.startsWith('//')) continue;
      if (!(v + (v.endsWith('/') ? '' : '')).startsWith(prefix) && v !== base) { errors.push(`${rel}: internal URL "${v}" is not under the base path ${prefix}`); continue; }
      const [pathPart, hash] = v.split('#');
      const target = resolveTarget(pathPart.split('?')[0]);
      if (!target) { errors.push(`${rel}: broken internal link ${v}`); continue; }
      if (hash && target.endsWith('.html') && !ids(target).has(hash)) errors.push(`${rel}: ${v} points to a missing anchor`);
    }
  }
  console.log(`Internal link check: ${walk(dist).length} pages, ${checked} internal references, ${errors.length} problem(s).`);
  for (const e of errors.slice(0, 60)) console.error('  ' + e);
  process.exit(errors.length ? 1 : 0);
} else {
  const { content } = loadContent(path.resolve('content'));
  const urls = new Map<string, string[]>();
  const add = (u: string, who: string) => urls.set(u, [...(urls.get(u) ?? []), who]);
  for (const s of content.sources) add(s.url, `source ${s.id}`);
  for (const r of content.resources) add(r.url, `resource ${r.id} (status ${r.status})`);
  for (const [k, v] of Object.entries(content.resourceSources)) if (/^[a-z0-9.-]+\.[a-z]{2,}(\/[\w./-]*)?$/i.test(v.domain_hint)) add('https://' + v.domain_hint, `resource slot ${k}`);
  const results: any[] = [];
  const queue = [...urls.entries()];
  async function worker() {
    while (queue.length) {
      const [u, who] = queue.shift()!;
      const ctl = new AbortController();
      const t = setTimeout(() => ctl.abort(), 12000);
      try {
        let r = await fetch(u, { method: 'HEAD', redirect: 'follow', signal: ctl.signal, headers: { 'user-agent': 'architect-lab-link-check' } });
        if (r.status === 405 || r.status === 403) r = await fetch(u, { method: 'GET', redirect: 'follow', signal: ctl.signal, headers: { 'user-agent': 'architect-lab-link-check' } });
        results.push({ url: u, usedBy: who, status: r.status, ok: r.ok });
      } catch (e: any) { results.push({ url: u, usedBy: who, status: null, ok: false, error: String(e?.cause?.code ?? e?.message ?? e) }); } finally { clearTimeout(t); }
    }
  }
  await Promise.all(Array.from({ length: 8 }, worker));
  results.sort((a, b) => a.url.localeCompare(b.url));
  fs.mkdirSync('reports', { recursive: true });
  fs.writeFileSync('reports/link-report.json', JSON.stringify({ generated: new Date().toISOString(), note: 'Failures are warnings. Resources are never dropped; broken ones are shown with a label.', total: results.length, failed: results.filter((r) => !r.ok).length, results }, null, 1));
  const bad = results.filter((r) => !r.ok);
  console.log(`External link check: ${results.length} URLs, ${bad.length} warning(s). Report: reports/link-report.json`);
  for (const b of bad.slice(0, 40)) console.log(`  WARN ${b.status ?? b.error} ${b.url} (${b.usedBy})`);
  process.exit(0);
}
