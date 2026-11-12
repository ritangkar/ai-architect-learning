import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import { answerCurrent, nextQuestion, startAssessmentAndComplete, collectProblems, noHorizontalScroll, blockExternal } from './helpers';
import { BASE_URL } from '../../playwright.config';

test.describe('UJ-01 first visit and initial assessment', () => {
  test('landing invites the assessment; assessment completes; results and pathway follow', async ({ page, context }) => {
    const external = await blockExternal(context, BASE_URL);
    const problems = collectProblems(page);
    await page.goto('./');
    await expect(page.getByRole('heading', { name: 'Start with the initial assessment' })).toBeVisible(); // AC-F01-1
    await expect(page.getByText('Everything stays in this browser')).toBeVisible();
    await page.getByRole('link', { name: /Start the initial assessment/ }).click();
    const answered = await startAssessmentAndComplete(page, { mode: 'correct' });
    expect(answered).toBeGreaterThan(10);
    await expect(page.getByRole('heading', { name: 'Assessment results' })).toBeVisible();
    await expect(page.getByText('not machine-graded')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Strengths/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Compressed/ })).toBeVisible();
    await page.getByRole('link', { name: 'Accept and open my pathway' }).click();
    await expect(page.getByRole('heading', { name: 'Pathway', exact: true })).toBeVisible();
    await expect(page.getByText(/Confirm in 2 questions/).first()).toBeVisible(); // AC-F03-2
    expect(external, 'no request may leave the origin').toEqual([]);
    expect(problems).toEqual([]);
  });

  test('AC-F02-2: refresh mid-assessment resumes at the same question; AC-F02-5: retake keeps history', async ({ page }) => {
    await page.goto('assessment/');
    await page.getByRole('button', { name: 'Start the assessment' }).click();
    for (const grp of await page.locator('fieldset.card').all()) await grp.locator('label.choice', { hasText: /^4$/ }).click();
    await page.getByRole('button', { name: 'Continue to the questions' }).click();
    await answerCurrent(page); await nextQuestion(page);
    await answerCurrent(page); await nextQuestion(page);
    const stem = (await page.locator('section[aria-labelledby^="qh-"] p.reading').first().textContent())!;
    const heading = await page.locator('section[aria-labelledby^="qh-"] h2').first().textContent();
    await page.reload();
    await expect(page.locator('section[aria-labelledby^="qh-"] p.reading').first()).toHaveText(stem);
    await expect(page.locator('section[aria-labelledby^="qh-"] h2').first()).toHaveText(heading!);
    // abandon, then a new run starts and the old one stays in history
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Abandon this run' }).click();
    await expect(page.getByRole('heading', { name: 'Previous runs' })).toBeVisible();
    await expect(page.getByText(/Abandoned run/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Retake the assessment' })).toBeVisible();
  });
});

