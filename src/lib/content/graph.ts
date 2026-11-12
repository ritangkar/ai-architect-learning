// Build-time knowledge graph (AC-F14-3). Generated only from validated content.
import type { Content } from './types';

export type NodeKind = 'pillar' | 'module' | 'topic' | 'competency' | 'pattern' | 'case' | 'question' | 'card' | 'resource' | 'source';
export interface GNode { id: string; kind: NodeKind; label: string; attrs?: Record<string, unknown> }
export interface GEdge { type: string; from: string; to: string }
export interface Graph { nodes: GNode[]; edges: GEdge[]; stats: Record<string, number> }

export function buildGraph(c: Content): Graph {
  const nodes: GNode[] = [];
  const edges: GEdge[] = [];
  for (const [id, label] of Object.entries(c.pillars)) nodes.push({ id, kind: 'pillar', label });
  for (const [id, m] of Object.entries(c.modules)) {
    nodes.push({ id, kind: 'module', label: m.title, attrs: { pillar: m.pillar } });
    edges.push({ type: 'part-of', from: id, to: m.pillar });
  }
  for (const [id, label] of Object.entries(c.competencies)) nodes.push({ id, kind: 'competency', label });
  for (const [id, label] of Object.entries(c.patterns)) nodes.push({ id, kind: 'pattern', label });
  for (const t of c.topics) {
    nodes.push({ id: t.id, kind: 'topic', label: t.title, attrs: { module: t.module, pillar: t.pillar } });
    edges.push({ type: 'part-of', from: t.id, to: t.module });
    for (const p of t.pre) edges.push({ type: 'requires', from: t.id, to: p });
    for (const k of t.comps) edges.push({ type: 'develops', from: t.id, to: k });
    for (const p of t.pat ?? []) edges.push({ type: 'involves', from: t.id, to: p });
  }
  for (const s of c.sources) nodes.push({ id: s.id, kind: 'source', label: s.title, attrs: { grade: s.grade, verify: !!s.verify } });
  for (const k of c.cases) {
    nodes.push({ id: k.id, kind: 'case', label: `${k.company}: ${k.title}`, attrs: { tier: k.tier, industry: k.industry } });
    for (const t of k.prereq_topics) edges.push({ type: 'requires', from: k.id, to: t });
    for (const p of k.patterns) edges.push({ type: 'demonstrates', from: k.id, to: p });
    for (const s of k.sources) edges.push({ type: 'cites', from: k.id, to: s });
  }
  for (const q of c.questions) {
    nodes.push({ id: q.id, kind: 'question', label: q.stem.slice(0, 80), attrs: { type: q.type } });
    for (const t of q.topics) edges.push({ type: 'assesses', from: q.id, to: t });
    for (const k of q.competencies) edges.push({ type: 'assesses', from: q.id, to: k });
  }
  for (const k of c.cards) {
    nodes.push({ id: k.id, kind: 'card', label: k.front.slice(0, 80) });
    edges.push({ type: 'belongs', from: k.id, to: k.topicId });
  }
  for (const r of c.resources) {
    nodes.push({ id: r.id, kind: 'resource', label: r.title, attrs: { status: r.status } });
    for (const t of r.topics) edges.push({ type: 'supports', from: r.id, to: t });
  }
  const stats: Record<string, number> = {};
  for (const n of nodes) stats[n.kind] = (stats[n.kind] ?? 0) + 1;
  stats.edges = edges.length;
  return { nodes, edges, stats };
}
