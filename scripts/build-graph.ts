// Builds the knowledge graph from validated content and writes a summary report (the site serves the full graph at /data/graph.json).
import fs from 'node:fs';
import path from 'node:path';
import { loadContent } from '../src/lib/content/load';
import { validateContent } from '../src/lib/content/validate';
import { buildGraph } from '../src/lib/content/graph';

const { content, issues } = loadContent(path.resolve('content'));
const errors = [...issues, ...validateContent(content)].filter((i) => i.level === 'error');
if (errors.length) {
  console.error('Refusing to build graph from invalid content.');
  process.exit(1);
}
const g = buildGraph(content);
fs.mkdirSync('reports', { recursive: true });
fs.writeFileSync('reports/graph-summary.json', JSON.stringify({ stats: g.stats }, null, 1));
console.log('Graph:', JSON.stringify(g.stats));
