/**
 * QC-100-FINAL-007 — disposable-environment login + web-vitals capture.
 * Logs in as synthetic `perf-measure` via the real login form against the
 * LOCAL measurement server only, persists the session cookie to
 * .tmp/perf007-cookie.txt (0600, gitignored scratch), then measures
 * FCP/LCP/INP/CLS proxies + transfer/decoded bytes per route.
 * Secrets are never printed.
 */
import { readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { chromium } from '@playwright/test';

/* global URL, console, performance, process, window */

const baseUrl = process.env.QC_PERF_BASE_URL ?? 'http://127.0.0.1:4321';
if (!['localhost', '127.0.0.1'].includes(new URL(baseUrl).hostname)) {
  throw new Error('Refusing: QC_PERF_BASE_URL must be a local measurement server.');
}
const routes = (
  process.env.QC_PERF_VITALS_ROUTES ??
  '/dashboard,/tasks,/quarantine,/reject-reports,/reports,/laboratory,/notifications,/audit'
)
  .split(',')
  .map((r) => r.trim())
  .filter(Boolean);
const loginOnly = process.env.QC_PERF_LOGIN_ONLY === 'true';

const { loginIdentity, password } = JSON.parse(readFileSync('.tmp/perf-credentials.json', 'utf8'));
const browser = await chromium.launch();
const context = await browser.newContext({ baseURL: baseUrl, ignoreHTTPSErrors: true });
const page = await context.newPage();

// Intercept the login action response to persist the session cookie value
// for the HTTP harness (the browser itself stores the Secure __Host- cookie
// fine on localhost; the file is 0600 gitignored scratch).
await context.route('**/_actions/login', async (route) => {
  const response = await route.fetch();
  const setCookie = response.headers()['set-cookie'] ?? '';
  const match = /(__Host-qc_session)=([^;]+)/.exec(setCookie);
  if (match) {
    writeFileSync('.tmp/perf007-cookie.txt', `${match[1]}=${match[2]}\n`, { mode: 0o600 });
    chmodSync('.tmp/perf007-cookie.txt', 0o600);
  }
  await route.fulfill({ response });
});

await page.goto('/login', { waitUntil: 'domcontentloaded' });
await page.fill('input[name="loginIdentity"]', loginIdentity);
await page.fill('input[name="password"]', password);
await page.click('button[type="submit"]');
await page.waitForTimeout(3000);
if (new URL(page.url()).pathname === '/login') {
  throw new Error('Login failed: still on /login after submit.');
}
let cookies = await context.cookies(baseUrl);
if (!cookies.some((c) => c.name.includes('qc_session'))) {
  // The action endpoint may set the cookie on the bare URL scope; query all.
  cookies = await context.cookies();
}
console.error(`[debug] cookies after login: ${cookies.map((c) => c.name).join(',') || '(none)'}`);
if (!cookies.some((c) => c.name.includes('qc_session'))) {
  throw new Error('Session cookie missing after login.');
}
// Persist for the HTTP harness.
const session = cookies.find((c) => c.name.includes('qc_session'));
writeFileSync('.tmp/perf007-cookie.txt', `${session.name}=${session.value}\n`, { mode: 0o600 });
chmodSync('.tmp/perf007-cookie.txt', 0o600);

if (loginOnly) {
  console.log(JSON.stringify({ ok: true, route: new URL(page.url()).pathname }));
  await browser.close();
  process.exit(0);
}

const vitalsScript = `
window.__vitals = { fcp: null, lcp: null, inp: [], cls: 0 };
try {
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__vitals.fcp = e.startTime; }).observe({ type: 'paint', buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__vitals.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__vitals.inp.push(e.duration); }).observe({ type: 'event', buffered: true, durationThreshold: 16 });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__vitals.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
} catch {}
`;

const results = [];
for (const route of routes) {
  const out = { route, cold: null, warm: null, error: null };
  for (const phase of ['cold', 'warm']) {
    try {
      const p = phase === 'cold' ? await context.newPage() : page;
      await p.addInitScript(vitalsScript);
      const started = Date.now();
      await p.goto(route, { waitUntil: 'networkidle', timeout: 30000 });
      await p.waitForTimeout(phase === 'cold' ? 1500 : 800);
      const data = await p.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        const resources = performance.getEntriesByType('resource');
        let transfer = 0,
          decoded = 0,
          jsTransfer = 0,
          jsDecoded = 0,
          wasmTransfer = 0;
        for (const r of resources) {
          transfer += r.transferSize || 0;
          decoded += r.decodedBodySize || 0;
          if (r.name.endsWith('.js')) {
            jsTransfer += r.transferSize || 0;
            jsDecoded += r.decodedBodySize || 0;
          }
          if (r.name.endsWith('.wasm')) wasmTransfer += r.transferSize || 0;
        }
        const v = window.__vitals ?? {};
        return {
          ttfbMs: nav ? Math.round(nav.responseStart) : null,
          domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
          loadEventMs: nav ? Math.round(nav.loadEventEnd) : null,
          documentTransferBytes: nav?.transferSize ?? null,
          documentDecodedBytes: nav?.decodedBodySize ?? null,
          resourceCount: resources.length,
          transferBytes: transfer,
          decodedBytes: decoded,
          jsTransferBytes: jsTransfer,
          jsDecodedBytes: jsDecoded,
          wasmTransferBytes: wasmTransfer,
          fcpMs: v.fcp != null ? Math.round(v.fcp) : null,
          lcpMs: v.lcp != null ? Math.round(v.lcp) : null,
          inpEventCount: v.inp?.length ?? 0,
          inpMaxMs: v.inp?.length ? Math.round(Math.max(...v.inp)) : null,
          cls: v.cls != null ? Number(v.cls.toFixed(4)) : null,
        };
      });
      data.wallMs = Date.now() - started;
      out[phase] = data;
      if (phase === 'cold') await p.close();
    } catch (error) {
      out.error = error instanceof Error ? error.message.split('\n')[0] : 'unknown';
    }
  }
  results.push(out);
}

console.log(
  JSON.stringify(
    { measuredAt: new Date().toISOString(), baseUrl, identity: loginIdentity, routes: results },
    null,
    2,
  ),
);
await browser.close();
