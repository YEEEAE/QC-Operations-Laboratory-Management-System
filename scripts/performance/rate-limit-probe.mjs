/**
 * QC-100-FINAL-007 §4 — login rate-limit behavior probe (development env).
 * Local disposable server only. Uses wrong passwords against a disposable
 * identity so only THROTTLED/rate-limit outcomes are measured; no valid
 * credential is exercised and nothing is printed.
 * Prints one JSON document: per-policy outcome at N sequential attempts.
 */
const baseUrl = process.env.QC_PERF_BASE_URL ?? 'http://127.0.0.1:4321';
if (!['localhost', '127.0.0.1'].includes(new URL(baseUrl).hostname)) {
  throw new Error('Refusing: QC_PERF_BASE_URL must be local.');
}
const attempts = Number(process.env.QC_PERF_RL_ATTEMPTS ?? '12');

async function attempt(i) {
  const form = new URLSearchParams({
    loginIdentity: 'perf-rate-probe-nonexistent',
    password: `wrong-${i}`,
    returnTo: '/dashboard',
  });
  const res = await fetch(`${baseUrl}/_actions/login`, {
    method: 'POST',
    headers: { Origin: baseUrl, Referer: `${baseUrl}/login`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  const text = await res.text();
  return { status: res.status, bodyHead: text.slice(0, 80) };
}

const outcomes = [];
for (let i = 1; i <= attempts; i += 1) outcomes.push(await attempt(i));
const throttled = outcomes.filter((o) => o.status === 429 || o.bodyHead.includes('AUTH_RATE_LIMITED')).length;
console.log(
  JSON.stringify(
    { measuredAt: new Date().toISOString(), baseUrl, attempts, throttled, policyConfigured: process.env.RATE_LIMIT_LOGIN_MAX ?? '(unset → no limit in development)', outcomes },
    null,
    2,
  ),
);
