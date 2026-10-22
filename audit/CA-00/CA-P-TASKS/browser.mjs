// Actual local route; credentials loaded only by CA-04/local-run.mjs.
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const phase = process.argv[2] ?? 'before';
const out = { phase, checks: [], errors: [], status: 'PARTIAL' };
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'en-GB', timezoneId: 'Asia/Riyadh' });
const page = await context.newPage();
page.on('pageerror', e => out.errors.push(e.message));
mkdirSync(`audit/CA-P-TASKS/${phase}`, { recursive: true });
try {
  await page.goto('http://127.0.0.1:4331/login');
  await page.locator('#loginIdentity').fill('verify-employee');
  await page.locator('#password').fill(process.env.QC_VERIFY_EMPLOYEE_PASSWORD);
  await page.locator('#password').press('Enter');
  await page.waitForURL(url => url.pathname === '/dashboard');
  for (const width of [320,390,768,1024,1440]) {
    await page.setViewportSize({width,height:1000});
    await page.goto('http://127.0.0.1:4331/tasks', {waitUntil:'networkidle'});
    const metrics = await page.evaluate(() => ({ overflow: document.documentElement.scrollWidth-document.documentElement.clientWidth, rows: [...document.querySelectorAll('tbody tr')].map(r=>r.textContent), sidebar: [...document.querySelectorAll('.app-sidebar a')].map(a=>[a.textContent,a.getAttribute('href')]), background: getComputedStyle(document.querySelector('.app-sidebar')).backgroundColor }));
    assert.equal(metrics.overflow,0);
    assert.ok(metrics.rows.length, 'populated register required');
    await page.screenshot({path:`audit/CA-P-TASKS/${phase}/${width}.png`,fullPage:true});
    out.checks.push({width,...metrics});
  }
  const axe = await new AxeBuilder({page}).include('#main-content').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  out.axe = axe.violations.map(v=>({id:v.id,nodes:v.nodes.length}));
  assert.equal(out.axe.length,0);
  await page.locator('#q').focus();
  await page.keyboard.press('Tab');
  out.keyboard = await page.evaluate(()=>({id:document.activeElement.id,outline:getComputedStyle(document.activeElement).outlineStyle}));
  assert.equal(out.keyboard.id,'state');
  const record = page.locator('tbody th a').first();
  out.recordHref = await record.getAttribute('href');
  await record.click();
  assert.match(await page.locator('#main-content').innerText(), /CA-P-TASKS-LOCAL/);
  out.existingRecord = 'PASS';
  await page.goto('http://127.0.0.1:4331/tasks?q=ca-p-no-match');
  assert.match(await page.locator('.empty').innerText(),/No tasks match/);
  out.filteredEmpty = 'PASS';
  await page.locator('.applied-filters .clear-filters').click();
  assert.ok(await page.locator('tbody th a').count());
  out.clearFilter = 'PASS';
  for (const media of [{forcedColors:'active'},{reducedMotion:'reduce'}]) {
    await page.emulateMedia(media);
    await page.setViewportSize({width:320,height:1000});
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth),0);
    out.checks.push({media,status:'PASS'});
  }
  const native = await browser.newContext({javaScriptEnabled:false});
  await native.addCookies(await context.cookies());
  const nativePage = await native.newPage();
  await nativePage.goto('http://127.0.0.1:4331/tasks');
  await nativePage.locator('#q').fill('ca-p-native-no-match');
  await nativePage.locator('form[role="search"] button[type="submit"]').click();
  assert.match(await nativePage.locator('.empty').innerText(),/No tasks match/);
  out.nativeGet = 'PASS';
  await native.close();
  out.status='PASS';
} catch(e) {out.status='FAIL';out.error=e.message;process.exitCode=1;}
finally {writeFileSync(`audit/CA-P-TASKS/${phase}/evidence.json`,JSON.stringify(out,null,2));await browser.close();}
console.log(JSON.stringify({phase,status:out.status,error:out.error}));
