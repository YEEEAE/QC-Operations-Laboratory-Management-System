// Local disposable PG18 only; run through audit/CA-04/local-run.mjs.
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFileSync } from 'node:fs';
const result = { status: 'PARTIAL', checks: [] };
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width:1440, height:1000 } });
  await page.goto('http://127.0.0.1:4331/login');
  await page.locator('#loginIdentity').fill('verify-employee');
  await page.locator('#password').fill(process.env.QC_VERIFY_EMPLOYEE_PASSWORD);
  await page.locator('#password').press('Enter');
  await page.waitForURL(u => u.pathname === '/dashboard');
  await page.goto('http://127.0.0.1:4331/quarantine/receiving');
  const link = page.locator('a[href^="/quarantine/receiving/"]').filter({hasNotText:'New'}).first();
  result.href = await link.getAttribute('href', {timeout:10000});
  if (!result.href || result.href.endsWith('/new')) throw new Error('No populated receiving detail located; no fixture fabricated.');
  for (const width of [320,390,768,1024,1440]) {
    await page.setViewportSize({width,height:1000});
    await page.goto('http://127.0.0.1:4331'+result.href);
    if (!await page.locator('[data-record-id]').count()) throw new Error('Receiving detail not rendered');
    result.checks.push({width, overflow:await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)});
  }
  result.axe = (await new AxeBuilder({page}).include('#main-content').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations.map(v=>({id:v.id,nodes:v.nodes.length}));
  for (const media of [{forcedColors:'active'},{reducedMotion:'reduce'}]) {
    await page.emulateMedia(media);
    result.checks.push({media,overflow:await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth)});
  }
  result.status = 'READ_ONLY_CHECKED';
} catch(error) { result.blocker = error.message; }
finally {
  writeFileSync('audit/CA-P-QUARANTINE-RECEIVING-RECEIVINGID/browser-evidence.json',JSON.stringify(result,null,2));
  await browser.close();
}
console.log(JSON.stringify(result));
