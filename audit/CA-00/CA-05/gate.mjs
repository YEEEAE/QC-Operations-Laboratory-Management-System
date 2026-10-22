// CA-05 pilot gate. Local disposable PG18 + authenticated Chromium only.
// Credentials arrive from audit/CA-04/local-run.mjs allowlist; no .env, no
// provider connection, no production write. Evidence is JSON + screenshots.
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const BASE = 'http://127.0.0.1:4331';
const PHASE = process.argv[2] ?? 'before';
const OUT = `audit/CA-05/${PHASE}`;
mkdirSync(`${OUT}/screens`, { recursive: true });
const prepared = JSON.parse(readFileSync('audit/CA-05/prepared.json', 'utf8'));
const RECEIVING = new URL(prepared.receivingUrl).pathname;
const PAGES = [
  { id: 'dashboard', path: '/dashboard' },
  { id: 'tasks', path: '/tasks' },
  { id: 'tasks-new', path: '/tasks/new' },
  { id: 'receiving-detail', path: RECEIVING },
  { id: 'capa-new', path: '/quality/capa/new' },
];
const VIEWPORTS = [390, 768, 1440, 320, 1024];
const out = {
  phase: PHASE,
  candidate: process.env.CA05_CANDIDATE ?? 'working-tree',
  node: process.version,
  receiving: RECEIVING,
  pages: {},
  errors: [],
  status: 'PARTIAL',
};

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  locale: 'en-GB',
  timezoneId: 'Asia/Riyadh',
});
const page = await context.newPage();
page.on('pageerror', (error) => out.errors.push({ type: 'pageerror', message: error.message }));
page.on('console', (message) => {
  if (message.type() === 'error') out.errors.push({ type: 'console', message: message.text() });
});

async function login(identity, password) {
  await page.goto(`${BASE}/login`);
  await page.locator('#loginIdentity').fill(identity);
  await page.locator('#password').fill(password);
  await page.locator('#password').press('Enter');
  await page.waitForURL((url) => url.pathname === '/dashboard');
}

