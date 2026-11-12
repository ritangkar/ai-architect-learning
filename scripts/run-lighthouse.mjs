// Lighthouse CI against the built site served under the real base path. Budgets: performance >= 0.9, accessibility >= 0.95 (NFR-01).
// Usage: node scripts/run-lighthouse.mjs   (CHROME_PATH may point to a Chromium binary)
import fs from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { resolveSite } from './site-config.mjs';

const { base } = resolveSite();
const port = 4399;
const root = `http://localhost:${port}${base === '/' ? '' : base}/`;
const routes = (process.env.LH_ROUTES ?? ',curriculum/,topic/T1.2.1/,case/CS-001/,cases/,sources/,pathway/,settings/').split(',');
const config = {
  ci: {
    collect: { url: routes.map((r) => root + r), numberOfRuns: 1, settings: { preset: 'desktop', chromeFlags: '--no-sandbox --headless=new', formFactor: 'mobile', screenEmulation: { mobile: true, width: 360, height: 740, deviceScaleFactor: 2, disabled: false }, throttlingMethod: 'simulate', throttling: { rttMs: 150, throughputKbps: 1638, cpuSlowdownMultiplier: 4 } } },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'resource-summary:script:size': ['warn', { maxNumericValue: 120000 }],
        'total-byte-weight': ['warn', { maxNumericValue: 500000 }],
      },
    },
    upload: { target: 'filesystem', outputDir: 'reports/lighthouse' },
  },
};
fs.mkdirSync('reports', { recursive: true });
fs.writeFileSync('reports/lighthouserc.generated.json', JSON.stringify(config, null, 1));
const server = spawn('node', ['scripts/serve-dist.mjs'], { env: { ...process.env, PORT: String(port) }, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1200));
const r = spawnSync('npx', ['lhci', 'autorun', '--config=reports/lighthouserc.generated.json'], { stdio: 'inherit', env: process.env });
server.kill();
process.exit(r.status ?? 1);
