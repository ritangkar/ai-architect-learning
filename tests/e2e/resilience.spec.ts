import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import { answerCurrent, nextQuestion, startAssessmentAndComplete, noHorizontalScroll, collectProblems } from './helpers';
import { BASE_URL } from '../../playwright.config';

async function activity(page: Page, topic = 'T1.1.2', n = 3) {
  await page.goto(`topic/${topic}/`);
  await page.getByRole('button', { name: 'Mark lesson as read' }).click();
  await page.getByRole('button', { name: 'Start check questions' }).click();
  for (let i = 0; i < n; i++) { await answerCurrent(page, 'correct', 4); await page.getByRole('button', { name: /Next question|Finish/ }).first().click(); }
}
async function exportFile(page: Page): Promise<string> {
  await page.goto('settings/');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export progress (JSON)' }).click()]);
  expect(dl.suggestedFilename()).toMatch(/^architect-lab-progress-\d{4}-\d{2}-\d{2}\.json$/);
  return (await dl.path())!;
}
const stored = async (page: Page) => (await page.locator('dl.kv').textContent())!;
const attemptCount = async (page: Page) => Number((await page.locator('dl.kv dt:text("attempts") + dd').textContent())!.trim());

test.describe('persistence and storage failure', () => {
  test('AC-F16-1: reload preserves state', async ({ page }) => {
    await activity(page);
    await page.goto('topic/T1.1.2/');
    const before = await page.getByText(/Evidence score/).textContent();
    expect(before).toMatch(/from 3 answers/);
    await page.reload();
    await expect(page.getByText(/Evidence score/)).toHaveText(before!);
    await page.goto('settings/');
    expect(await attemptCount(page)).toBe(3);
  });

  test('AC-F16-2: IndexedDB missing -> session-only banner, no crash, export still works', async ({ page }) => {
    await page.addInitScript(() => { Object.defineProperty(window, 'indexedDB', { value: undefined, configurable: true }); });
    const problems = collectProblems(page);
    await page.goto('./');
    await expect(page.locator('#session-only-banner')).toBeVisible();
    await expect(page.locator('#session-only-banner')).toContainText('Session-only mode');
    await expect(page.getByRole('heading', { name: 'Start with the initial assessment' })).toBeVisible();
    await page.goto('topic/T1.1.2/');
    await expect(page.locator('#session-only-banner')).toBeVisible();
    await page.getByRole('button', { name: 'Start check questions' }).click();
    await answerCurrent(page, 'correct', 4);
    await expect(page.getByText(/Score for this item/)).toBeVisible();
    const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('#session-only-banner').getByRole('button', { name: 'Export your data now' }).click()]);
    const j = JSON.parse(fs.readFileSync((await dl.path())!, 'utf8'));
    expect(j.schema).toBe('architect-lab-progress');
    expect(problems.filter((p) => !/IndexedDB|indexedDB/.test(p))).toEqual([]);
  });

  test('IndexedDB open error (blocked/denied) also degrades gracefully', async ({ page }) => {
    await page.addInitScript(() => { const open = () => { throw new DOMException('denied', 'SecurityError'); }; Object.defineProperty(window, 'indexedDB', { value: { open }, configurable: true }); });
    await page.goto('settings/');
    await expect(page.locator('#session-only-banner')).toBeVisible();
    await expect(page.getByText(/Session-only mode\./).first()).toBeVisible();
  });
});

