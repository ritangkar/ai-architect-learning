// Build-time (Node) accessor used by Astro pages and endpoints. Throws if content is invalid so the build fails loudly.
import path from 'node:path';
import { loadContent } from './load';
import { validateContent } from './validate';
import type { Content } from './types';

let cached: Content | null = null;
export function getContent(): Content {
  if (cached) return cached;
  const { content, issues } = loadContent(path.resolve(process.cwd(), 'content'));
  const errors = [...issues, ...validateContent(content)].filter((i) => i.level === 'error');
  if (errors.length) throw new Error('Content is invalid:\n' + errors.map((e) => `${e.file} ${e.path ?? ''} ${e.message}`).join('\n'));
  cached = content;
  return content;
}
export const moduleOrder = (c: Content) => Object.keys(c.modules);
export function lessonFor(c: Content, topicId: string) {
  return c.lessons.find((l) => l.topicId === topicId) ?? null;
}
