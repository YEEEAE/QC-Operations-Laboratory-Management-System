/**
 * QC-100-FINAL-004 Task 7 — pure support helpers for the automated UAT scenario
 * suite. Side-effect free so the decision logic can be unit tested independently
 * from the HTTP harness that drives the running application.
 */

export type ScenarioStatus = 'PASS' | 'FAIL' | 'NOT RUN' | 'BLOCKED';

export interface ActionOutcome {
  status: number;
  ok: boolean;
  errorCode?: string;
  errorMessage?: string;
  body: unknown;
}

/**
 * - `DENIED`: refused for an authentication/authorization reason.
 * - `EXECUTED`: the call succeeded — a defect for a negative scenario.
 * - `INCONCLUSIVE`: refused, but before authorization (input validation or a
 *   missing record), so it proves nothing about authority and must never be
 *   reported as DENIED.
 */
export type ProbeVerdict = 'DENIED' | 'EXECUTED' | 'INCONCLUSIVE';

export interface ProbeResult {
  surface: string;
  verdict: ProbeVerdict;
  errorCode: string | null;
  httpStatus: number;
}

export function classifyProbe(outcome: ActionOutcome): ProbeVerdict {
  if (outcome.ok) return 'EXECUTED';
  if (outcome.status === 401 || outcome.status === 403) return 'DENIED';
  if (outcome.errorCode === 'UNAUTHORIZED' || outcome.errorCode === 'FORBIDDEN') return 'DENIED';
  return 'INCONCLUSIVE';
}

export function summarizeProbes(probes: readonly ProbeResult[]): {
  status: ScenarioStatus;
  detail: string;
} {
  const executed = probes.filter((probe) => probe.verdict === 'EXECUTED');
  const inconclusive = probes.filter((probe) => probe.verdict === 'INCONCLUSIVE');
  const denied = probes.filter((probe) => probe.verdict === 'DENIED');
  const table = probes
    .map((probe) => `${probe.surface}=${probe.verdict}(${probe.errorCode ?? probe.httpStatus})`)
    .join(', ');
  if (executed.length > 0) {
    return {
      status: 'FAIL',
      detail: `executed without authority: ${executed.map((p) => p.surface).join(', ')} — ${table}`,
    };
  }
  if (inconclusive.length > 0) {
    return {
      status: 'NOT RUN',
      detail: `${denied.length} auth-denied, ${inconclusive.length} refused before authorization (no proof): ${table}`,
    };
  }
  return {
    status: 'PASS',
    detail: `all ${denied.length} surfaces refused for auth reasons: ${table}`,
  };
}

/**
 * Astro actions serialize non-primitive return values with devalue:
 * `[{ field: index }, value1, value2, …]` where `-1` means undefined and
 * `["Date", iso]` / `["BigInt", "1"]` are typed wrappers.
 */
export function devalueField(body: unknown, field: string): unknown {
  if (!Array.isArray(body) || body.length < 2) return undefined;
  const shape = body[0];
  if (typeof shape !== 'object' || shape === null) return undefined;
  const index = (shape as Record<string, number>)[field];
  if (typeof index !== 'number' || index < 1) return undefined;
  return body[index];
}

/** Reads a record id from either a plain JSON body or a devalue payload. */
export function recordId(outcome: ActionOutcome): string | undefined {
  const direct = (outcome.body as { id?: unknown } | undefined)?.id;
  if (typeof direct === 'string') return direct;
  const serialized = devalueField(outcome.body, 'id');
  return typeof serialized === 'string' ? serialized : undefined;
}

/** Short, non-secret excerpt of an action response for failure evidence. */
export function bodyExcerpt(outcome: ActionOutcome): string {
  const text = typeof outcome.body === 'string' ? outcome.body : JSON.stringify(outcome.body);
  return text.length > 160 ? `${text.slice(0, 160)}…` : text;
}

/**
 * Creation surfaces that exist as pages in this codebase. Availability is
 * asserted per persona; per-type draft payloads are only automated for the
 * receiver surface today, and everything else is reported NOT RUN rather than
 * assumed.
 */
export const CREATE_ROUTES = [
  '/quarantine/receiving/new',
  '/laboratory/tests/new',
  '/quality/ncr/new',
  '/quality/capa/new',
  '/quality/findings/new',
  '/change-requests/new',
  '/documents/new',
  '/reject-reports/new',
  '/tasks/new',
  '/assets/equipment/new',
  '/assets/calibrations/new',
  '/assets/maintenance/new',
] as const;

/** Admin surface: must stay unreachable for the QC data-entry personas. */
export const ADMIN_CREATE_ROUTE = '/admin/users/new';

export function createReceivingPayload(suffix: string) {
  return {
    receivingNo: `UAT-SCN-RCV-${suffix}`,
    supplier: 'UAT Automated Supplier',
    docNo: `UAT-DOC-${suffix}`,
    itemCode: `UAT-ITEM-${suffix}`,
    description: 'Automated UAT scenario item',
    lot: `UAT-LOT-${suffix}`,
    qty: '7',
    receivingDate: '2026-09-19',
  };
}

/** Capability sets must be identical across the three QC data-entry personas. */
export function capabilitySetsEqual(
  observed: ReadonlyArray<{ persona: string; statuses: ReadonlyArray<number> }>,
): boolean {
  if (observed.length < 2) return false;
  const [first, ...rest] = observed;
  return rest.every(
    (entry) =>
      entry.statuses.length === first.statuses.length &&
      entry.statuses.every((status, index) => status === first.statuses[index]),
  );
}
