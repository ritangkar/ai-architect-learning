// Build-time diagram renderer: validated node/edge JSON -> static accessible SVG. No runtime JS, no external library (ADR-0005).
import type { Diagram } from '../content/schemas';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function wrap(label: string, max = 20): string[] {
  const words = label.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max && cur) { lines.push(cur); cur = w; } else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur);
  return lines;
}

export function renderDiagram(d: Diagram, opts: { illustrativeLabel?: string } = {}): string {
  const dir = d.direction ?? 'LR';
  // longest-path layering (cycles tolerated by capping iterations)
  const layer = new Map(d.nodes.map((n) => [n.id, 0]));
  for (let i = 0; i < d.nodes.length; i++) for (const e of d.edges) if (layer.get(e.to)! <= layer.get(e.from)! && layer.get(e.from)! < d.nodes.length) layer.set(e.to, layer.get(e.from)! + 1);
  const cols = new Map<number, string[]>();
  for (const n of d.nodes) (cols.get(layer.get(n.id)!) ?? cols.set(layer.get(n.id)!, []).get(layer.get(n.id)!)!).push(n.id);
  const W = 168, H = 56, GX = 64, GY = 28, PAD = 16;
  const maxLayer = Math.max(...cols.keys());
  const maxRows = Math.max(...[...cols.values()].map((v) => v.length));
  const pos = new Map<string, { x: number; y: number }>();
  for (const [l, ids] of cols) {
    const off = ((maxRows - ids.length) * (dir === 'LR' ? H + GY : W + GX)) / 2;
    ids.forEach((id, i) => {
      pos.set(id, dir === 'LR' ? { x: PAD + l * (W + GX), y: PAD + off + i * (H + GY) } : { x: PAD + off + i * (W + GX), y: PAD + l * (H + GY * 2) });
    });
  }
  const width = dir === 'LR' ? PAD * 2 + (maxLayer + 1) * W + maxLayer * GX : PAD * 2 + maxRows * W + (maxRows - 1) * GX;
  const height = dir === 'LR' ? PAD * 2 + maxRows * H + (maxRows - 1) * GY : PAD * 2 + (maxLayer + 1) * H + maxLayer * GY * 2;
  const labelOf = new Map(d.nodes.map((n) => [n.id, n.label]));
  const uid = 'dg-' + d.id.replace(/[^a-z0-9]/gi, '');
  const edges = d.edges
    .map((e) => {
      const a = pos.get(e.from)!, b = pos.get(e.to)!;
      const [x1, y1, x2, y2] = dir === 'LR' ? [a.x + W, a.y + H / 2, b.x, b.y + H / 2] : [a.x + W / 2, a.y + H, b.x + W / 2, b.y];
      const back = dir === 'LR' ? x2 <= x1 : y2 <= y1;
      const path = back
        ? (dir === 'LR' ? `M${x1},${y1} C${x1 + 40},${y1 - 50} ${x2 - 40},${y2 - 50} ${x2},${y2}` : `M${x1},${y1} C${x1 + 60},${y1 + 40} ${x2 + 60},${y2 - 40} ${x2},${y2}`)
        : dir === 'LR' ? `M${x1},${y1} C${(x1 + x2) / 2},${y1} ${(x1 + x2) / 2},${y2} ${x2},${y2}` : `M${x1},${y1} C${x1},${(y1 + y2) / 2} ${x2},${(y1 + y2) / 2} ${x2},${y2}`;
      const label = e.label ? `<text class="edge-label" x="${(x1 + x2) / 2}" y="${(y1 + y2) / 2 - 6}" text-anchor="middle">${esc(e.label)}</text>` : '';
      return `<path class="edge" d="${path}" marker-end="url(#${uid}-arrow)"/>${label}`;
    })
    .join('');
  const nodes = d.nodes
    .map((n) => {
      const p = pos.get(n.id)!;
      const lines = wrap(n.label);
      const y0 = p.y + H / 2 - ((lines.length - 1) * 8) - 0;
      return `<g class="node"><rect x="${p.x}" y="${p.y}" width="${W}" height="${H}" rx="6"/>${lines.map((ln, i) => `<text x="${p.x + W / 2}" y="${y0 + i * 16 + 4}" text-anchor="middle">${esc(ln)}</text>`).join('')}</g>`;
    })
    .join('');
  const alt = `<ul>${d.nodes.map((n) => `<li>${esc(n.label)}</li>`).join('')}</ul><p>Connections:</p><ul>${d.edges.map((e) => `<li>${esc(labelOf.get(e.from)!)} → ${esc(labelOf.get(e.to)!)}${e.label ? ` (${esc(e.label)})` : ''}</li>`).join('')}</ul>`;
  const label = d.reconstructed ? '<span class="prov R" title="Reconstructed by the authors from text; not a copy of any source diagram">R · Reconstructed</span>' : `<span class="badge neutral">${esc(opts.illustrativeLabel ?? 'Illustrative diagram, authored for this lesson')}</span>`;
  return `<figure class="diagram" data-diagram="${esc(d.id)}">` +
    `<div class="diagram-scroll" tabindex="0" role="group" aria-label="${esc(d.title)} (scrolls sideways on small screens)">` +
    `<svg viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-labelledby="${uid}-t ${uid}-d"><title id="${uid}-t">${esc(d.title)}</title><desc id="${uid}-d">${esc(d.description)}</desc>` +
    `<defs><marker id="${uid}-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>${edges}${nodes}</svg></div>` +
    `<figcaption><strong>${esc(d.title)}.</strong> ${esc(d.description)} ${label}<details class="acc" style="margin-top:8px"><summary>Text alternative</summary><div>${alt}</div></details></figcaption></figure>`;
}
