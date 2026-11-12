import { expect, type Page, type BrowserContext } from '@playwright/test';

export type Q = { id: string; type: string; stem: string; options?: { id: string; text: string; credit?: number }[]; correct?: any; rationales?: { id: string; text: string; valid: boolean }[]; checklist?: any[]; criteria?: any[]; model_scores?: any };
let bank: Q[] | null = null;
export async function loadBank(page: Page): Promise<Q[]> {
  if (bank) return bank;
  const r = await page.request.get('data/questions.json');
  bank = await r.json();
  return bank!;
}
/** Answer the question currently displayed. mode 'correct' picks the right answer, 'wrong' picks a wrong option. */
export async function answerCurrent(page: Page, mode: 'correct' | 'wrong' = 'correct', confidence = 3): Promise<Q> {
  const qs = await loadBank(page);
  const panel = page.locator('section[aria-labelledby^="qh-"]').first();
  await expect(panel).toBeVisible();
  const stem = (await panel.locator('p.reading').first().textContent())!.trim();
  const q = qs.find((x) => x.stem.trim() === stem);
  if (!q) throw new Error('Question not found in bank: ' + stem.slice(0, 60));
  const pick = async (text: string) => panel.locator('label.choice', { hasText: text.slice(0, 60) }).first().click();
  if (q.type === 'mcq') {
    const correct = new Set(Array.isArray(q.correct) ? q.correct : [q.correct]);
    for (const o of q.options!) if (mode === 'correct' ? correct.has(o.id) : !correct.has(o.id)) { await pick(o.text); if (mode === 'wrong') break; }
  } else if (q.type === 'scenario') {
    const best = q.options!.find((o) => o.id === q.correct)!;
    const wrong = q.options!.find((o) => (o.credit ?? 0) === 0)!;
    await pick((mode === 'correct' ? best : wrong).text);
    if (mode === 'correct') for (const r of q.rationales ?? []) if (r.valid) await pick(r.text);
  } else if (q.type === 'card') {
    await panel.locator('label.choice', { hasText: mode === 'correct' ? 'I knew it' : 'I did not know it' }).click();
  }
  await panel.locator(`fieldset:has(legend:has-text("How confident")) label.choice`, { hasText: new RegExp(`^${confidence}$`) }).first().click();
  await panel.getByRole('button', { name: 'Submit answer' }).click();
  await expect(panel.getByText(/Score for this item/)).toBeVisible();
  return q;
}
export async function nextQuestion(page: Page, label: RegExp = /Next question|Finish|Done|Next/) {
  await page.getByRole('button', { name: label }).first().click();
}
export async function startAssessmentAndComplete(page: Page, opts: { maxQuestions?: number; mode?: 'correct' | 'wrong' } = {}) {
  page.on('dialog', (d) => d.accept());
  await page.goto('assessment/');
  await page.getByRole('button', { name: /Start the assessment|Retake/ }).click();
  await expect(page.getByRole('heading', { name: /Section C/ })).toBeVisible();
  for (const grp of await page.locator('fieldset.card').all()) await grp.locator('label.choice', { hasText: /^3$/ }).click();
  await page.getByRole('button', { name: 'Continue to the questions' }).click();
  let n = 0;
  const max = opts.maxQuestions ?? 200;
  while (n < max) {
    if (page.url().includes('/assessment/results/')) break;
    const panel = page.locator('section[aria-labelledby^="qh-"]').first();
    try { await panel.waitFor({ timeout: 4000 }); } catch { if (page.url().includes('/assessment/results/')) break; continue; }
    await answerCurrent(page, opts.mode ?? 'correct', 3);
    n++;
    await nextQuestion(page, /Next question/);
    await page.waitForTimeout(30);
  }
  if (n >= max) await page.getByRole('button', { name: 'Finish now' }).click();
  await expect(page).toHaveURL(/assessment\/results\//, { timeout: 30_000 });
  return n;
}
export async function noHorizontalScroll(page: Page) {
  const [sw, cw] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(sw, `horizontal scroll: scrollWidth ${sw} > clientWidth ${cw}`).toBeLessThanOrEqual(cw);
}
export function collectProblems(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', (m) => { if (['error'].includes(m.type())) problems.push('console error: ' + m.text()); if (/Content Security Policy|CSP/i.test(m.text())) problems.push('CSP: ' + m.text()); });
  page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
  page.on('requestfailed', (r) => problems.push('request failed: ' + r.url()));
  return problems;
}
export async function blockExternal(ctx: BrowserContext, base: string) {
  const external: string[] = [];
  await ctx.route('**/*', (route) => {
    const u = route.request().url();
    if (!u.startsWith(base) && !u.startsWith('data:') && !u.startsWith('blob:')) { external.push(u); return route.abort(); }
    return route.continue();
  });
  return external;
}