test.describe('backup and restore (UJ-09)', () => {
  test('AC-F17-1: export, wipe, import reproduces identical derived state', async ({ page }) => {
    await activity(page);
    await page.goto('topic/T1.1.2/');
    const stateBefore = await page.getByText(/Evidence score/).textContent();
    const file = await exportFile(page);
    const exported = JSON.parse(fs.readFileSync(file, 'utf8'));
    expect(exported.data.attempts.length).toBe(3);
    expect(exported.checksum).toMatch(/^sha256:[0-9a-f]{64}$/);
    // wipe
    await page.getByLabel('Confirmation').fill('RESET');
    await page.getByRole('button', { name: 'Erase all data' }).click();
    await page.waitForFunction(() => document.querySelector('dl.kv')?.textContent?.includes('attempts0'));
    expect(await attemptCount(page)).toBe(0);
    // import (replace)
    await page.getByLabel('Import a backup file').setInputFiles(file);
    await expect(page.getByText('This file is valid.')).toBeVisible();
    await expect(page.getByText(/3 attempts/)).toBeVisible();
    await page.getByLabel(/Download a backup of my current data first/).uncheck();
    await page.getByRole('button', { name: 'Replace current data' }).click();
    await expect(page.getByText(/Import complete \(replace\)/)).toBeVisible();
    expect(await attemptCount(page)).toBe(3);
    await page.goto('topic/T1.1.2/');
    await expect(page.getByText(/Evidence score/)).toHaveText(stateBefore!);
    await page.reload();
    await expect(page.getByText(/Evidence score/)).toHaveText(stateBefore!);
  });

  test('AC-F17-3: merging two diverging exports from two browsers unions attempts without duplicates', async ({ browser }) => {
    const a = await (await browser.newContext({ baseURL: BASE_URL })).newPage();
    const b = await (await browser.newContext({ baseURL: BASE_URL })).newPage();
    await activity(a, 'T1.1.2', 2);
    await activity(b, 'T1.1.3', 3);
    const fa = await exportFile(a);
    const fb = await exportFile(b);
    await a.goto('settings/');
    expect(await attemptCount(a)).toBe(2);
    await a.getByLabel('Import a backup file').setInputFiles(fb);
    await a.getByLabel(/Download a backup of my current data first/).uncheck();
    await a.getByRole('button', { name: 'Merge into current data' }).click();
    await expect(a.getByText(/Import complete \(merge\)/)).toBeVisible();
    expect(await attemptCount(a)).toBe(5);
    // importing the same file again must not duplicate
    await a.getByLabel('Import a backup file').setInputFiles(fb);
    await a.getByLabel(/Download a backup of my current data first/).uncheck();
    await a.getByRole('button', { name: 'Merge into current data' }).click();
    await expect(a.getByText(/Import complete \(merge\)/)).toBeVisible();
    expect(await attemptCount(a)).toBe(5);
    void fa;
  });

  test('AC-F17-2: malformed, truncated, wrong-schema and newer-schema files are rejected and change nothing', async ({ page }, info) => {
    await activity(page, 'T1.1.2', 2);
    const good = fs.readFileSync(await exportFile(page), 'utf8');
    const dir = info.outputPath('imports');
    fs.mkdirSync(dir, { recursive: true });
    const cases: [string, string, RegExp][] = [
      ['truncated.json', good.slice(0, good.length - 60), /not valid JSON/],
      ['garbage.json', '<<<nope', /not valid JSON/],
      ['wrong-schema.json', JSON.stringify({ schema: 'other-app', version: 1 }), /not an Architect Lab progress export/],
      ['newer.json', JSON.stringify({ ...JSON.parse(good), version: 99 }), /newer version of the app/],
      ['tampered.json', good.replace(/"score": (\d(\.\d+)?)/, '"score": 0.123'), /checksum does not match/],
      ['empty.json', '', /empty/],
    ];
    for (const [name, content, msg] of cases) {
      const f = `${dir}/${name}`;
      fs.writeFileSync(f, content);
      await page.getByLabel('Import a backup file').setInputFiles(f);
      const alert = page.getByRole('alert').filter({ hasText: 'Import rejected.' });
      await expect(alert).toContainText('Nothing was changed');
      await expect(alert).toContainText(msg);
      expect(await attemptCount(page)).toBe(2);
    }
  });
});

