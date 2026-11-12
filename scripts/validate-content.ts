// Usage: tsx scripts/validate-content.ts [contentDir]   Exit 1 on any error. Warnings are printed but do not fail.
import path from 'node:path';
import { loadContent } from '../src/lib/content/load';
import { validateContent } from '../src/lib/content/validate';

const dir = path.resolve(process.argv[2] ?? 'content');
const { content, issues } = loadContent(dir);
const all = [...issues, ...validateContent(content)];
const errors = all.filter((i) => i.level === 'error');
const warnings = all.filter((i) => i.level === 'warning');
for (const i of all) console.log(`${i.level.toUpperCase()}  ${i.file}${i.path ? ' :: ' + i.path : ''}  ${i.message}`);
console.log(
  `\nContent validation: ${content.topics.length} topics, ${content.cases.length} cases, ${content.sources.length} sources, ${content.questions.length} questions, ` +
    `${content.cards.length} cards, ${content.resources.length} resources, ${content.lessons.length} lessons, ${content.exercises.length} exercises, ${content.diagrams.length} diagrams`,
);
console.log(`${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length ? 1 : 0);
