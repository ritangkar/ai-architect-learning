// Node-side content loader shared by pages, scripts and tests. Never imported by browser code.
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { z } from 'zod';
import * as S from './schemas';
import type { Content, Issue, Lesson } from './types';

export interface LoadResult { content: Content; issues: Issue[] }

function readJson(file: string, issues: Issue[]): any {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e: any) {
    issues.push({ level: 'error', file, message: `Cannot read/parse JSON: ${e.message}` });
    return undefined;
  }
}
function listFiles(dir: string, ext: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(ext) && !f.startsWith('_')).sort().map((f) => path.join(dir, f));
}
function parseWith<T>(schema: z.ZodType<T>, data: unknown, file: string, issues: Issue[], label?: string): T | undefined {
  const r = schema.safeParse(data);
  if (r.success) return r.data;
  for (const i of r.error.issues) issues.push({ level: 'error', file, path: [label, ...i.path].filter((x) => x !== undefined).join('.'), message: i.message });
  return undefined;
}
function parseArray<T>(schema: z.ZodType<T>, data: unknown, file: string, issues: Issue[]): T[] {
  if (!Array.isArray(data)) {
    issues.push({ level: 'error', file, message: 'Expected a JSON array' });
    return [];
  }
  const out: T[] = [];
  data.forEach((d, i) => {
    const v = parseWith(schema, d, file, issues, `[${i}]${(d as any)?.id ? ` (${(d as any).id})` : ''}`);
    if (v) out.push(v);
  });
  return out;
}
function parseRecord<T>(schema: z.ZodType<T>, data: unknown, file: string, issues: Issue[]): Record<string, T> {
  const out: Record<string, T> = {};
  if (!data || typeof data !== 'object') {
    issues.push({ level: 'error', file, message: 'Expected a JSON object' });
    return out;
  }
  for (const [k, v] of Object.entries(data)) {
    const r = parseWith(schema, v, file, issues, k);
    if (r) out[k] = r;
  }
  return out;
}

export function loadContent(dir: string): LoadResult {
  const issues: Issue[] = [];
  const j = (rel: string) => readJson(path.join(dir, rel), issues);
  const content: Content = {
    site: j('config/site.json') ?? {},
    engine: j('config/engine.json') ?? {},
    gates: j('config/gates.json') ?? { levels: {} },
    pillars: j('curriculum/pillars.json') ?? {},
    modules: parseRecord(S.ModuleSchema, j('curriculum/modules.json'), path.join(dir, 'curriculum/modules.json'), issues) as any,
    competencies: j('curriculum/competencies.json') ?? {},
    patterns: j('curriculum/patterns.json') ?? {},
    levels: parseArray(S.LevelSchema, j('curriculum/levels.json'), path.join(dir, 'curriculum/levels.json'), issues) as any,
    resourceSources: parseRecord(S.ResourceSourceSchema, j('curriculum/resource_sources.json'), path.join(dir, 'curriculum/resource_sources.json'), issues),
    depthModel: j('curriculum/depth_model.json') ?? {},
    topics: parseArray(S.TopicSchema, j('curriculum/topics.json'), path.join(dir, 'curriculum/topics.json'), issues),
    sources: [],
    cases: [],
    catalog: j('cases/_catalog.json') ?? {},
    questions: [],
    cards: [],
    resources: [],
    lessons: [],
    diagrams: [],
    exercises: [],
    sapVerification: j('curriculum/sap_verification.json') ?? {},
  };
  const srcFile = path.join(dir, 'sources/sources.json');
  const srcRaw = j('sources/sources.json');
  content.sources = parseArray(S.SourceSchema, srcRaw?.sources, srcFile, issues);
  for (const f of listFiles(path.join(dir, 'cases'), '.json')) {
    const v = parseWith(S.CaseSchema, readJson(f, issues), f, issues);
    if (v) content.cases.push(v);
  }
  for (const f of listFiles(path.join(dir, 'questions'), '.json')) content.questions.push(...parseArray(S.QuestionSchema, readJson(f, issues), f, issues));
  for (const f of listFiles(path.join(dir, 'cards'), '.json')) content.cards.push(...parseArray(S.CardSchema, readJson(f, issues), f, issues));
  for (const f of listFiles(path.join(dir, 'resources'), '.json')) content.resources.push(...parseArray(S.ResourceSchema, readJson(f, issues), f, issues));
  for (const f of listFiles(path.join(dir, 'exercises'), '.json')) {
    const v = parseWith(S.ExerciseSchema, readJson(f, issues), f, issues);
    if (v) content.exercises.push(v);
  }
  for (const f of listFiles(path.join(dir, 'diagrams'), '.json')) {
    const v = parseWith(S.DiagramSchema, readJson(f, issues), f, issues);
    if (v) content.diagrams.push(v);
  }
  const tdir = path.join(dir, 'topics');
  if (fs.existsSync(tdir)) {
    for (const d of fs.readdirSync(tdir).sort()) {
      const f = path.join(tdir, d, 'lesson.md');
      if (!fs.existsSync(f)) continue;
      try {
        const m = matter(fs.readFileSync(f, 'utf8'), { engines: { js: () => { throw new Error('JS frontmatter disabled'); } } as any });
        const fm = parseWith(S.LessonFrontmatterSchema, { ...m.data, lastReviewed: String(m.data.lastReviewed ?? '') }, f, issues);
        if (fm) {
          const l: Lesson = { topicId: fm.topicId, frontmatter: fm, body: m.content, file: f };
          content.lessons.push(l);
          if (d !== fm.topicId) issues.push({ level: 'error', file: f, path: 'topicId', message: `Folder name ${d} does not match topicId ${fm.topicId}` });
        }
      } catch (e: any) {
        issues.push({ level: 'error', file: f, message: `Cannot parse lesson: ${e.message}` });
      }
    }
  }
  return { content, issues };
}