test.describe('keyboard-only and mobile', () => {
  /** Press Tab until the focused element has the given input name (regex source) or exact trimmed text. */
  async function tabTo(page: Page, target: { name?: string; text?: string }, max = 90) {
    const seen: string[] = [];
    for (let i = 0; i < max; i++) {
      await page.keyboard.press('Tab');
      seen.push(await page.evaluate(() => { const e = document.activeElement as HTMLInputElement | null; return e ? `${e.tagName}:${e.name || (e.textContent ?? '').trim().slice(0, 20)}` : 'none'; }));
      const hit = await page.evaluate((t) => { const e = document.activeElement as HTMLInputElement | null; if (!e) return false; return (t.name ? new RegExp(t.name).test(e.name ?? '') : false) || (t.text ? e.textContent?.trim() === t.text : false); }, target);
      if (hit) return;
    }
    throw new Error('could not reach ' + JSON.stringify(target) + ' by keyboard; focus order seen: ' + seen.slice(0, 14).join(' > '));
  }
  test('AC-A11Y-2: the full assessment is completable with the keyboard only', async ({ page }) => {
    test.setTimeout(240_000);
    await page.goto('assessment/');
    await tabTo(page, { text: 'Start the assessment' });
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: /Section C/ })).toBeVisible();
    for (const id of ['C01', 'C02', 'C03', 'C04', 'C05', 'C06', 'C07', 'C08', 'C09', 'C10', 'C11', 'C12', 'C13', 'C14', 'C15', 'C16', 'C17']) {
      await tabTo(page, { name: `^self-${id}$` });
      await page.keyboard.press('ArrowRight'); // radios are arrow-key operable
      await page.keyboard.press('Space');
    }
    await tabTo(page, { text: 'Continue to the questions' });
    await page.keyboard.press('Enter');
    let n = 0;
    while (!page.url().includes('/assessment/results/') && n < 150) {
      const panel = page.locator('section[aria-labelledby^="qh-"]').first();
      try { await panel.waitFor({ timeout: 3000 }); } catch { continue; }
      await expect(panel.locator('h2')).toBeFocused(); // focus moves to the new question heading
      await tabTo(page, { name: '^opt-' });
      await page.keyboard.press('Space');
      await tabTo(page, { name: '^c-' });
      await page.keyboard.press('Space');
      await tabTo(page, { text: 'Submit answer' });
      await page.keyboard.press('Enter');
      await expect(page.getByText(/Score for this item/)).toBeVisible();
      await tabTo(page, { text: 'Next question' });
      await page.keyboard.press('Enter');
      n++;
    }
    await expect(page).toHaveURL(/assessment\/results\//);
    await expect(page.getByRole('heading', { name: 'Assessment results' })).toBeVisible();
    expect(n).toBeGreaterThan(10);
  });

  test('NFR-03/AC-F01-4: 360px has no horizontal scroll on any route type; bottom bar and touch targets', async ({ browser }) => {
    const ctx = await browser.newContext({ baseURL: BASE_URL, viewport: { width: 360, height: 740 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    const routes = ['./', 'assessment/', 'pathway/', 'curriculum/', 'curriculum/M1.2/', 'topic/T1.2.1/', 'topic/T2.2.2/', 'cases/', 'case/CS-001/', 'case/CS-011/', 'patterns/', 'pattern/PAT06/', 'competencies/', 'map/', 'review/', 'exercises/', 'exercise/EX-01/', 'exercise/EX-02/', 'progress/', 'sources/', 'freshness/', 'settings/', 'about/', 'search/', 'no-such/'];
    for (const r of routes) {
      await page.goto(r);
      await page.waitForTimeout(250);
      await noHorizontalScroll(page);
    }
    await page.goto('./');
    const bar = page.locator('.bottom-bar');
    await expect(bar).toBeVisible();
    for (const el of await bar.locator('a, button').all()) expect((await el.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await page.getByRole('button', { name: 'More' }).click();
    await expect(page.getByRole('link', { name: 'Settings' }).last()).toBeVisible();
    // dashboard with data at 360px
    await startAssessmentAndComplete(page, { mode: 'wrong', maxQuestions: 8 });
    for (const r of ['./', 'progress/', 'pathway/', 'assessment/results/', 'competencies/']) { await page.goto(r); await page.waitForTimeout(400); await noHorizontalScroll(page); }
    await ctx.close();
  });
});

test.describe('static hosting under the base path', () => {
  test('deep links survive refresh; 404 page links home under the base; all requests stay under the base', async ({ page }) => {
    const urls: string[] = [];
    page.on('request', (r) => urls.push(r.url()));
    for (const r of ['topic/T1.2.1/', 'case/CS-003/', 'pattern/PAT01/', 'curriculum/M2.2/', 'exercise/EX-02/', 'sources/']) {
      const res = await page.goto(r);
      expect(res!.status()).toBe(200);
      await page.reload();
      await expect(page.locator('h1').first()).toBeVisible();
    }
    const missing = await page.goto('definitely/not/here/');
    expect(missing!.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'Page not found' })).toBeVisible();
    const home = await page.getByRole('link', { name: 'Back to the dashboard' }).getAttribute('href');
    expect(home).toBe(new URL(BASE_URL).pathname);
    await page.getByRole('link', { name: 'Back to the dashboard' }).click();
    await expect(page.getByRole('heading', { name: 'Architect Lab' })).toBeVisible();
    const root = new URL(BASE_URL);
    for (const u of urls) { const p = new URL(u); expect(p.origin).toBe(root.origin); expect(p.pathname.startsWith(root.pathname)).toBe(true); }
    // the same pages must NOT exist at the server root (proves the base is really applied)
    const atRoot = await page.request.get(`${root.origin}/topic/T1.2.1/`);
    expect(atRoot.status()).toBe(404);
  });
});
void nextQuestion;
