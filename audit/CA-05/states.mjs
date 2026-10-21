// CA-05 state probe: rejected (not applied) filter state, policy-blocked
// decision state, and the separate controlled states of a real record.
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

const BASE = 'http://127.0.0.1:4331';
const PHASE = process.argv[2] ?? 'after';
const OUT = `audit/CA-05/${PHASE}`;
mkdirSync(`${OUT}/screens`, { recursive: true });
const prepared = JSON.parse(readFileSync('audit/CA-05/prepared.json', 'utf8'));
const out = { phase: PHASE, cases: {}, status: 'PARTIAL' };
const browser = await chromium.launch();
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'en-GB', timezoneId: 'Asia/Riyadh' });
  const page = await context.newPage();
  await page.goto(`${BASE}/login`);
  await page.locator('#loginIdentity').fill('verify-employee');
  await page.locator('#password').fill(process.env.QC_VERIFY_EMPLOYEE_PASSWORD);
  await page.locator('#password').press('Enter');
  await page.waitForURL((url) => url.pathname === '/dashboard');

  // 1. Rejected filter decision state on the receiving register.
  await page.goto(`${BASE}/quarantine/receiving?state=NOT_A_STATE`, { waitUntil: 'domcontentloaded' });
  out.cases.rejectedFilterState = {
    url: page.url(),
    notice: (await page.locator('.rejected').innerText().catch(() => '')).trim(),
    noticeRole: await page.locator('.rejected').getAttribute('role').catch(() => null),
    rowsStillListed: await page.locator('tbody tr').count(),
    body: (await page.locator('#main-content').innerText()).replace(/\s+/g, ' ').slice(0, 320),
  };
  await page.screenshot({ path: `${OUT}/screens/receiving-rejected-filter.png`, fullPage: true });

  // 2. Policy-blocked decision state (CAPA creation gate).
  await page.goto(`${BASE}/quality/capa/new`, { waitUntil: 'domcontentloaded' });
  out.cases.capaDecisionState = {
    heading: (await page.locator('#main-content h1').innerText().catch(() => '')).trim(),
    cardHeading: (await page.locator('.state-card h2, .state-card__heading').first().innerText().catch(() => '')).trim(),
    decisionId: (await page.locator('.state-card').innerText().catch(() => '')).replace(/\s+/g, ' ').slice(0, 400),
    formsInMain: await page.locator('#main-content form').count(),
    inputsInMain: await page.locator('#main-content input, #main-content select, #main-content textarea').count(),
    submitButtonsInMain: await page.locator('#main-content button[type="submit"]').count(),
    stateCardActions: await page.locator('#main-content .state-card__actions a').allTextContents(),
  };

  // 3. Separate controlled states of the real receiving record.
  await page.goto(`${BASE}${new URL(prepared.receivingUrl).pathname}`, { waitUntil: 'domcontentloaded' });
  const detail = await page.locator('#main-content').innerText();
  out.cases.receivingStates = {
    workflowState: /Receiving state\s*([A-Z_]+)/.exec(detail)?.[1] ?? null,
    inspectionResult: /Inspection result\s*([A-Z_]+)/.exec(detail)?.[1] ?? null,
    releaseState: /Release System State\s*([A-Z_]+)/.exec(detail)?.[1] ?? null,
    showsReleaseButton: await page.locator('[data-action="quarantine.releaseReceiving"]').count(),
    showsStartButton: await page.locator('[data-action="quarantine.transitionReceiving"]').count(),
    showsHoldForm: await page.locator('form.stacked').count(),
    correctionLink: await page.locator('a.start').count(),
  };

  // 4. Task record state text from the real record.
  await page.goto(`${BASE}/tasks?q=CA05-TASK-001`, { waitUntil: 'domcontentloaded' });
  const taskRow = await page.locator('tbody tr').first().innerText().catch(() => '');
  out.cases.taskRow = { row: taskRow.replace(/\s+/g, ' ').trim().slice(0, 220) };
  out.status = 'PASS';
} catch (error) {
  out.status = 'FAIL';
  out.error = error.message;
  process.exitCode = 1;
} finally {
  writeFileSync(`${OUT}/states.json`, JSON.stringify(out, null, 2));
  await browser.close();
}
console.log(JSON.stringify({ phase: PHASE, status: out.status, error: out.error }));
