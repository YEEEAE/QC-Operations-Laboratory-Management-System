// Local disposable PG18 runner only; no .env loading and no provider credentials.
// /500 is a public error surface with no Sidebar, so the main matrix needs no
// session; the session-aware recovery branch is exercised separately with the
// existing verification personas.
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const phase = process.argv[2] ?? 'before';
const dir = `audit/CA-P-500/${phase}`;
const BASE = 'http://127.0.0.1:4331';
const LEAK_MARKERS =
  /stack|traceback|node_modules|password|session_token|DATABASE_URL|select .* from|storage_key/i;
mkdirSync(dir, { recursive: true });

const out = { phase, checks: [], errors: [], consoleErrors: [], node: process.version };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Serialized into the page; no outer references are allowed in the body.
const measureMain = () => {
  const main = document.querySelector('#main-content');
  const visible = (e) => e.getClientRects().length > 0;
  const box = (e) => { const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; };
  const targets = [...main.querySelectorAll('a,button,summary,input,select')].filter(visible)
    .map((e) => ({ text: (e.textContent || '').trim(), href: e.getAttribute('href'), ...box(e) }));
  const text = [...main.querySelectorAll('*')]
    .filter((e) => visible(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
    .map((e) => ({ text: e.textContent.slice(0, 60), size: parseFloat(getComputedStyle(e).fontSize) }));
  const style = (sel) => {
    const e = document.querySelector(sel);
    if (!e) return null;
    const s = getComputedStyle(e);
    return { fontSize: s.fontSize, color: s.color, background: s.backgroundColor, margin: s.margin, fontWeight: s.fontWeight, overflowWrap: s.overflowWrap };
  };
  return {
    title: document.title,
    lang: document.documentElement.lang,
    direction: document.documentElement.dir,
    visualDirection: document.documentElement.getAttribute('data-visual-direction'),
    headings: [...main.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => [h.tagName, h.textContent.trim()]),
    paragraphCount: main.querySelectorAll('p').length,
    eyebrowCount: main.querySelectorAll('.eyebrow').length,
    cardCount: main.querySelectorAll('.state-card').length,
    sidebarCount: document.querySelectorAll('.app-sidebar').length,
    landmarks: { main: document.querySelectorAll('main').length, region: main.querySelectorAll('[role="region"], section[aria-labelledby]').length },
    actionLinks: [...main.querySelectorAll('a')].map((a) => ({ text: a.textContent.trim(), href: a.getAttribute('href'), ...box(a) })),
    referenceText: main.querySelector('.reference')?.textContent.trim() ?? null,
    bodyText: main.innerText.replace(/\\s+/g, ' ').trim(),
    targets,
    smallTargets: targets.filter((t) => t.h < 44 || t.w < 44),
    smallText: text.filter((t) => t.size < 12),
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    focusBorderOutline: style('.state-card'),
    styles: { h1: style('h1'), message: style('.state-card__message'), reference: style('.reference'), code: style('.reference code'), action: style('#main-content a') },
  };
};

const contrastOf = (page, selectors) =>
  page.evaluate((sels) => {
    const rgb = (value) => (value.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
    const luminance = (c) =>
      c.map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
        .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    const ratio = (a, b) => {
      const x = luminance(rgb(a));
      const y = luminance(rgb(b));
      return Number(((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2));
    };
    const cardBackground = getComputedStyle(document.querySelector('.state-card')).backgroundColor;
    return sels.map((sel) => {
      const element = document.querySelector(sel);
      if (!element) return { selector: sel, missing: true };
      const computed = getComputedStyle(element);
      const background = computed.backgroundColor === 'rgba(0, 0, 0, 0)' ? cardBackground : computed.backgroundColor;
      return { selector: sel, color: computed.color, background, ratio: ratio(computed.color, background) };
    });
  }, selectors);

const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: 'en-GB',
    timezoneId: 'Asia/Riyadh',
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => out.errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') out.consoleErrors.push(message.text()); });

  // The 500 status itself is reported as a resource-load console error by the
  // browser; it is the expected status contract, not a page script failure.
  const response = await page.goto(`${BASE}/500`, { waitUntil: 'networkidle' });
  out.status = response.status();
  // The Astro dev server injects its own client modules into the served document,
  // so the leak check is scoped to the rendered error region plus the classic
  // stack-frame shape, exactly like the repository's error-recovery E2E test.
  const mainHtml = await page.locator('#main-content').evaluate((element) => element.outerHTML);
  out.leakMarkers = LEAK_MARKERS.test(mainHtml);
  out.stackFrame = /at .+\(\//.test(mainHtml);
  out.noInlineScript = await page.locator('#main-content script').count();
  assert.ok(out.status >= 500, `expected a 500-class status, received ${out.status}`);
  assert.equal(out.leakMarkers, false, 'raw technical detail leaked into the surface');
  assert.equal(out.stackFrame, false, 'stack frame leaked into the surface');

  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${BASE}/500`, { waitUntil: 'networkidle' });
    const metrics = await page.evaluate(measureMain);
    await page.screenshot({ path: `${dir}/${width}.png`, fullPage: true });
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    metrics.axe = axe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length }));
    out.checks.push({ width, ...metrics });
    assert.equal(metrics.overflow, 0, `overflow at ${width}`);
    assert.equal(metrics.headings.length, 1, `heading count at ${width}`);
    assert.equal(metrics.actionLinks.length, 1, `action count at ${width}`);
    assert.equal(metrics.smallTargets.length, 0, `sub-44px target at ${width}`);
    assert.equal(metrics.smallText.length, 0, `sub-12px text at ${width}`);
    assert.equal(metrics.axe.length, 0, `axe violation at ${width}`);
  }

  // Anonymous recovery path: one safe sign-in link carrying the current route,
  // and the login form must fall back to /dashboard for a hostile returnTo.
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${BASE}/500`, { waitUntil: 'networkidle' });
  const anonymous = await page.evaluate(measureMain);
  out.anonymousAction = anonymous.actionLinks[0];
  assert.equal(anonymous.actionLinks[0].href, '/login?returnTo=%2F500');
  await page.locator('#main-content a').click();
  await page.waitForLoadState('networkidle');
  out.anonymousReturn = {
    path: new URL(page.url()).pathname,
    hiddenReturnTo: await page.locator('input[name="returnTo"]').inputValue(),
  };
  assert.equal(out.anonymousReturn.hiddenReturnTo, '/500');
  await page.goto(`${BASE}/login?returnTo=//evil.example`, { waitUntil: 'networkidle' });
  out.hostileReturnTo = { hiddenReturnTo: await page.locator('input[name="returnTo"]').inputValue() };
  assert.equal(out.hostileReturnTo.hiddenReturnTo, '/dashboard');

  // Keyboard: from the document, Tab reaches the single recovery action with a
  // visible focus indicator.
  await page.goto(`${BASE}/500`, { waitUntil: 'networkidle' });
  await page.locator('body').click({ position: { x: 4, y: 4 } });
  const focusSequence = [];
  for (let i = 0; i < 3; i += 1) {
    await page.keyboard.press('Tab');
    focusSequence.push(
      await page.evaluate(() => {
        const active = document.activeElement;
        const style = getComputedStyle(active);
        return {
          tag: active.tagName,
          text: (active.textContent || '').trim().slice(0, 40),
          href: active.getAttribute('href'),
          outlineWidth: style.outlineWidth,
          outlineStyle: style.outlineStyle,
          outlineOffset: style.outlineOffset,
        };
      }),
    );
  }
  out.keyboard = focusSequence;
  const focusedAction = focusSequence.find((entry) => entry.tag === 'A');
  assert.ok(focusedAction, 'recovery action never received focus');
  assert.notEqual(focusedAction.outlineStyle, 'none');
  assert.ok(parseFloat(focusedAction.outlineWidth) >= 2);

  // Contrast is measured from computed colours on the rendered card background.
  // The message role has a different selector before the consolidation.
  const messageSelector = phase === 'before' ? '.state-card p:not(.eyebrow)' : '.state-card__message';
  out.contrast = await contrastOf(page, ['h1', messageSelector, '.reference', '.reference code', '#main-content a']);
  for (const pair of out.contrast) {
    assert.equal(pair.missing, undefined, `missing contrast target ${pair.selector}`);
    assert.ok(pair.ratio >= 4.5, `contrast below 4.5:1 for ${pair.selector}`);
  }

  // Zoom simulation: CDP device metrics keep the CSS viewport at the equivalent
  // post-zoom width. This is reflow evidence, not a browser-menu zoom claim.
  out.zoom = [];
  for (const { label, width, deviceScaleFactor } of [
    { label: '200%', width: 720, deviceScaleFactor: 2 },
    { label: '400%', width: 360, deviceScaleFactor: 4 },
  ]) {
    const zoomContext = await browser.newContext({
      viewport: { width, height: 1000 },
      deviceScaleFactor,
      locale: 'en-GB',
      timezoneId: 'Asia/Riyadh',
    });
    const zoomPage = await zoomContext.newPage();
    await zoomPage.goto(`${BASE}/500`, { waitUntil: 'networkidle' });
    const metrics = await zoomPage.evaluate(measureMain);
    out.zoom.push({
      label,
      width,
      overflow: metrics.overflow,
      smallTargets: metrics.smallTargets.length,
      smallText: metrics.smallText.length,
      headings: metrics.headings.length,
      actionLinks: metrics.actionLinks.length,
    });
    await zoomPage.screenshot({ path: `${dir}/zoom-${label}.png`, fullPage: true });
    assert.equal(metrics.overflow, 0, `overflow at zoom ${label}`);
    assert.equal(metrics.smallTargets.length, 0, `sub-44px target at zoom ${label}`);
    assert.equal(metrics.smallText.length, 0, `sub-12px text at zoom ${label}`);
    await zoomContext.close();
  }

  // Media emulation at the narrowest supported width.
  out.media = [];
  for (const media of [{ forcedColors: 'active' }, { forcedColors: 'none', reducedMotion: 'reduce' }]) {
    await page.setViewportSize({ width: 320, height: 1000 });
    await page.emulateMedia(media);
    await page.goto(`${BASE}/500`, { waitUntil: 'networkidle' });
    const metrics = await page.evaluate(measureMain);
    out.media.push({ media, overflow: metrics.overflow, smallTargets: metrics.smallTargets.length, actionLinks: metrics.actionLinks.length });
    assert.equal(metrics.overflow, 0, `overflow under ${JSON.stringify(media)}`);
  }
  await page.emulateMedia({ forcedColors: 'none', reducedMotion: 'no-preference' });

  // Native no-JavaScript render: the error surface is server-rendered and must
  // stay complete without the client enhancer.
  const native = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 1000 } });
  const nativePage = await native.newPage();
  await nativePage.goto(`${BASE}/500`, { waitUntil: 'networkidle' });
  out.noJS = {
    heading: await nativePage.locator('#main-content h1').innerText(),
    actionLinks: await nativePage.locator('#main-content a').count(),
    reference: await nativePage.locator('.reference').count(),
    overflow: await nativePage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
  };
  assert.equal(out.noJS.actionLinks, 1);
  assert.equal(out.noJS.overflow, 0);
  await native.close();

  // Session-aware branch: the existing verification personas are real accounts on
  // the disposable database, so both an authorized and a least-privileged reader
  // are exercised against the same surface.
  out.personas = {};
  for (const persona of [
    { name: 'employee', identity: 'verify-employee', password: process.env.QC_VERIFY_EMPLOYEE_PASSWORD },
    { name: 'least', identity: 'verify-least', password: process.env.QC_VERIFY_LEAST_PASSWORD },
  ]) {
    const personaContext = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: 'en-GB', timezoneId: 'Asia/Riyadh' });
    const personaPage = await personaContext.newPage();
    await personaPage.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
    await personaPage.locator('#loginIdentity').fill(persona.identity);
    await personaPage.locator('#password').fill(persona.password ?? '');
    await personaPage.locator('#password').press('Enter');
    await personaPage.waitForURL((url) => url.pathname === '/dashboard');
    const signedIn = await personaPage.goto(`${BASE}/500`, { waitUntil: 'networkidle' });
    const metrics = await personaPage.evaluate(measureMain);
    await personaPage.screenshot({ path: `${dir}/${persona.name}-500.png`, fullPage: true });
    const entry = {
      status: signedIn.status(),
      sidebarCount: metrics.sidebarCount,
      action: metrics.actionLinks[0],
      headings: metrics.headings.length,
      overflow: metrics.overflow,
      smallTargets: metrics.smallTargets.length,
    };
    // Recovery must land on a real rendered surface, not a 404 sentinel.
    await personaPage.locator('#main-content a').click();
    await personaPage.waitForLoadState('networkidle');
    entry.recoveryTarget = { path: new URL(personaPage.url()).pathname, h1: await personaPage.locator('h1').first().innerText() };
    assert.equal(entry.action.href, '/dashboard');
    assert.equal(entry.recoveryTarget.path, '/dashboard');
    if (persona.name === 'least') {
      // Positive control first: the least reader can open a real persisted record.
      await personaPage.goto(`${BASE}/tasks`, { waitUntil: 'networkidle' });
      const recordLink = personaPage.getByRole('link', { name: 'VERIFY-AUTHZ-READONLY', exact: true });
      entry.existingRecordVisible = (await recordLink.count()) > 0;
      if (entry.existingRecordVisible) {
        await recordLink.first().click();
        await personaPage.waitForLoadState('networkidle');
        entry.existingRecord = { path: new URL(personaPage.url()).pathname, text: (await personaPage.locator('#main-content').innerText()).slice(0, 200) };
      }
      // Real visibility denial on an owner-only route (not an invented message).
      const deniedResponse = await personaPage.goto(`${BASE}/system/health`, { waitUntil: 'networkidle' });
      entry.ownerOnlyRoute = { status: deniedResponse.status(), bodyLength: (await personaPage.content()).length };
      assert.equal(entry.ownerOnlyRoute.status, 404);
    }
    out.personas[persona.name] = entry;
    await personaContext.close();
  }
  assert.equal(out.personas.employee.sidebarCount, 0, 'the error surface must not render the Sidebar');
  assert.equal(out.personas.least.sidebarCount, 0, 'the error surface must not render the Sidebar');

  out.status = 'PASS';
} catch (error) {
  out.status = 'FAIL';
  out.error = error.message;
  process.exitCode = 1;
} finally {
  writeFileSync(`${dir}/evidence.json`, JSON.stringify(out, null, 2));
  await browser.close();
}
console.log(JSON.stringify({ phase, status: out.status, error: out.error }));
