// Authenticated evidence for /audit against the disposable PostgreSQL 18 cluster.
// Local accounts and data only. Never reads the repository .env or a provider URL.
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { Pool } from 'pg';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const phase = process.argv[2] === 'before' ? 'before' : 'after';
const base = process.env.AUDIT_EVIDENCE_BASE ?? 'http://127.0.0.1:4333';
const fixture = JSON.parse(readFileSync(resolve('.tmp/ca04-fixture-env.json'), 'utf8'));
const databaseUrl = `postgresql://qc_owner@localhost:55432/qc_disposable?sslmode=verify-full&sslrootcert=${resolve('.tmp/pg18/tls/ca.crt')}`;
const url = new URL(databaseUrl);
assert.equal(url.hostname, 'localhost');
assert.equal(url.port, '55432');
assert.equal(url.pathname, '/qc_disposable');

const outDir = `audit/CA-P-AUDIT/${phase}`;
mkdirSync(outDir, { recursive: true });
const pool = new Pool({ connectionString: databaseUrl });
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const output = {
  task: 'CA-P-AUDIT',
  phase,
  base,
  database: 'qc_disposable@localhost:55432',
  checks: [],
  pageErrors: [],
};

async function login(page, identity, password) {
  await page.goto(`${base}/login`);
  await page.locator('#loginIdentity').fill(identity);
  await page.locator('#password').fill(password);
  await page.locator('#password').press('Enter');
  await page.waitForURL(/\/dashboard/);
}

function metricScript() {
  const main = document.querySelector('#main-content');
  if (!main) return null;
  const doc = document.documentElement;
  const tableRegion = main.querySelector('[role="region"][aria-label]');
  const interactive = [
    ...main.querySelectorAll('a[href], button, input, select, textarea, [tabindex="0"]'),
  ].filter((element) => {
    const style = getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden' && element.getBoundingClientRect().width > 0;
  });
  const undersized = interactive
    .map((element) => ({
      tag: element.tagName.toLowerCase(),
      text: (element.getAttribute('aria-label') || element.textContent || element.getAttribute('name') || '').trim().slice(0, 80),
      height: Math.round(element.getBoundingClientRect().height * 100) / 100,
      width: Math.round(element.getBoundingClientRect().width * 100) / 100,
    }))
    .filter((entry) => entry.height < 44);
  const smallText = [...main.querySelectorAll('*')]
    .filter((element) => element.children.length === 0 && (element.textContent ?? '').trim().length > 0)
    .map((element) => ({
      tag: element.tagName.toLowerCase(),
      text: (element.textContent ?? '').trim().slice(0, 60),
      size: parseFloat(getComputedStyle(element).fontSize),
    }))
    .filter((entry) => entry.size < 12);
  const headings = [...main.querySelectorAll('h1,h2')].map((element) => ({
    level: element.tagName,
    text: element.textContent?.trim() ?? '',
  }));
  const clipped = [...main.querySelectorAll('th,td,code,.chip-value')]
    .filter((element) => element.scrollWidth > element.clientWidth + 1)
    .map((element) => ({
      tag: element.tagName.toLowerCase(),
      text: (element.textContent ?? '').trim().slice(0, 60),
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    }));
  const topLevel = [...main.children].map((element) => ({
    tag: element.tagName.toLowerCase(),
    className: element.className,
  }));
  return {
    viewport: { width: window.innerWidth, height: window.innerHeight },
    globalOverflow: doc.scrollWidth - doc.clientWidth,
    mainOverflow: main.scrollWidth - main.clientWidth,
    headings,
    topLevel,
    clipped,
    rows: main.querySelectorAll('tbody tr').length,
    table: tableRegion
      ? {
          role: tableRegion.getAttribute('role'),
          label: tableRegion.getAttribute('aria-label'),
          tabindex: tableRegion.getAttribute('tabindex'),
          scrollWidth: tableRegion.scrollWidth,
          clientWidth: tableRegion.clientWidth,
        }
      : null,
    text: main.innerText.replace(/\s+/g, ' ').trim().slice(0, 1200),
    undersized,
    smallText,
    controlCount: interactive.length,
  };
}