const sidebarProbe = () =>
  page.evaluate(() => {
    const side = document.querySelector('.app-sidebar');
    const rect = side.getBoundingClientRect();
    const rows = [...side.querySelectorAll('*')]
      .filter((el) => el.getClientRects().length > 0)
      .map((el) => {
        const own = [...el.childNodes]
          .filter((n) => n.nodeType === 3 && n.textContent.trim())
          .map((n) => n.textContent.trim())
          .join(' ');
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return {
          tag: el.tagName.toLowerCase(),
          text: own.slice(0, 90),
          ariaCurrent: el.getAttribute('aria-current'),
          href: el.getAttribute('href'),
          x: Math.round(r.x * 100) / 100,
          y: Math.round(r.y * 100) / 100,
          w: Math.round(r.width * 100) / 100,
          h: Math.round(r.height * 100) / 100,
          font: s.fontSize,
          color: s.color,
          background: s.backgroundColor,
        };
      });
    const links = [...side.querySelectorAll('a')].map((a) => {
      const r = a.getBoundingClientRect();
      return {
        text: (a.textContent ?? '').trim().replace(/\s+/g, ' '),
        href: a.getAttribute('href'),
        ariaCurrent: a.getAttribute('aria-current'),
        w: Math.round(r.width * 100) / 100,
        h: Math.round(r.height * 100) / 100,
        visible: a.getClientRects().length > 0,
      };
    });
    const style = getComputedStyle(side);
    return {
      rect: { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
      background: style.backgroundColor,
      color: style.color,
      font: style.fontFamily,
      linkCount: links.filter((link) => link.visible).length,
      links,
      rows,
    };
  });

const pageProbe = () =>
  page.evaluate(() => {
    const main = document.querySelector('#main-content');
    const visible = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
    const rect = (el) => el.getBoundingClientRect();
    const controls = [...main.querySelectorAll('a,button,summary,input,select,textarea')]
      .filter(visible)
      .map((el) => {
        const r = rect(el);
        return {
          tag: el.tagName.toLowerCase(),
          text: (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 70) || el.getAttribute('aria-label') || el.getAttribute('name') || '',
          w: Math.round(r.width * 100) / 100,
          h: Math.round(r.height * 100) / 100,
          href: el.getAttribute('href'),
        };
      });
    const textNodes = [...main.querySelectorAll('*')]
      .filter((el) => visible(el) && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()))
      .map((el) => {
        const s = getComputedStyle(el);
        return {
          tag: el.tagName.toLowerCase(),
          text: (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 90),
          size: parseFloat(s.fontSize),
          lineHeight: s.lineHeight,
          color: s.color,
          background: s.backgroundColor,
        };
      });
    const sizes = {};
    for (const item of textNodes) sizes[item.size] = (sizes[item.size] ?? 0) + 1;
    const rgb = (value) => {
      const m = (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
      return m.length === 3 ? m : null;
    };
    const lum = (c) => c.map((v) => {
      v /= 255;
      return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    }).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
    const ratio = (fg, bg) => {
      const a = rgb(fg); const b = rgb(bg);
      if (!a || !b) return null;
      const x = lum(a); const y = lum(b);
      return Math.round(((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)) * 100) / 100;
    };
    const effectiveBackground = (el) => {
      let node = el;
      while (node) {
        const s = getComputedStyle(node);
        const value = s.backgroundColor;
        if (value && value !== 'rgba(0, 0, 0, 0)' && value !== 'transparent') return value;
        node = node.parentElement;
      }
      return 'rgb(255, 255, 255)';
    };
    const contrastSelectors = ['h1', '.eyebrow', '.lede', '.state-card', '.state-card__muted', '.kpi-value', '.kpi-label', '.empty', 'th', 'td', 'a', 'button', '.start', '.applied-filters', '.badge', '.status'];
    const contrast = [];
    for (const selector of contrastSelectors) {
      const el = main.querySelector(selector) ?? document.querySelector(selector);
      if (!el || !visible(el)) continue;
      const s = getComputedStyle(el);
      const bg = effectiveBackground(el);
      contrast.push({ selector, color: s.color, background: bg, ratio: ratio(s.color, bg), size: parseFloat(s.fontSize) });
    }
    const rows = [...main.querySelectorAll('tbody tr')].filter(visible).map((tr) => (tr.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 140));
    const states = [...main.querySelectorAll('[class*="state"], [class*="status"], .badge')]
      .filter(visible)
      .map((el) => (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 120))
      .filter(Boolean);
    return {
      title: document.title,
      h1: main.querySelector('h1')?.textContent?.trim() ?? null,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      mainWidth: Math.round(rect(main).width),
      controls,
      smallTargets: controls.filter((c) => c.w < 44 || c.h < 44),
      text: textNodes,
      sizes,
      tinyText: textNodes.filter((t) => t.size < 12),
      contrast,
      rows,
      rowCount: rows.length,
      states: [...new Set(states)],
      forms: main.querySelectorAll('form').length,
      buttons: [...main.querySelectorAll('button')].filter(visible).map((b) => (b.textContent ?? '').trim()),
      links: [...main.querySelectorAll('a')].filter(visible).map((a) => ({ text: (a.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 70), href: a.getAttribute('href') })),
      sidebarHash: null,
    };
  });

try {
  await login('verify-employee', process.env.QC_VERIFY_EMPLOYEE_PASSWORD);
  out.login = 'PASS';

  for (const definition of PAGES) {
    const record = { id: definition.id, path: definition.path, viewports: [], axe: [], samples: [] };
    out.pages[definition.id] = record;
    for (const width of VIEWPORTS) {
      await page.setViewportSize({ width, height: 1000 });
      const response = await page.goto(`${BASE}${definition.path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#main-content');
      await page.waitForTimeout(120);
      const metrics = await pageProbe();
      const sidebar = await sidebarProbe();
      metrics.sidebarHash = createHash('sha256').update(JSON.stringify(sidebar)).digest('hex');
      metrics.sidebarRect = sidebar.rect;
      metrics.sidebarLinkCount = sidebar.linkCount;
      const axe = await new AxeBuilder({ page }).include('#main-content').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
      const violations = axe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, targets: v.nodes.slice(0, 3).map((n) => n.target.join(' ')) }));
      record.axe.push({ width, status: response?.status() ?? 0, violations });
      record.viewports.push({ width, status: response?.status() ?? 0, ...metrics });
      await page.screenshot({ path: `${OUT}/screens/${definition.id}-${width}.png`, fullPage: true });
    }

    // Render timing on the same data, warm page, three samples at 1440.
    await page.setViewportSize({ width: 1440, height: 1000 });
    for (let i = 0; i < 3; i += 1) {
      const started = Date.now();
      const response = await page.goto(`${BASE}${definition.path}`, { waitUntil: 'load' });
      const elapsed = Date.now() - started;
      const nav = await page.evaluate(() => {
        const entry = performance.getEntriesByType('navigation')[0];
        return entry ? {
          responseStart: Math.round(entry.responseStart),
          domContentLoaded: Math.round(entry.domContentLoadedEventEnd),
          load: Math.round(entry.loadEventEnd),
          transfer: entry.transferSize,
        } : null;
      });
      record.samples.push({ status: response?.status() ?? 0, elapsedMs: elapsed, ...nav });
    }
  }

  // Layout-equivalent zoom (CDP device metrics, not native browser UI zoom).
  out.zoom = [];
  for (const [label, width, dsf] of [['200%', 720, 2], ['400%', 360, 4]]) {
    const cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: dsf, mobile: false });
    for (const definition of PAGES) {
      await page.goto(`${BASE}${definition.path}`, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#main-content');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      out.zoom.push({ page: definition.id, label, cssWidth: width, dsf, overflow });
    }
    await cdp.send('Emulation.clearDeviceMetricsOverride');
  }

  // Native GET / form behavior without JavaScript.
  const native = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 1000 }, locale: 'en-GB' });
  await native.addCookies(await context.cookies());
  const np = await native.newPage();
  await np.goto(`${BASE}/tasks`);
  await np.locator('#q').fill('ca05-native-no-match');
  await np.locator('form[role="search"] button[type="submit"]').click();
  out.noJs = { tasksFilteredEmpty: /No tasks match/.test(await np.locator('body').innerText()) };
  await np.goto(`${BASE}${RECEIVING}`);
  out.noJs.receivingDetail = (await np.locator('#main-content').innerText()).includes('CA05-RCV-001');
  // Real native POST validation failure: a whitespace-only title passes the
  // browser constraint and is rejected by the server-side domain check.
  await np.goto(`${BASE}/tasks/new`);
  await np.locator('#taskNo').fill('CA05-VALID-002');
  await np.locator('#title').fill(' ');
  await np.locator('button[data-submit]').click();
  await np.waitForLoadState('domcontentloaded');
  const validationBody = await np.locator('#main-content').innerText().catch(() => '');
  out.noJs.taskValidation = {
    url: np.url(),
    stayedOnForm: /\/tasks\/new$/.test(new URL(np.url()).pathname),
    errorSummary: /Check the following fields|required|must not be blank|not be blank/i.test(validationBody),
    fieldErrors: await np.locator('.field-error').allTextContents(),
    invalidFields: await np.locator('[aria-invalid="true"]').count(),
    body: validationBody.replace(/\s+/g, ' ').slice(0, 400),
  };
  await np.screenshot({ path: `${OUT}/screens/tasks-new-native-validation.png`, fullPage: true }).catch(() => {});
  await native.close();

  // Server validation failure on task creation (real action, invalid domain values).
  await page.goto(`${BASE}/tasks/new`);
  await page.evaluate(() => {
    const form = document.querySelector('form[data-task-create]');
    form.noValidate = true;
    form.requestSubmit();
  });
  await page.waitForFunction(() => {
    const result = document.querySelector('[data-result]');
    return (result && result.textContent.trim().length > 0) || document.querySelectorAll('[aria-invalid="true"]').length > 0;
  }, null, { timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(200);
  out.taskValidation = {
    url: page.url(),
    resultText: (await page.locator('[data-result]').innerText().catch(() => '')).trim(),
    summaryText: (await page.locator('[role="alert"], .error-summary, .form-error-summary').first().innerText().catch(() => '')).trim().slice(0, 500),
    taskNoValue: await page.locator('#taskNo').inputValue(),
    invalidFields: await page.locator('[aria-invalid="true"]').count(),
    bodyText: (await page.locator('#main-content').innerText()).slice(0, 900),
  };
  await page.screenshot({ path: `${OUT}/screens/tasks-new-validation.png`, fullPage: true });

  // Guard controls: CAPA direct action denial with a real authenticated actor.
  await page.goto(`${BASE}/dashboard`);
  const actionPost = (name, data) => page.evaluate(async ({ name, data }) => {
    const response = await fetch(`/_actions/${name}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: location.origin },
      body: JSON.stringify(data),
    });
    return { status: response.status, body: (await response.text()).slice(0, 400) };
  }, { name, data });

  const capaBefore = await page.goto(`${BASE}/quality/capa`);
  out.capaGuard = await actionPost('capa.create', { ncrId: '00000000-0000-4000-8000-000000000001' });
  out.capaGuard.registerStatus = capaBefore?.status() ?? 0;
  assert.ok(out.capaGuard.status >= 400, 'CAPA create must be denied');

  // Guard control: release a real receiving record with an unauthorized actor.
  out.receivingGuard = await actionPost('quarantine.releaseReceiving', {
    id: new URL(prepared.receivingUrl).pathname.split('/').pop(),
    expectedVersion: '1',
  });
  assert.ok(out.receivingGuard.status >= 400, 'release must be denied for this actor');

  // Shared-shell permission matrix: admin / employee / least.
  out.sidebarMatrix = {};
  for (const [identity, password] of [
    ['verify-admin', process.env.QC_VERIFY_ADMIN_PASSWORD],
    ['verify-employee', process.env.QC_VERIFY_EMPLOYEE_PASSWORD],
    ['verify-least', process.env.QC_VERIFY_LEAST_PASSWORD],
  ]) {
    await context.clearCookies();
    await login(identity, password);
    await page.goto(`${BASE}/dashboard`, { waitUntil: 'domcontentloaded' });
    const probe = await sidebarProbe();
    out.sidebarMatrix[identity] = {
      linkCount: probe.linkCount,
      links: probe.links.map((link) => ({ text: link.text, href: link.href, h: link.h, visible: link.visible, ariaCurrent: link.ariaCurrent })).sort((a, b) => (a.href ?? '').localeCompare(b.href ?? '')),
      hash: createHash('sha256').update(JSON.stringify(probe)).digest('hex'),
      width: probe.rect.w,
      background: probe.background,
      color: probe.color,
    };
  }

  out.status = 'PASS';
} catch (error) {
  out.status = 'FAIL';
  out.error = error.message;
  out.stack = error.stack?.split('\n').slice(0, 6);
  process.exitCode = 1;
} finally {
  writeFileSync(`${OUT}/evidence.json`, JSON.stringify(out, null, 2));
  await browser.close();
}
console.log(JSON.stringify({ phase: PHASE, status: out.status, error: out.error }));
