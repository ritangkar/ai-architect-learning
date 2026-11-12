// Lesson Markdown -> sanitised HTML. Authored content is still sanitised (defence in depth, NFR-04).
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import rehypeStringify from 'rehype-stringify';
import type { Diagram } from '../content/schemas';
import { renderDiagram } from './diagram';
import { caseUrl, patternUrl, sourceUrl, topicUrl } from '../url';

const schema: any = {
  ...defaultSchema,
  protocols: { ...defaultSchema.protocols, href: ['http', 'https', 'mailto', 'topic', 'case', 'pattern', 'source'] },
  attributes: { ...defaultSchema.attributes, code: [...(defaultSchema.attributes?.code ?? []), ['className', /^language-./]] },
};

function rewrite() {
  return (tree: any) => {
    const walk = (n: any) => {
      if (n.type === 'element' && n.tagName === 'a' && typeof n.properties?.href === 'string') {
        const h: string = n.properties.href;
        const m = /^(topic|case|pattern|source):(.+)$/.exec(h);
        if (m) n.properties.href = { topic: topicUrl, case: caseUrl, pattern: patternUrl, source: sourceUrl }[m[1] as 'topic'](m[2]);
        else if (/^https?:/.test(h)) { n.properties.rel = 'noopener noreferrer'; n.properties.target = '_blank'; n.properties.className = ['ext']; }
      }
      n.children?.forEach(walk);
    };
    walk(tree);
  };
}
function diagrams(map: Map<string, Diagram>, used: Set<string>) {
  return (tree: any) => {
    const walk = (n: any) => {
      if (!n.children) return;
      n.children = n.children.map((ch: any) => {
        if (ch.type === 'element' && ch.tagName === 'p' && ch.children?.length === 1 && ch.children[0].type === 'text') {
          const m = /^\{\{diagram:([a-z0-9-]+)\}\}$/.exec(ch.children[0].value.trim());
          if (m) {
            const d = map.get(m[1]);
            used.add(m[1]);
            return { type: 'raw', value: d ? renderDiagram(d) : `<p class="callout warn">Missing diagram ${m[1]}</p>` };
          }
        }
        walk(ch);
        return ch;
      });
    };
    walk(tree);
  };
}

export async function renderMarkdown(md: string, diagramMap: Map<string, Diagram> = new Map()): Promise<string> {
  const used = new Set<string>();
  const out = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSanitize, schema)
    .use(rewrite)
    .use(diagrams, diagramMap, used)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(md);
  return String(out);
}

export const LESSON_BLOCKS = ['summary', 'keyterms', 'why', 'lesson', 'example', 'deep'] as const;
export type LessonBlock = (typeof LESSON_BLOCKS)[number];
/** Which blocks each depth shows (content/CONTENT_GUIDE.md). Compress = summary + key terms; Standard adds the lesson and worked example; Deep adds extended material. */
export const DEPTH_BLOCKS: Record<'compress' | 'standard' | 'deep', LessonBlock[]> = {
  compress: ['summary', 'keyterms'],
  standard: ['summary', 'why', 'keyterms', 'lesson', 'example'],
  deep: ['summary', 'why', 'keyterms', 'lesson', 'example', 'deep'],
};
export function splitLesson(body: string): Partial<Record<LessonBlock, string>> {
  const out: Partial<Record<LessonBlock, string>> = {};
  let cur: LessonBlock | null = null;
  for (const line of body.split('\n')) {
    const m = /^@@ (\w+)\s*$/.exec(line);
    if (m) { cur = (LESSON_BLOCKS as readonly string[]).includes(m[1]) ? (m[1] as LessonBlock) : null; if (cur) out[cur] = ''; continue; }
    if (cur) out[cur] += line + '\n';
  }
  return out;
}
