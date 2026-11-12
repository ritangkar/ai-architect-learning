// Secret scan (NFR-04). Usage: tsx scripts/scan-secrets.ts [--staged] [--history]
// Scans tracked + untracked (non-ignored) files, optionally staged content or the entire git history. Exits 1 on any finding.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const PATTERNS: [string, RegExp][] = [
  ['AWS access key id', /\b(AKIA|ASIA)[0-9A-Z]{16}\b/],
  ['Anthropic API key', /\bsk-ant-[A-Za-z0-9_-]{20,}/],
  ['OpenAI-style API key', /\bsk-(proj-)?[A-Za-z0-9_-]{32,}/],
  ['GitHub token', /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{40,}/],
  ['Slack token', /\bxox[baprs]-[A-Za-z0-9-]{10,}/],
  ['Google API key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['Private key block', /-----BEGIN (RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY( BLOCK)?-----/],
  ['JWT', /\beyJ[A-Za-z0-9_-]{15,}\.eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{10,}/],
  ['Generic credential assignment', /\b(api[_-]?key|secret|passwd|password|auth[_-]?token|access[_-]?token)\b\s*[:=]\s*["'][A-Za-z0-9/+_\-=.]{16,}["']/i],
];
const SKIP = /(^|\/)(node_modules|dist|\.astro|reports|test-results|playwright-report)\//;
const SKIP_FILE = /(package-lock\.json|\.woff2|\.png|\.ico|scan-secrets\.ts)$/;
const sh = (args: string[], max = 512) => execFileSync('git', args, { encoding: 'utf8', maxBuffer: max * 1024 * 1024 });

type Hit = { where: string; rule: string; sample: string };
const hits: Hit[] = [];
function scanText(where: string, text: string) {
  text.split('\n').forEach((line, i) => {
    if (line.length > 4000) return;
    for (const [rule, re] of PATTERNS) if (re.test(line) && !/example|placeholder|your[_-]?key|xxxx/i.test(line)) hits.push({ where: `${where}:${i + 1}`, rule, sample: line.trim().slice(0, 60) + '…' });
  });
}
if (process.argv.includes('--staged')) {
  for (const f of sh(['diff', '--cached', '--name-only', '--diff-filter=ACM']).split('\n').filter(Boolean)) {
    if (SKIP.test(f) || SKIP_FILE.test(f)) continue;
    scanText(f, sh(['show', `:${f}`]));
  }
} else if (process.argv.includes('--history')) {
  scanText('git-history', sh(['log', '--all', '-p', '--no-color', '--no-ext-diff', '--', '.', ':(exclude)package-lock.json', ':(exclude)*.woff2'], 1024));
} else {
  const files = sh(['ls-files', '--cached', '--others', '--exclude-standard']).split('\n').filter(Boolean);
  for (const f of files) {
    if (SKIP.test(f) || SKIP_FILE.test(f) || !fs.existsSync(f)) continue;
    try { scanText(f, fs.readFileSync(f, 'utf8')); } catch { /* binary */ }
  }
}
if (hits.length) {
  console.error(`Secret scan FAILED: ${hits.length} possible secret(s)`);
  for (const h of hits.slice(0, 30)) console.error(`  ${h.where}  [${h.rule}]  ${h.sample}`);
  process.exit(1);
}
console.log(`Secret scan passed (${process.argv.includes('--history') ? 'git history' : process.argv.includes('--staged') ? 'staged files' : 'working tree'}).`);
