// Authenticated evidence for /change-requests against the disposable
// PostgreSQL 18 cluster. Local accounts and fixture rows only; never reads the
// repository .env or a provider URL.
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { Pool } from 'pg';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const phase = process.argv[2] === 'before' ? 'before' : 'after';
const base = process.env.CHANGE_EVIDENCE_BASE ?? 'http://127.0.0.1:4333';
const fixture = JSON.parse(readFileSync(resolve('.tmp/ca04-fixture-env.json'), 'utf8'));
const databaseUrl = `postgresql://qc_owner@localhost:55432/qc_disposable?sslmode=verify-full&sslrootcert=${resolve('.tmp/pg18/tls/ca.crt')}`;
const url = new URL(databaseUrl);
assert.equal(url.hostname, 'localhost');
assert.equal(url.port, '55432');
assert.equal(url.pathname, '/qc_disposable');

const outDir = `audit/CA-P-CHANGE-REQUESTS/${phase}`;
mkdirSync(outDir, { recursive: true });
const pool = new Pool({ connectionString: databaseUrl });
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const output = {
  task: 'CA-P-CHANGE-REQUESTS',
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
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      element.getBoundingClientRect().width > 0
    );
  });
  const undersized = interactive
    .map((element) => ({
      tag: element.tagName.toLowerCase(),
      text: (
        element.getAttribute('aria-label') ||
        element.textContent ||
        element.getAttribute('name') ||
        ''
      )
        .trim()
        .slice(0, 80),
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
  const clipped = [...main.querySelectorAll('th,td,code,.chip-value,.target-reference,.identifier')]
    .filter((element) => element.scrollWidth > element.clientWidth + 1)
    .map((element) => ({
      tag: element.tagName.toLowerCase(),
      text: (element.textContent ?? '').trim().slice(0, 60),
      scrollWidth: element.scrollWidth,
      clientWidth: element.clientWidth,
    }));
  const ellipsis = [...main.querySelectorAll('th,td,.target-reference,.identifier')]
    .filter((element) => getComputedStyle(element).textOverflow === 'ellipsis')
    .map((element) => (element.textContent ?? '').trim().slice(0, 60));
  const topLevel = [...main.children].map((element) => ({
    tag: element.tagName.toLowerCase(),
    className: element.className,
  }));
  return {
    viewport: { width: window.innerWidth, height: window.innerHeight },
    globalOverflow: doc.scrollWidth - doc.clientWidth,
    mainOverflow: main.scrollWidth - main.clientWidth,
    topLevel,
    clipped,
    ellipsis,
    rows: main.querySelectorAll('tbody tr').length,
    countText: main.querySelector('.result-count')?.textContent?.trim() ?? null,
    appliedChips: main.querySelectorAll('[data-applied-filters] a[aria-label^="Remove filter"]').length,
    emptyState: (() => {
      const region = main.querySelector('.empty, .state-notice, .unavailable');
      return region ? region.textContent?.replace(/\s+/g, ' ').trim().slice(0, 300) : null;
    })(),
    table: tableRegion
      ? {
          role: tableRegion.getAttribute('role'),
          label: tableRegion.getAttribute('aria-label'),
          tabindex: tableRegion.getAttribute('tabindex'),
          scrollWidth: tableRegion.scrollWidth,
          clientWidth: tableRegion.clientWidth,
        }
      : null,
    text: main.innerText.replace(/\s+/g, ' ').trim().slice(0, 1400),
    undersized,
    smallText,
    controlCount: interactive.length,
  };
}

async function capture(page, width, label, path = '/change-requests') {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
  const metrics = await page.evaluate(metricScript);
  assert.ok(metrics, `${label}: main missing`);
  if (phase === 'after') {
    assert.equal(metrics.globalOverflow, 0, `${label}@${width}: global overflow`);
    assert.equal(metrics.undersized.length, 0, `${label}@${width}: control below 44px`);
    assert.equal(metrics.smallText.length, 0, `${label}@${width}: text below 12px`);
    assert.equal(metrics.clipped.length, 0, `${label}@${width}: clipped content`);
    assert.equal(metrics.ellipsis.length, 0, `${label}@${width}: ellipsis clipping`);
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
    authorized[width] = await capture(page, width, 'change-authorized');
  }
  const stored = await pool.query('select count(*)::int as count from qc.change_requests');
  output.fixtureRowCount = stored.rows[0].count;
  assert.equal(authorized[1440].rows, Math.min(25, stored.rows[0].count));

  const filtered = await capture(page, 390, 'change-filtered', '/change-requests?state=UNDER_REVIEW');
  const filteredType = await capture(page, 390, 'change-filtered-target', '/change-requests?targetType=DOCUMENT');
  const filteredEmpty = await capture(
    page,
    390,
    'change-filtered-empty',
    '/change-requests?targetType=NO_SUCH_TARGET',
  );
  const secondPage = await capture(page, 1440, 'change-page-two', '/change-requests?page=2');
  const longRecord = await capture(page, 320, 'change-long-record', '/change-requests');
  output.filterStates = {
    filteredRows: filtered.rows,
    filteredTypeRows: filteredType.rows,
    filteredEmptyRows: filteredEmpty.rows,
    filteredChips: filtered.appliedChips,
    filteredTypeChips: filteredType.appliedChips,
    filteredEmptyChips: filteredEmpty.appliedChips,
    secondPageRows: secondPage.rows,
    secondPageCount: secondPage.countText,
    longRecordRows: longRecord.rows,
    longRecordClipped: longRecord.clipped.length,
  };

  // Reachable actions: row record, create form, pager, chip removal, clear.
  await page.goto(`${base}/change-requests`, { waitUntil: 'networkidle' });
  const firstRecordHref = await page.locator('tbody th a').first().getAttribute('href');
  assert.ok(firstRecordHref?.startsWith('/change-requests/'));
  const recordResponse = await page.goto(`${base}${firstRecordHref}`, { waitUntil: 'networkidle' });
  assert.equal(recordResponse?.status(), 200);
  assert.ok(new URL(page.url()).pathname.startsWith('/change-requests/'));
  const recordHeading = await page.locator('#main-content h1').first().textContent();

  await page.goto(`${base}/change-requests`, { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: 'New change request', exact: true }).click();
  await page.waitForURL(`${base}/change-requests/new`);
  assert.equal(await page.locator('form[data-action="change-requests.createForDocumentVersion"]').count(), 1);

  await page.goto(`${base}/change-requests`, { waitUntil: 'networkidle' });
  await page.locator('.pagination a[rel="next"]').click();
  await page.waitForURL(/[?&]page=2/);
  const nextPageRows = await page.locator('tbody tr').count();

  await page.goto(`${base}/change-requests?state=UNDER_REVIEW`, { waitUntil: 'networkidle' });
  const chipCount = await page.locator('[data-applied-filters] a[aria-label^="Remove filter"]').count();
  if (chipCount > 0) {
    await page.locator('[data-applied-filters] a[aria-label^="Remove filter"]').first().click();
    await page.waitForURL(`${base}/change-requests`);
  }
  const clearedRows = await page.locator('tbody tr').count();
  output.navigation = {
    status: phase === 'after' ? 'PASS' : 'RECORDED',
    recordHref: firstRecordHref,
    recordHeading: recordHeading?.trim() ?? null,
    createForm: true,
    nextPageRows,
    chipCount,
    clearedRows,
  };

  // Keyboard focus: filter control, applied-filter chip, table region, pager.
  await page.setViewportSize({ width: 1024, height: 1000 });
  output.focus = [];
  await page.goto(`${base}/change-requests`, { waitUntil: 'networkidle' });
  for (const [label, selector] of [
    ['filter-input', '#main-content form[role="search"] input'],
    ['table-region', '[role="region"][aria-label]'],
    ['pager-link', '.pagination a'],
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
  await page.goto(`${base}/change-requests?state=UNDER_REVIEW`, { waitUntil: 'networkidle' });
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

  // Keyboard tab walk from the first filter control through the register.
  await page.goto(`${base}/change-requests`, { waitUntil: 'networkidle' });
  await page.locator('#targetType').focus();
  output.tabWalk = [];
  for (let index = 0; index < 14; index += 1) {
    await page.keyboard.press('Tab');
    const stop = await page.evaluate(() => {
      const element = document.activeElement;
      if (!(element instanceof HTMLElement)) return null;
      const style = getComputedStyle(element);
      return {
        tag: element.tagName.toLowerCase(),
        text: (element.getAttribute('aria-label') || element.textContent || '').trim().slice(0, 60),
        inTable: Boolean(element.closest('tbody')),
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
      };
    });
    if (stop) output.tabWalk.push(stop);
  }
  if (phase === 'after') {
    assert.ok(
      output.tabWalk.some((stop) => stop.inTable),
      'tab walk must reach a table row link',
    );
    for (const stop of output.tabWalk) {
      assert.notEqual(stop.outlineStyle, 'none', `tab walk ${stop.text}: no focus outline`);
      assert.notEqual(stop.outlineWidth, '0px', `tab walk ${stop.text}: zero focus outline`);
    }
  }

  // Measured contrast on final rendered colors.
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
        ['result count', '.result-count'],
        ['table header', 'thead th'],
        ['change number', 'tbody th a'],
        ['target label', 'tbody td'],
        ['target reference', '.target-reference'],
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
  output.contrast = await contrastFor('/change-requests?state=UNDER_REVIEW');
  if (phase === 'after') {
    for (const entry of output.contrast) {
      assert.ok(entry.ratio >= 4.5, `${entry.label}: contrast ${entry.ratio}`);
    }
  }

  // Media preferences.
  output.media = [];
  for (const media of [{ reducedMotion: 'reduce' }, { forcedColors: 'active' }]) {
    await page.emulateMedia(media);
    await page.setViewportSize({ width: 320, height: 1000 });
    await page.goto(`${base}/change-requests`, { waitUntil: 'networkidle' });
    const value = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }));
    if (phase === 'after') assert.equal(value.overflow, 0, `${JSON.stringify(media)}: overflow`);
    output.media.push({ media, status: phase === 'after' ? 'PASS' : 'RECORDED', ...value });
  }
  await page.emulateMedia({ reducedMotion: 'no-preference', forcedColors: 'none' });

  // No JavaScript: the same GET form, chips and pager remain native links.
  const nativeContext = await browser.newContext({ javaScriptEnabled: false });
  const nativePage = await nativeContext.newPage();
  await login(nativePage, 'verify-admin', fixture.QC_VERIFY_ADMIN_PASSWORD);
  await nativePage.goto(`${base}/change-requests`);
  await nativePage.locator('#targetType').fill('DOCUMENT');
  await nativePage
    .locator('form[role="search"] button[type="submit"], form[aria-label="Change request filters"] button[type="submit"]')
    .first()
    .click();
  await nativePage.waitForURL(/targetType=DOCUMENT/);
  const nativeFilteredRows = await nativePage.locator('tbody tr').count();
  assert.equal(nativeFilteredRows, 1);
  if (phase === 'after') {
    await nativePage.locator('[data-applied-filters] .clear-filters').click();
    await nativePage.waitForURL(`${base}/change-requests`);
  } else {
    await nativePage.goto(`${base}/change-requests`);
  }
  output.noJs = {
    status: 'PASS',
    rowsAfterFilter: nativeFilteredRows,
    rowsAfterClear: await nativePage.locator('tbody tr').count(),
  };
  await nativeContext.close();

  // Read-denied persona: verify-manager holds PERM-CHG-VIEW from its role but
  // only a TEAM scope, which the repository's paging read does not accept.
  const deniedContext = await browser.newContext({
    viewport: { width: 390, height: 1000 },
    locale: 'en-GB',
    timezoneId: 'Asia/Riyadh',
  });
  const deniedPage = await deniedContext.newPage();
  deniedPage.on('pageerror', (error) => output.pageErrors.push(error.message));
  await login(deniedPage, 'verify-manager', fixture.QC_VERIFY_MANAGER_PASSWORD);
  const deniedResponse = await deniedPage.goto(`${base}/change-requests`, { waitUntil: 'networkidle' });
  const denied = await deniedPage.evaluate(() => {
    const main = document.querySelector('#main-content');
    return {
      text: main?.innerText.replace(/\s+/g, ' ').trim().slice(0, 800) ?? '',
      rows: main?.querySelectorAll('tbody tr').length ?? 0,
      table: main?.querySelectorAll('table').length ?? 0,
      count: main?.querySelector('.result-count')?.textContent?.trim() ?? null,
      empty: main?.querySelectorAll('.empty').length ?? 0,
      unavailable: main?.querySelectorAll('.unavailable').length ?? 0,
      mutationForms: main?.querySelectorAll('form[method="post"]').length ?? 0,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  assert.equal(deniedResponse?.status(), 200);
  assert.equal(denied.rows, 0, 'TEAM-only change-request scope must not read rows');
  assert.equal(denied.table, 0, 'denied read must not render a table');
  assert.equal(denied.unavailable, 0, 'denied read is not a provider outage');
  assert.equal(denied.mutationForms, 0, 'register must expose no mutation form');
  if (phase === 'after') assert.equal(denied.overflow, 0);
  await deniedPage.screenshot({ path: `${outDir}/change-read-denied-390.png`, fullPage: true });
  output.readDenied = { status: phase === 'after' ? 'PASS' : 'RECORDED', ...denied };
  await deniedContext.close();

  // Authorized least-role persona: no role-level change-request grant, but the
  // universal operational read set adds PERM-CHG-VIEW with GLOBAL scope.
  const leastContext = await browser.newContext({
    viewport: { width: 390, height: 1000 },
    locale: 'en-GB',
    timezoneId: 'Asia/Riyadh',
  });
  const leastPage = await leastContext.newPage();
  leastPage.on('pageerror', (error) => output.pageErrors.push(error.message));
  await login(leastPage, 'verify-least', fixture.QC_VERIFY_LEAST_PASSWORD);
  await leastPage.goto(`${base}/change-requests`, { waitUntil: 'networkidle' });
  const least = await leastPage.evaluate(() => {
    const main = document.querySelector('#main-content');
    return {
      rows: main?.querySelectorAll('tbody tr').length ?? 0,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      mutationForms: main?.querySelectorAll('form[method="post"]').length ?? 0,
    };
  });
  assert.equal(least.rows, Math.min(25, stored.rows[0].count));
  assert.equal(least.mutationForms, 0);
  if (phase === 'after') assert.equal(least.overflow, 0);
  output.leastPrivileged = { status: phase === 'after' ? 'PASS' : 'RECORDED', ...least };
  await leastContext.close();

  // Unauthenticated AUTH state.
  const anonymousContext = await browser.newContext();
  const anonymousPage = await anonymousContext.newPage();
  await anonymousPage.goto(`${base}/change-requests`);
  assert.match(new URL(anonymousPage.url()).pathname, /^\/login$/);
  assert.equal(new URL(anonymousPage.url()).searchParams.get('returnTo'), '/change-requests');
  output.unauthenticated = { status: 'PASS', finalUrl: anonymousPage.url() };
  await anonymousContext.close();

  // Provider outage is not an empty register and not a zero count.
  await page.goto(`${base}/change-requests`, { waitUntil: 'networkidle' });
  await pool.query('ALTER TABLE qc.change_requests RENAME TO ca_p_change_requests_fault');
  try {
    await page.goto(`${base}/change-requests`, { waitUntil: 'networkidle' });
    const outage = await page.evaluate(() => {
      const main = document.querySelector('#main-content');
      return {
        text: main?.innerText.replace(/\s+/g, ' ').trim().slice(0, 800) ?? '',
        unavailable: main?.querySelectorAll('.unavailable').length ?? 0,
        rows: main?.querySelectorAll('tbody tr').length ?? 0,
        count: main?.querySelector('.result-count')?.textContent?.trim() ?? null,
        pager: main?.querySelectorAll('.pagination').length ?? 0,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    assert.equal(outage.unavailable, 1);
    assert.equal(outage.rows, 0);
    assert.equal(outage.count, null);
    assert.equal(outage.pager, 0);
    if (phase === 'after') assert.equal(outage.overflow, 0);
    await page.screenshot({ path: `${outDir}/change-provider-unavailable-390.png`, fullPage: true });
    output.providerUnavailable = { status: phase === 'after' ? 'PASS' : 'RECORDED', ...outage };
  } finally {
    await pool.query('ALTER TABLE qc.ca_p_change_requests_fault RENAME TO change_requests');
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
