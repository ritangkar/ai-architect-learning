import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { startAssessmentAndComplete } from './helpers';

// AC-A11Y-1 / NFR-02: axe must report zero serious or critical violations on every route type (WCAG 2.x A/AA rules).
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
async function scan(page: Page, label: string) {
  const r = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const bad = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  const detail = bad.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}\n   ${v.help}`).join('\n');
  expect(bad, `${label}: ${detail}`).toEqual([]);
  return r;
}
const ROUTES: [string, string][] = [
  ['home (no data)', './'], ['assessment intro', 'assessment/'], ['pathway', 'pathway/'], ['curriculum', 'curriculum/'], ['module', 'curriculum/M1.2/'],
  ['topic with lesson', 'topic/T1.2.1/'], ['topic without lesson', 'topic/T3.1.1/'], ['SAP topic', 'topic/T2.2.2/'], ['cases', 'cases/'], ['case tier A', 'case/CS-001/'], ['case tier C', 'case/CS-008/'], ['case provisional', 'case/CS-011/'],
  ['patterns', 'patterns/'], ['pattern', 'pattern/PAT06/'], ['competencies', 'competencies/'], ['map', 'map/'], ['review (empty)', 'review/'], ['exercises', 'exercises/'],
  ['exercise architecture review', 'exercise/EX-01/'], ['exercise options', 'exercise/EX-02/'], ['exercise drill', 'exercise/EX-03/'], ['exercise critique', 'exercise/EX-04/'],
  ['progress', 'progress/'], ['sources', 'sources/'], ['freshness', 'freshness/'], ['settings', 'settings/'], ['about', 'about/'], ['search', 'search/'], ['404', 'no-such-page/'],
];
for (const scheme of ['light', 'dark'] as const) {
  test.describe(`axe: ${scheme} theme`, () => {
    test.use({ colorScheme: scheme });
    for (const [label, route] of ROUTES) {
      test(`${label}`, async ({ page }) => {
        await page.goto(route);
        await page.waitForTimeout(500);
        await scan(page, `${label} (${scheme})`);
      });
    }
  });
}
test.describe('axe: states that need data', () => {
  test('question panel, feedback, results, dashboard with data, pathway, review', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('assessment/');
    await page.getByRole('button', { name: 'Start the assessment' }).click();
    await expect(page.getByRole('heading', { name: /Section C/ })).toBeVisible();
    for (const grp of await page.locator('fieldset.card').all()) await grp.locator('label.choice', { hasText: /^3$/ }).click();
    await scan(page, 'self-rating form');
    await page.getByRole('button', { name: 'Continue to the questions' }).click();
    await expect(page.locator('section[aria-labelledby^="qh-"]')).toBeVisible();
    await scan(page, 'question panel');
    await page.locator('input[name^="opt-"]').first().check();
    await page.locator('input[name^="c-"]').first().check();
    await page.getByRole('button', { name: 'Submit answer' }).click();
    await expect(page.getByText(/Score for this item/)).toBeVisible();
    await scan(page, 'question feedback');
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Abandon this run' }).click();
    await expect(page.getByRole('button', { name: 'Retake the assessment' })).toBeVisible();
    await startAssessmentAndComplete(page, { mode: 'wrong', maxQuestions: 10 });
    await scan(page, 'assessment results');
    for (const [l, r] of [['dashboard with data', './'], ['pathway with data', 'pathway/'], ['progress with data', 'progress/'], ['competencies with data', 'competencies/'], ['cases with data', 'cases/'], ['case with gap', 'case/CS-002/'], ['topic with data', 'topic/T1.1.2/']] as const) {
      await page.goto(r); await page.waitForTimeout(500); await scan(page, l);
    }
    await page.goto('topic/T1.1.3/');
    await page.getByRole('button', { name: 'Mark lesson as read' }).click();
    await page.goto('review/');
    await page.getByRole('button', { name: 'Start reviewing' }).click();
    await scan(page, 'review item (card front or missed question)');
    const show = page.getByRole('button', { name: 'Show answer' });
    if (await show.count()) { await show.click(); await scan(page, 'review card back'); }
  });
});
