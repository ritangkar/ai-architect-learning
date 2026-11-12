import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { validateContent, findCycle } from '../../src/lib/content/validate';
import { buildGraph } from '../../src/lib/content/graph';
import { loadContent } from '../../src/lib/content/load';
import { REAL } from './helpers';

const clone = () => structuredClone(REAL.content);
const errs = (c = REAL.content) => validateContent(c).filter((i) => i.level === 'error');

describe('real content is valid', () => {
  it('loads without schema issues and passes all relational validators', () => {
    expect(REAL.issues.filter((i) => i.level === 'error')).toEqual([]);
    expect(errs()).toEqual([]);
  });
});

describe('validators catch broken content (in-memory mutations)', () => {
  it('AC-F03-4: prerequisite cycle', () => {
    const c = clone();
    const t = c.topics.find((x) => x.id === 'T1.1.1')!;
    t.pre = ['T1.1.5'];
    const e = errs(c);
    expect(e.some((i) => /cycle/i.test(i.message))).toBe(true);
    expect(findCycle([{ id: 'a', pre: ['b'] }, { id: 'b', pre: ['a'] }])).toEqual(['a', 'b', 'a']);
    expect(findCycle([{ id: 'a', pre: [] }, { id: 'b', pre: ['a'] }])).toBeNull();
  });
  it('AC-F03-4: dangling prerequisite', () => {
    const c = clone();
    c.topics[5].pre.push('T9.9.9');
    expect(errs(c).some((i) => /Dangling prerequisite T9\.9\.9/.test(i.message))).toBe(true);
  });
  it('AC-F06-3: case without sources', () => {
    const c = clone();
    c.cases[0].sources = [];
    expect(errs(c).some((i) => /no sources/.test(i.message))).toBe(true);
  });
  it('AC-F06-3: case citing a source not in the register', () => {
    const c = clone();
    c.cases[0].sources = ['SRC-999'];
    expect(errs(c).some((i) => /SRC-999 is not in the source register/.test(i.message))).toBe(true);
  });
  it('AC-F06-3: V fact citing a source not in the case source list', () => {
    const c = clone();
    c.cases[0].facts[0] = [c.cases[0].facts[0][0], 'SRC-001'];
    expect(errs(c).some((i) => /not in the case's source list/.test(i.message))).toBe(true);
  });
  it('AC-F06-3: Tier A case with fewer than 3 decisions', () => {
    const c = clone();
    const a = c.cases.find((x) => x.tier === 'A')!;
    a.decisions = a.decisions.slice(0, 2);
    expect(errs(c).some((i) => /Tier A case has 2 documented decisions/.test(i.message))).toBe(true);
  });
  it('AC-F08-4: question without topic or competency; unknown ids; competency not developed by its topic', () => {
    const c = clone();
    const base = { id: 'Q-X', type: 'mcq' as const, difficulty: 2, stem: 's', explanation: 'e', status: 'draft' as const, options: [{ id: 'a', text: 'a' }, { id: 'b', text: 'b' }], correct: 'a' };
    c.questions = [{ ...base, topics: [], competencies: ['C02'] } as any, { ...base, id: 'Q-Y', topics: ['T1.1.1'], competencies: [] } as any, { ...base, id: 'Q-Z', topics: ['T9.9.9'], competencies: ['C99'] } as any, { ...base, id: 'Q-W', topics: ['T1.1.1'], competencies: ['C09'] } as any];
    const msgs = errs(c).map((i) => i.message).join('\n');
    expect(msgs).toMatch(/no topic/);
    expect(msgs).toMatch(/no competency/);
    expect(msgs).toMatch(/Unknown topic T9\.9\.9/);
    expect(msgs).toMatch(/Unknown competency C99/);
    expect(msgs).toMatch(/Competency C09 is not developed/);
  });
  it('duplicate ids are errors', () => {
    const c = clone();
    c.topics.push({ ...c.topics[0] });
    expect(errs(c).some((i) => /Duplicate topic id/.test(i.message))).toBe(true);
  });
  it('topic with no competency, and verified_case_ids drift', () => {
    const c = clone();
    c.topics[0].comps = [];
    c.topics[1].verified_case_ids = ['CS-001'];
    const m = errs(c).map((i) => i.message).join('\n');
    expect(m).toMatch(/no competency/);
    expect(m).toMatch(/verified_case_ids/);
  });
  it('SAP topic without a status/last-verified entry', () => {
    const c = clone();
    delete c.sapVerification['T2.1.1'];
    expect(errs(c).some((i) => /SAP topic without status/.test(i.message))).toBe(true);
  });
  it('lessons with absolute "/" links are rejected (base path rule)', () => {
    const c = clone();
    c.lessons.push({ topicId: 'T1.1.1', file: 'x/lesson.md', frontmatter: { topicId: 'T1.1.1', lastReviewed: '2026-11-12' }, body: '@@ summary\nSee [here](/topic/T1.1.2/).' });
    expect(errs(c).some((i) => /absolute "\/" link/.test(i.message))).toBe(true);
  });
  it('engine config weights must sum to 1', () => {
    const c = clone();
    c.engine.recommender.weights.gapSeverity = 0.9;
    expect(errs(c).some((i) => /recommender.weights/.test(i.message))).toBe(true);
  });
});

describe('validate-content CLI against deliberately broken on-disk fixtures', () => {
  const run = (mutate: (dir: string) => void) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'al-fixture-'));
    fs.cpSync('content', dir, { recursive: true });
    mutate(dir);
    const r = spawnSync('npx', ['tsx', 'scripts/validate-content.ts', dir], { encoding: 'utf8' });
    fs.rmSync(dir, { recursive: true, force: true });
    return { code: r.status, out: r.stdout + r.stderr };
  };
  const edit = (dir: string, rel: string, f: (j: any) => void) => {
    const p = path.join(dir, rel);
    const j = JSON.parse(fs.readFileSync(p, 'utf8'));
    f(j);
    fs.writeFileSync(p, JSON.stringify(j));
  };
  it('passes on the real content', () => expect(run(() => {}).code).toBe(0));
  it('fails on a cycle, naming file and field', () => {
    const r = run((d) => edit(d, 'curriculum/topics.json', (t) => { t[0].pre = ['T1.1.2']; }));
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/cycle/i);
    expect(r.out).toMatch(/curriculum\/topics\.json/);
  });
  it('fails on a dangling id', () => {
    const r = run((d) => edit(d, 'curriculum/topics.json', (t) => { t[3].pre.push('T7.7.7'); }));
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/Dangling prerequisite T7\.7\.7/);
  });
  it('fails on a missing source', () => {
    const r = run((d) => edit(d, 'cases/CS-001.json', (c) => { c.sources = []; }));
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/CS-001|sources/);
  });
  it('fails on a V fact with an unlisted source', () => {
    const r = run((d) => edit(d, 'cases/CS-002.json', (c) => { c.facts[0][1] = 'SRC-004'; }));
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/not in the case's source list/);
  });
  it('fails on a Tier A case with fewer than 3 decisions', () => {
    const r = run((d) => edit(d, 'cases/CS-003.json', (c) => { c.decisions = c.decisions.slice(0, 1); }));
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/Tier A case has 1 documented decisions/);
  });
  it('fails on malformed JSON', () => {
    const r = run((d) => fs.writeFileSync(path.join(d, 'cases/CS-004.json'), '{ nope'));
    expect(r.code).toBe(1);
    expect(r.out).toMatch(/Cannot read\/parse JSON/);
  });
}, 120000);

describe('knowledge graph (AC-F14-3)', () => {
  it('is generated from validated content with all node kinds and typed edges', () => {
    const g = buildGraph(REAL.content);
    expect(g.stats.topic).toBe(REAL.content.topics.length);
    expect(g.stats.case).toBe(REAL.content.cases.length);
    expect(g.stats.pattern).toBe(Object.keys(REAL.content.patterns).length);
    const ids = new Set(g.nodes.map((n) => n.id));
    for (const e of g.edges) { expect(ids.has(e.from)).toBe(true); expect(ids.has(e.to)).toBe(true); }
    expect(new Set(g.edges.map((e) => e.type))).toEqual(new Set(['part-of', 'requires', 'develops', 'involves', 'demonstrates', 'cites', 'assesses', 'belongs', 'supports'].filter((t) => g.edges.some((e) => e.type === t))));
  });
  it('loadContent is deterministic', () => {
    expect(loadContent('content').content.topics.map((t) => t.id)).toEqual(REAL.content.topics.map((t) => t.id));
  });
});