async function capture(page, width, label, path = '/audit') {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
  const metrics = await page.evaluate(metricScript);
  assert.ok(metrics, `${label}: main missing`);
  if (phase === 'after') {
    assert.equal(metrics.globalOverflow, 0, `${label}@${width}: global overflow`);
    assert.equal(metrics.undersized.length, 0, `${label}@${width}: control below 44px`);
    assert.equal(metrics.smallText.length, 0, `${label}@${width}: text below 12px`);
    assert.equal(metrics.clipped.length, 0, `${label}@${width}: clipped table/chip content`);
  }
  const axe = await new AxeBuilder({ page })
    .include('#main-content')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const screenshot = `${outDir}/${label}-${width}.png`;
  await page.screenshot({ path: screenshot, fullPage: true });
  output.checks.push({
    label,
    path,
    width,
    screenshot,
    axe: axe.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.length,
    })),
    ...metrics,
  });
  if (phase === 'after') {
    assert.equal(axe.violations.length, 0, `${label}@${width}: axe violations`);
  }
  return metrics;
}

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: 'en-GB',
    timezoneId: 'Asia/Riyadh',
  });
  const page = await context.newPage();
  page.on('pageerror', (error) => output.pageErrors.push(error.message));
  await login(page, 'verify-admin', fixture.QC_VERIFY_ADMIN_PASSWORD);

  const authorized = {};
  for (const width of [320, 390, 768, 1024, 1440]) {
    authorized[width] = await capture(page, width, 'audit-authorized');
  }
  const auditRows = await pool.query('select count(*)::int as count from qc.audit_events');
  output.auditEventCount = auditRows.rows[0].count;

  // Filtered state, filtered-empty state and an out-of-range offset.
  const filtered = await capture(page, 390, 'audit-filtered', '/audit?action=CREATE_TASK');
  const filteredEmpty = await capture(page, 390, 'audit-filtered-empty', '/audit?subjectType=NO_SUCH_RECORD');
  const beyond = await capture(page, 390, 'audit-offset-beyond', '/audit?offset=500');
  const longFilter = await capture(
    page,
    320,
    'audit-long-filter',
    `/audit?action=${'A'.repeat(120)}`,
  );
  output.filterStates = {
    filteredRows: filtered.rows,
    filteredEmptyRows: filteredEmpty.rows,
    beyondRows: beyond.rows,
    longFilterChips: await page.locator('[data-applied-filters] a').count(),
    longFilterRows: longFilter.rows,
  };
  // Recorded, not repaired: a non-UUID record/actor reference reaches the typed
  // PostgreSQL column and is classified as an outage. This pre-dates CA-P-AUDIT.
  await page.goto(`${base}/audit?subjectId=not-a-uuid`, { waitUntil: 'networkidle' });
  output.invalidIdentifierFilter = await page.evaluate(() => {
    const main = document.querySelector('#main-content');
    return {
      status: 'RECORDED',
      unavailable: main?.querySelectorAll('.unavailable').length ?? 0,
      rows: main?.querySelectorAll('tbody tr').length ?? 0,
      count: main?.querySelectorAll('.result-count').length ?? 0,
    };
  });

  // Keyboard focus: filter control, applied-filter chip, table region, pager.
  await page.setViewportSize({ width: 1024, height: 1000 });
  output.focus = [];
  await page.goto(`${base}/audit?limit=5`, { waitUntil: 'networkidle' });
  for (const [label, selector] of [
    ['filter-input', '#main-content form[role="search"] input'],
    ['table-region', '[role="region"][aria-label]'],
    ['pager-link', '.pager a, .pagination a'],
  ]) {
    const locator = page.locator(selector).first();
    if ((await locator.count()) === 0) {
      output.focus.push({ label, status: 'NOT PRESENT' });
      continue;
    }
    await locator.focus();
    const result = await locator.evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        active: document.activeElement === element,
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        outlineColor: style.outlineColor,
      };
    });
    if (phase === 'after') {
      assert.equal(result.active, true, `${label}: not focusable`);
      assert.notEqual(result.outlineStyle, 'none', `${label}: no visible focus outline`);
      assert.notEqual(result.outlineWidth, '0px', `${label}: zero focus outline`);
    }
    output.focus.push({ label, status: 'PASS', ...result });
  }
  await page.goto(`${base}/audit?action=CREATE_TASK`, { waitUntil: 'networkidle' });
  {
    const locator = page.locator('[data-applied-filters] a').first();
    if ((await locator.count()) === 0) {
      output.focus.push({ label: 'applied-filter-chip', status: 'NOT PRESENT' });
    } else {
      await locator.focus();
      const result = await locator.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          active: document.activeElement === element,
          outlineStyle: style.outlineStyle,
          outlineWidth: style.outlineWidth,
          outlineColor: style.outlineColor,
        };
      });
      if (phase === 'after') {
        assert.equal(result.active, true, 'applied-filter-chip: not focusable');
        assert.notEqual(result.outlineStyle, 'none', 'applied-filter-chip: no visible focus outline');
        assert.notEqual(result.outlineWidth, '0px', 'applied-filter-chip: zero focus outline');
      }
      output.focus.push({ label: 'applied-filter-chip', status: 'PASS', ...result });
    }
  }

  // Measured contrast on the final rendered colors (not inferred from tokens).
  await page.setViewportSize({ width: 1024, height: 1000 });
  const contrastFor = async (path) => {
    await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
    return page.evaluate(() => {
      const parse = (value) => {
        const match = /rgba?\(([^)]+)\)/.exec(value);
        if (!match) return null;
        const parts = match[1].split(',').map((part) => Number(part.trim()));
        return [parts[0], parts[1], parts[2], parts[3] ?? 1];
      };
      const blend = (top, bottom) => {
        const alpha = top[3] + bottom[3] * (1 - top[3]);
        if (alpha === 0) return [0, 0, 0, 0];
        return [
          (top[0] * top[3] + bottom[0] * bottom[3] * (1 - top[3])) / alpha,
          (top[1] * top[3] + bottom[1] * bottom[3] * (1 - top[3])) / alpha,
          (top[2] * top[3] + bottom[2] * bottom[3] * (1 - top[3])) / alpha,
          alpha,
        ];
      };
      const luminance = (rgb) => {
        const channel = (value) => {
          const normalized = value / 255;
          return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
      };
      const ratio = (foreground, background) => {
        const a = luminance(foreground);
        const b = luminance(background);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      };
      const backgroundOf = (element) => {
        const chain = [];
        for (let node = element; node; node = node.parentElement) chain.unshift(node);
        let background = parse(getComputedStyle(document.body).backgroundColor) ?? [20, 24, 30, 1];
        for (const node of chain) {
          const layer = parse(getComputedStyle(node).backgroundColor);
          if (layer && layer[3] > 0) background = blend(layer, background);
        }
        return background;
      };
      const selectors = [
        ['h1', 'h1'],
        ['purpose', '.purpose'],
        ['filter heading', '.filter-panel h2'],
        ['filter label', '.filter-panel label'],
        ['timezone note', '.timezone-note'],
        ['result count', '.result-count'],
        ['empty message', '.state-notice p'],
        ['table action', 'tbody td.action'],
        ['record reference', '.record-reference'],
        ['request reference', '.request-reference'],
        ['applied filter chip', '[data-applied-filters] .chip-value'],
      ];
      return selectors.flatMap(([label, selector]) => {
        const element = document.querySelector(selector);
        if (!element) return [];
        const style = getComputedStyle(element);
        const foreground = parse(style.color);
        if (!foreground) return [];
        const background = backgroundOf(element);
        const effective = blend(foreground, background);
        return [
          {
            label,
            selector,
            fontSize: parseFloat(style.fontSize),
            fontWeight: style.fontWeight,
            foreground: style.color,
            background: `rgb(${background.slice(0, 3).map((value) => Math.round(value)).join(' ')})`,
            ratio: Math.round(ratio(effective, background) * 100) / 100,
          },
        ];
      });
    });
  };
  output.contrast = await contrastFor('/audit?action=CREATE_TASK');
  const emptyContrast = await contrastFor('/audit?subjectType=NO_SUCH_RECORD');
  output.contrast.push(
    ...emptyContrast.filter((entry) =>
      ['result count', 'h1', 'empty message'].includes(entry.label),
    ),
  );
  if (phase === 'after') {
    for (const entry of output.contrast) {
      assert.ok(entry.ratio >= 4.5, `${entry.label}: contrast ${entry.ratio}`);
    }
  }

  // Media preferences: reduced motion and forced colors keep the same width contract.
  output.media = [];
  for (const media of [{ reducedMotion: 'reduce' }, { forcedColors: 'active' }]) {
    await page.emulateMedia(media);
    await page.setViewportSize({ width: 320, height: 1000 });
    await page.goto(`${base}/audit`, { waitUntil: 'networkidle' });
    const value = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      bodyBackground: getComputedStyle(document.body).backgroundColor,
    }));
    if (phase === 'after') assert.equal(value.overflow, 0, `${JSON.stringify(media)}: overflow`);
    output.media.push({ media, status: phase === 'after' ? 'PASS' : 'RECORDED', ...value });
  }
  await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'none' });

  // No JavaScript: the same GET form, chips and pager remain native links.
  const nativeContext = await browser.newContext({ javaScriptEnabled: false });
  const nativePage = await nativeContext.newPage();
  await login(nativePage, 'verify-admin', fixture.QC_VERIFY_ADMIN_PASSWORD);
  await nativePage.goto(`${base}/audit`);
  await nativePage.locator('#f-action').fill('CREATE_TASK');
  await nativePage.locator('form[role="search"] button[type="submit"]').click();
  await nativePage.waitForURL(/action=CREATE_TASK/);
  assert.equal(await nativePage.locator('tbody tr').count(), 1);
  if (phase === 'after') {
    await nativePage.locator('[data-applied-filters] .clear-filters').click();
    await nativePage.waitForURL(`${base}/audit`);
  } else {
    await nativePage.goto(`${base}/audit`);
  }
  output.noJs = { status: 'PASS', rowsAfterClear: await nativePage.locator('tbody tr').count() };
  await nativeContext.close();

  // Least-privileged account: current source grants every ACTIVE account the
  // universal operational read permission set, which includes audit view.
  // This records the actual policy instead of fabricating a denial.
  const leastContext = await browser.newContext({
    viewport: { width: 390, height: 1000 },
    locale: 'en-GB',
    timezoneId: 'Asia/Riyadh',
  });
  const leastPage = await leastContext.newPage();
  leastPage.on('pageerror', (error) => output.pageErrors.push(error.message));
  await login(leastPage, 'verify-least', fixture.QC_VERIFY_LEAST_PASSWORD);
  await leastPage.goto(`${base}/audit`, { waitUntil: 'networkidle' });
  const least = await leastPage.evaluate(() => {
    const main = document.querySelector('#main-content');
    return {
      text: main?.innerText.replace(/\s+/g, ' ').trim().slice(0, 800) ?? '',
      rows: main?.querySelectorAll('tbody tr').length ?? 0,
      table: main?.querySelectorAll('table').length ?? 0,
      count: main?.querySelectorAll('.result-count, .register-total').length ?? 0,
      states: main?.querySelectorAll('.denied, .empty, .unavailable').length ?? 0,
      mutationControls: main?.querySelectorAll('form[method="post"]').length ?? 0,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  assert.equal(least.rows, output.auditEventCount, 'least-privileged account must read the same authorized history');
  assert.equal(least.mutationControls, 0, 'audit register must expose no mutation control');
  if (phase === 'after') assert.equal(least.overflow, 0);
  await leastPage.screenshot({ path: `${outDir}/audit-least-privileged-390.png`, fullPage: true });
  output.leastPrivileged = { status: phase === 'after' ? 'PASS' : 'RECORDED', ...least };
  await leastContext.close();

  // Unauthenticated AUTH state: the page redirects to login and returns here.
  const anonymousContext = await browser.newContext();
  const anonymousPage = await anonymousContext.newPage();
  await anonymousPage.goto(`${base}/audit`);
  assert.match(new URL(anonymousPage.url()).pathname, /^\/login$/);
  assert.equal(new URL(anonymousPage.url()).searchParams.get('returnTo'), '/audit');
  output.unauthenticated = { status: 'PASS', finalUrl: anonymousPage.url() };
  await anonymousContext.close();

  // Provider outage is not an empty register and not a zero count.
  await page.goto(`${base}/audit`, { waitUntil: 'networkidle' });
  await pool.query('ALTER TABLE qc.audit_events RENAME TO ca_p_audit_fault');
  try {
    await page.goto(`${base}/audit`, { waitUntil: 'networkidle' });
    const outage = await page.evaluate(() => {
      const main = document.querySelector('#main-content');
      return {
        text: main?.innerText.replace(/\s+/g, ' ').trim().slice(0, 800) ?? '',
        unavailable: main?.querySelectorAll('.unavailable').length ?? 0,
        rows: main?.querySelectorAll('tbody tr').length ?? 0,
        count: main?.querySelectorAll('.result-count').length ?? 0,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    assert.equal(outage.unavailable, 1);
    assert.equal(outage.rows, 0);
    assert.equal(outage.count, 0);
    if (phase === 'after') assert.equal(outage.overflow, 0);
    await page.screenshot({ path: `${outDir}/audit-provider-unavailable-390.png`, fullPage: true });
    output.providerUnavailable = { status: phase === 'after' ? 'PASS' : 'RECORDED', ...outage };
  } finally {
    await pool.query('ALTER TABLE qc.ca_p_audit_fault RENAME TO audit_events');
  }

  assert.equal(output.pageErrors.length, 0, 'page errors');
  output.state = 'PASS';
  await context.close();
} catch (error) {
  output.state = 'FAIL';
  output.error = error.message;
  process.exitCode = 1;
} finally {
  writeFileSync(`${outDir}/evidence.json`, JSON.stringify(output, null, 2) + '\n');
  await browser.close();
  await pool.end();
}
console.log(JSON.stringify({ state: output.state, checks: output.checks.length, error: output.error }));
