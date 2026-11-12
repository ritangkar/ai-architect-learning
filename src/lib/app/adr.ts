import type { Exercise } from '../content/schemas';

/** Markdown ADR from the learner's options analysis (AC-F20-1). Pure function so it can be unit-tested. */
export function adrMarkdown(ex: Pick<Exercise, 'title' | 'options' | 'criteria' | 'scenario'>, w: { decision?: string; chosen?: string; weights?: Record<string, number>; scores?: Record<string, Record<string, number>>; tradeoffs?: string; risks?: string; context?: string }): string {
  const opts = ex.options ?? [];
  const crit = ex.criteria ?? [];
  const weight = (id: string, d: number) => w.weights?.[id] ?? d;
  const total = (oid: string) => crit.reduce((s, c) => s + weight(c.id, c.weight) * (w.scores?.[oid]?.[c.id] ?? 0), 0);
  const chosen = opts.find((o) => o.id === w.chosen);
  const esc = (s: string) => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
  return [
    `# ADR: ${w.decision?.trim() || ex.title}`,
    '',
    '- Status: Proposed',
    '- Source: Architect Lab options-analysis exercise (a learning artefact, not a client decision)',
    '',
    '## Context',
    '',
    (w.context?.trim() || ex.scenario).trim(),
    '',
    '## Decision',
    '',
    chosen ? `We choose **${chosen.name}**.` : '_No option chosen yet._',
    '',
    '## Options considered',
    '',
    ...opts.map((o) => `- **${o.name}** (weighted score ${total(o.id)}): ${o.description}`),
    '',
    '## Criteria and weights',
    '',
    '| Criterion | Weight |',
    '|---|---|',
    ...crit.map((c) => `| ${esc(c.name)} | ${weight(c.id, c.weight)} |`),
    '',
    '## Scores (1 = poor, 5 = excellent)',
    '',
    `| Option | ${crit.map((c) => esc(c.name)).join(' | ')} | Weighted total |`,
    `|---|${crit.map(() => '---').join('|')}|---|`,
    ...opts.map((o) => `| ${esc(o.name)} | ${crit.map((c) => w.scores?.[o.id]?.[c.id] ?? '-').join(' | ')} | ${total(o.id)} |`),
    '',
    '## Trade-offs and consequences',
    '',
    w.tradeoffs?.trim() || '_Not written yet._',
    '',
    '## Risks and open questions',
    '',
    w.risks?.trim() || '_Not written yet._',
    '',
  ].join('\n');
}