test.describe('UJ-02 daily session and UJ-03 case with a prerequisite gap', () => {
  test('dashboard recommendations carry Because text and a mix explanation; case routes via the prerequisite and returns', async ({ page }) => {
    await startAssessmentAndComplete(page, { mode: 'wrong', maxQuestions: 12 });
    await page.goto('./');
    await expect(page.getByRole('heading', { name: 'Recommended next' })).toBeVisible();
    const cards = page.locator('section[aria-labelledby="rec-h"] .card');
    expect(await cards.count()).toBeGreaterThan(0);
    for (const c of await cards.all()) await expect(c.getByText('Because')).toBeVisible(); // AC-F01-2
    await expect(page.getByText(/Session balance/)).toBeVisible(); // AC-F12-2
    // UJ-03
    await page.goto('case/CS-002/');
    await expect(page.getByRole('heading', { name: 'Prerequisites for this case' })).toBeVisible();
    const fix = page.getByRole('button', { name: 'Fix gaps first, then return' });
    await expect(fix).toBeVisible();
    await fix.click();
    await expect(page).toHaveURL(/topic\/T1\.\d\.\d\//);
    await expect(page.getByText(/You came here from case/)).toBeVisible();
    const back = page.getByRole('link', { name: 'Return to the case' });
    await back.click();
    await expect(page).toHaveURL(/case\/CS-002\//);
  });
  test('no data: the case page still renders prerequisites with live state', async ({ page }) => {
    await page.goto('case/CS-001/');
    await expect(page.getByText('Not yet assessed').first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Where this concept is used' }).first()).toBeVisible();
    await page.getByRole('button', { name: 'Where this concept is used' }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });
});

test.describe('UJ-04 topic study', () => {
  test('depth switch is instant and remembered; mark read does not change mastery; answers do', async ({ page }) => {
    await page.goto('topic/T1.1.2/');
    await expect(page.getByText('Not yet assessed').first()).toBeVisible();
    const root = page.locator('#lesson-root');
    await page.getByRole('radio', { name: /Compress/ }).check();
    await expect(root).toHaveAttribute('data-depth', 'compress');
    await expect(page.locator('[data-block="lesson"]')).toBeHidden();
    await page.getByRole('radio', { name: /Deep/ }).check();
    await expect(page.locator('[data-block="deep"]')).toBeVisible();
    await page.reload();
    await expect(root).toHaveAttribute('data-depth', 'deep'); // remembered per topic (AC-F05-2)
    await page.goto('topic/T1.1.1/');
    await expect(root).not.toHaveAttribute('data-depth', 'deep');
    await page.goto('topic/T1.1.2/');
    await page.getByRole('button', { name: 'Mark lesson as read' }).click();
    await expect(page.getByText(/You marked this lesson read 1 time/)).toBeVisible();
    await expect(page.getByText('Not yet assessed').first()).toBeVisible(); // AC-F05-1: no mastery change
    await expect(page.getByText(/Evidence score n\/a from 0 answers/)).toBeVisible();
    await page.getByRole('button', { name: 'Start check questions' }).click();
    for (let i = 0; i < 4; i++) {
      await answerCurrent(page, 'correct', 4);
      const btn = page.getByRole('button', { name: /Next question|Finish/ });
      await btn.first().click();
      if (!(await page.locator('section[aria-labelledby^="qh-"]').count())) break;
    }
    await expect(page.getByText(/Evidence score \d+% from \d+ answers?/)).toBeVisible();
  });
  test('topic without a lesson shows the honest empty state, never filler', async ({ page }) => {
    await page.goto('topic/T3.1.1/');
    await expect(page.getByText('Lesson text not written yet.')).toBeVisible(); // AC-F05-3
    await expect(page.getByRole('heading', { name: 'Objectives' })).toBeVisible();
    await expect(page.getByText(/lorem ipsum/i)).toHaveCount(0);
  });
  test('SAP topics show the status note and verify marker', async ({ page }) => {
    await page.goto('topic/T2.2.2/');
    await expect(page.getByText('Availability note:')).toBeVisible();
    await expect(page.getByText(/not yet verified in this portal/)).toBeVisible();
    await expect(page.getByText('Verify before use.')).toBeVisible(); // AC-F19-1
  });
});

test.describe('UJ-05 revision', () => {
  test('cards enter the queue when a lesson is read; reviewing reschedules them', async ({ page }) => {
    await page.goto('topic/T1.1.3/');
    await page.getByRole('button', { name: 'Mark lesson as read' }).click();
    await expect(page.getByText(/read 1 time/)).toBeVisible();
    await page.goto('review/');
    await expect(page.getByText(/3 items? due now/)).toBeVisible();
    await page.getByRole('button', { name: 'Start reviewing' }).click();
    await page.getByRole('button', { name: 'Show answer' }).click();
    await page.getByRole('radio', { name: '4' }).check();
    await page.getByRole('button', { name: 'I knew it' }).click();
    await expect(page.getByText(/Item 2 of 3/)).toBeVisible();
    await page.getByRole('button', { name: 'Show answer' }).click();
    await page.getByRole('button', { name: 'I did not know it' }).click();
    await page.getByRole('button', { name: 'Snooze 3 days' }).click();
    await expect(page.getByText('That is everything due for now')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Scheduled' })).toBeVisible();
    await expect(page.getByText(/days overdue|you are behind|you missed|too late|penalt(y|ies) apply/i)).toHaveCount(0); // AC-F11-2: no penalty text
    await page.reload(); // queue persists
    await expect(page.getByText(/0 items? due now, 3 in your schedule/)).toBeVisible();
  });
});

test.describe('UJ-06 architecture review exercise', () => {
  test('mark flaws, submit, compare with model findings', async ({ page }) => {
    await page.goto('exercise/EX-01/');
    await expect(page.getByText('constructed for teaching')).toBeVisible();
    for (const t of ['One broad service account', 'Untrusted email and PDF', 'no human approval', 'ten self-selected invoices', 'Logs record only', 'no idempotency', 'only defence against fraudulent']) await page.locator('label.choice', { hasText: t }).click();
    await page.getByLabel('Your own findings').fill('Payments need approval.');
    await page.getByRole('button', { name: 'Submit review' }).click();
    await expect(page.getByText(/Score \d+%/)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Model findings' })).toBeVisible();
    await page.goto('progress/');
    await page.locator('summary', { hasText: 'L3 Architect' }).click();
    await expect(page.getByText(/First architecture review exercise passed/)).toContainText('');
    await expect(page.locator('li', { hasText: 'First architecture review exercise passed' })).toContainText('1 passed');
  });
  test('options analysis exports a valid Markdown ADR (AC-F20-1)', async ({ page }) => {
    await page.goto('exercise/EX-02/');
    await page.getByLabel('Decision title').fill('Model access for claims assistant');
    const selects = page.locator('table select');
    const n = await selects.count();
    for (let i = 0; i < n; i++) await selects.nth(i).selectOption(String(((i * 7) % 5) + 1));
    await page.getByLabel('Your decision').selectOption({ label: 'Managed model service in the insurer\'s existing cloud' });
    await page.getByLabel('Trade-offs and consequences').fill('Less control than self-hosting; faster to operate.');
    const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download ADR (Markdown)' }).click()]);
    const md = fs.readFileSync((await dl.path())!, 'utf8');
    expect(md).toMatch(/^# ADR: Model access for claims assistant/m);
    for (const h of ['## Context', '## Decision', '## Options considered', '## Criteria and weights', '## Scores', '## Trade-offs and consequences']) expect(md).toContain(h);
    expect(md).toContain('We choose **Managed model service');
    expect(md).toMatch(/\| Criterion \| Weight \|/);
  });
  test('discovery drill and requirements critique run', async ({ page }) => {
    await page.goto('exercise/EX-03/');
    await page.getByLabel('Outcome', { exact: true }).fill('Which tasks, measured how?');
    await page.getByRole('button', { name: 'Reveal the model questions' }).click();
    await expect(page.getByText(/You covered 0 of 12 model questions/)).toBeVisible();
    await page.goto('exercise/EX-04/');
    await page.locator('fieldset', { hasText: 'R1' }).locator('label.choice', { hasText: 'Vague or untestable' }).click();
    await page.getByRole('button', { name: 'Submit critique' }).click();
    await expect(page.getByText(/Score \d+%/)).toBeVisible();
  });
});

test.describe('UJ-07 knowledge map, UJ-08 search and filter', () => {
  test('answers the six questions in two interactions or fewer', async ({ page }) => {
    await page.goto('map/');
    await page.getByLabel('Pattern', { exact: true }).selectOption('PAT06'); // 1 interaction (default preset is "cases for pattern X")
    await expect(page.getByRole('link', { name: /CS-001/ })).toBeVisible();
    await page.getByRole('radio', { name: /multi-agent orchestration/ }).check(); // 1
    await expect(page.getByRole('link', { name: /CS-001/ })).toBeVisible();
    await page.getByRole('radio', { name: /come before case/ }).check(); // 1
    await page.getByLabel('Case', { exact: true }).selectOption('CS-002'); // 2
    await expect(page.getByRole('listitem').filter({ hasText: 'T1.2.1' }).first()).toBeVisible();
    await page.getByRole('radio', { name: /patterns have I studied/ }).check(); // 1
    await expect(page.getByText('not yet').first()).toBeVisible();
    await page.getByRole('radio', { name: /weakest competencies/ }).check(); // 1
    await expect(page.getByText(/No evidence yet/)).toBeVisible();
    await page.getByRole('radio', { name: /learn next/ }).check(); // 1
    await expect(page.getByRole('heading', { name: 'Answer' })).toBeVisible();
    // optional graph view and its list fallback
    await page.getByRole('radio', { name: /Which cases demonstrate pattern/ }).check();
    await page.getByRole('tab', { name: /Graph/ }).click();
    await expect(page.locator('figure.diagram svg')).toBeVisible();
  });
  test('case library filters combine (AND) and persist in the URL (AC-F04-1)', async ({ page }) => {
    await page.goto('cases/');
    await expect(page.getByText(/14 cases catalogued/)).toBeVisible();
    await expect(page.getByText(/Target of 100-200 is NOT reached/)).toBeVisible(); // AC-F06-5
    await page.getByLabel('Tier / evidence depth').selectOption('A');
    await page.getByLabel('Pattern').selectOption('PAT12');
    await expect(page).toHaveURL(/tier=A/);
    await expect(page).toHaveURL(/pattern=PAT12/);
    const shown = await page.getByText(/\d+ of 14 cases match/).textContent();
    await page.reload();
    await expect(page.getByLabel('Tier / evidence depth')).toHaveValue('A');
    await expect(page.getByText(shown!)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Simulations' })).toBeVisible();
    await expect(page.getByText(/No simulation cases authored yet/)).toBeVisible();
  });
  test('curriculum filters persist; search finds topics and runs locally under the base path', async ({ page, context }) => {
    await page.goto('curriculum/?pillar=P2&hands=browser');
    await expect(page.getByLabel('Pillar')).toHaveValue('P2');
    await expect(page.getByText(/\d+ of 73 topics match/)).toBeVisible();
    const external = await blockExternal(context, BASE_URL);
    await page.goto('search/');
    await page.getByLabel('Search', { exact: true }).fill('hybrid retrieval reranking');
    await expect(page.getByRole('link', { name: /Vector stores, hybrid search and reranking/ }).first()).toBeVisible({ timeout: 15000 });
    expect(external).toEqual([]); // AC-F13-2
  });
});

test.describe('UJ-10 freshness', () => {
  test('SAP topics and flagged cases are listed with last-verified state', async ({ page }) => {
    await page.goto('freshness/');
    await expect(page.getByRole('heading', { name: 'Freshness' })).toBeVisible();
    await expect(page.getByText('not yet verified').first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'T2.1.1' }).first()).toBeVisible();
    await expect(page.getByText(/Joule Studio GA date/)).toBeVisible();
    await page.goto('sources/');
    await expect(page.getByText(/30 sources/)).toBeVisible();
    await expect(page.locator('tr#SRC-005')).toContainText('verify before use'); // AC-F06-1 anchors resolve
  });
});
