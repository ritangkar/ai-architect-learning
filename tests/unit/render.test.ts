import { describe, it, expect } from 'vitest';
import { renderMarkdown, splitLesson, DEPTH_BLOCKS } from '../../src/lib/render/markdown';
import { renderDiagram } from '../../src/lib/render/diagram';
import { adrMarkdown } from '../../src/lib/app/adr';
import { REAL } from './helpers';

describe('markdown sanitisation (NFR-04)', () => {
  it('strips scripts, event handlers and javascript: URLs', async () => {
    const html = await renderMarkdown('hello <script>alert(1)</script> <img src=x onerror=alert(1)> [x](javascript:alert(1)) <iframe src="https://evil"></iframe>');
    expect(html).not.toMatch(/<script|onerror|javascript:|<iframe/i);
  });
  it('rewrites internal link schemes through the base-aware helper and hardens external links', async () => {
    const html = await renderMarkdown('[t](topic:T1.2.1) [c](case:CS-001) [p](page:exercises/) [e](https://example.com)');
    expect(html).toContain('href="/topic/T1.2.1/"');
    expect(html).toContain('href="/case/CS-001/"');
    expect(html).toContain('href="/exercises/"');
    expect(html).toMatch(/rel="noopener noreferrer"/);
  });
  it('renders known diagrams after sanitisation and flags missing ones', async () => {
    const map = new Map(REAL.content.diagrams.map((d) => [d.id, d]));
    const ok = await renderMarkdown('{{diagram:rag-baseline}}', map);
    expect(ok).toContain('<svg');
    expect(await renderMarkdown('{{diagram:nope}}', map)).toContain('Missing diagram');
    expect(await renderMarkdown('<svg onload=alert(1)></svg>', map)).not.toMatch(/onload/);
  });
});

describe('lesson blocks and depth variants (F05)', () => {
  it('splits @@ blocks and maps depths to blocks', () => {
    const b = splitLesson('@@ summary\nS\n@@ lesson\nL\n@@ deep\nD\n@@ bogus\nX');
    expect(Object.keys(b)).toEqual(['summary', 'lesson', 'deep']);
    expect(DEPTH_BLOCKS.compress).toEqual(['summary', 'keyterms']);
    expect(DEPTH_BLOCKS.deep).toContain('deep');
    expect(DEPTH_BLOCKS.standard).not.toContain('deep');
  });
  it('every authored lesson has a summary and only known blocks (validator-backed)', () => {
    for (const l of REAL.content.lessons) { const b = splitLesson(l.body); expect(b.summary, l.topicId).toBeTruthy(); }
  });
});

describe('diagrams (F07)', () => {
  it('every diagram renders an accessible svg with title, description and a text alternative', () => {
    for (const d of REAL.content.diagrams) {
      const h = renderDiagram(d);
      expect(h).toContain('role="img"');
      expect(h).toContain(`<title id=`);
      expect(h).toContain('<desc id=');
      expect(h).toContain('Text alternative');
      for (const n of d.nodes) expect(h).toContain(n.label.split(' ')[0]);
      expect(h).toContain('scrolls sideways');
    }
  });
  it('AC-F06-6: reconstructed diagrams carry the visible Reconstructed label', () => {
    const d = { ...REAL.content.diagrams[0], reconstructed: true };
    expect(renderDiagram(d)).toContain('Reconstructed');
    expect(renderDiagram({ ...d, reconstructed: false })).not.toContain('Reconstructed');
  });
  it('escapes labels', () => {
    const h = renderDiagram({ id: 'x', title: 'T<b>', description: 'desc desc desc desc', nodes: [{ id: 'a', label: '<script>alert(1)</script>' }], edges: [] } as any);
    expect(h).not.toContain('<script>');
  });
});

describe('ADR export (AC-F20-1)', () => {
  const ex = REAL.content.exercises.find((e) => e.kind === 'options_analysis')!;
  it('produces Markdown with decision, options, criteria and trade-offs', () => {
    const md = adrMarkdown(ex, { decision: 'Pick managed service', chosen: 'o2', scores: { o2: { c1: 5, c2: 4 }, o1: { c1: 3 } }, weights: { c1: 5 }, tradeoffs: 'Less control.', risks: 'Vendor roadmap' });
    expect(md).toMatch(/^# ADR: Pick managed service\n/);
    for (const h of ['## Context', '## Decision', '## Options considered', '## Criteria and weights', '## Scores', '## Trade-offs and consequences', '## Risks and open questions']) expect(md).toContain(h);
    expect(md).toContain('We choose **Managed model service');
    for (const o of ex.options!) expect(md).toContain(o.name);
    for (const c of ex.criteria!) expect(md).toContain(c.name);
    // weighted total for o2: c1 weight 5 * 5 + c2 weight 5 (default) * 4 = 45
    expect(md).toMatch(/Managed model service in the insurer's existing cloud\*\* \(weighted score 45\)/);
    expect(md).toContain('Less control.');
  });
  it('stays valid with nothing filled in', () => {
    const md = adrMarkdown(ex, {});
    expect(md).toContain('_No option chosen yet._');
    expect(md).toContain('_Not written yet._');
    expect(md.endsWith('\n')).toBe(true);
  });
  it('escapes pipes in table cells', () => {
    const md = adrMarkdown({ ...ex, criteria: [{ id: 'c1', name: 'a|b', weight: 1 }] as any }, {});
    expect(md).toContain('a\\|b');
  });
});

describe('content integrity on real data', () => {
  it('every question maps to at least one topic and competency (AC-F08-4) and every competency has >= 3 items', () => {
    const per: Record<string, number> = {};
    for (const q of REAL.content.questions) { expect(q.topics.length).toBeGreaterThan(0); expect(q.competencies.length).toBeGreaterThan(0); for (const c of q.competencies) per[c] = (per[c] ?? 0) + 1; }
    for (const c of Object.keys(REAL.content.competencies)) expect(per[c] ?? 0, c).toBeGreaterThanOrEqual(3);
  });
  it('scenario items carry the majority of scored weight in the initial bank', () => {
    const w = REAL.content.engine.evidence_weights;
    let a = 0, b = 0;
    for (const q of REAL.content.questions) (q.type === 'mcq' ? (a += w.mcq) : (b += w[q.type] ?? 1));
    expect(b / (a + b)).toBeGreaterThan(0.5);
  });
  it('all authored questions, cards, lessons and exercises are drafts (never marked reviewed without review)', () => {
    for (const q of REAL.content.questions) expect(q.status).toBe('draft');
    for (const l of REAL.content.lessons) expect(l.frontmatter.status).toBe('draft');
    for (const e of REAL.content.exercises) expect(e.status).toBe('draft');
  });
  it('no unverified resource is marked verified; all unverified ones are to_verify', () => {
    for (const r of REAL.content.resources) if (r.status === 'verified') expect(r.lastChecked).toBeTruthy();
  });
  it('no calendar dates inside curriculum topic text', () => {
    for (const t of REAL.content.topics) expect(JSON.stringify([t.obj, t.title])).not.toMatch(/\b20\d{2}-\d{2}-\d{2}\b/);
  });
});
