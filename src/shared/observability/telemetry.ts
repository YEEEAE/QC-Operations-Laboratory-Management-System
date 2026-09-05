import { AsyncLocalStorage } from 'node:async_hooks';
import { randomBytes } from 'node:crypto';

/**
 * Vendor-neutral telemetry abstraction (OBSERVABILITY-ARCHITECTURE §4/§5).
 * Default providers are no-ops: telemetry export failure must never fail a
 * controlled business transaction (§73/§74). An OpenTelemetry adapter can be
 * injected later without touching call sites.
 */

export interface CorrelationContext {
  requestId?: string;
  traceId?: string;
  spanId?: string;
}

export type TelemetryAttributeValue = string | number | boolean | undefined;
export type TelemetryAttributes = Record<string, TelemetryAttributeValue>;

export interface TelemetrySpan {
  readonly traceId: string;
  readonly spanId: string;
  setAttribute(name: string, value: string | number | boolean): void;
  recordException(error: unknown): void;
  end(): void;
}

export interface TelemetryTracer {
  startSpan(
    name: string,
    attributes?: TelemetryAttributes,
    parent?: { traceId?: string; spanId?: string },
  ): TelemetrySpan;
}

export interface TelemetryCounter {
  increment(delta?: number, attributes?: TelemetryAttributes): void;
}

export interface TelemetryMeter {
  createCounter(name: string): TelemetryCounter;
}

function hex(bytes: number): string {
  return randomBytes(bytes).toString('hex');
}

class NoopTelemetrySpan implements TelemetrySpan {
  readonly traceId = hex(16);
  readonly spanId = hex(8);
  setAttribute(): void {}
  recordException(): void {}
  end(): void {}
}

export class NoopTracer implements TelemetryTracer {
  startSpan(): TelemetrySpan {
    return new NoopTelemetrySpan();
  }
}

export class NoopMeter implements TelemetryMeter {
  createCounter(): TelemetryCounter {
    return { increment: () => undefined };
  }
}

const noopTracer = new NoopTracer();
const noopMeter = new NoopMeter();

let activeTracer: TelemetryTracer = noopTracer;
let activeMeter: TelemetryMeter = noopMeter;

export function setTelemetryProviders(tracer?: TelemetryTracer, meter?: TelemetryMeter): void {
  activeTracer = tracer ?? noopTracer;
  activeMeter = meter ?? noopMeter;
}

export function resetTelemetryProviders(): void {
  activeTracer = noopTracer;
  activeMeter = noopMeter;
}

export function getTelemetryTracer(): TelemetryTracer {
  return activeTracer;
}

export function getTelemetryMeter(): TelemetryMeter {
  return activeMeter;
}

/** OBSERVABILITY-ARCHITECTURE §24: metric labels must be bounded. */
export const METRIC_LABEL_ALLOWLIST = [
  'route_template',
  'http_method',
  'status_class',
  'domain',
  'operation',
  'error_family',
  'environment',
  'dependency',
  'outcome',
  'statement_kind',
] as const;

const MAX_LABEL_LENGTH = 128;

export function safeMetricAttributes(
  attributes: TelemetryAttributes | undefined,
): Record<string, string | number | boolean> {
  const safe: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(attributes ?? {})) {
    if (!(METRIC_LABEL_ALLOWLIST as readonly string[]).includes(key)) continue;
    if (value === undefined) continue;
    safe[key] = typeof value === 'string' ? value.slice(0, MAX_LABEL_LENGTH) : value;
  }
  return safe;
}

export function recordCounter(name: string, delta = 1, attributes?: TelemetryAttributes): void {
  try {
    activeMeter.createCounter(name).increment(delta, safeMetricAttributes(attributes));
  } catch {
    // telemetry failure must not propagate (§73)
  }
}

const correlationStorage = new AsyncLocalStorage<CorrelationContext>();

export function runWithCorrelation<T>(
  correlation: CorrelationContext,
  fn: () => Promise<T>,
): Promise<T> {
  return correlationStorage.run(correlation, fn);
}

export function currentCorrelation(): CorrelationContext | undefined {
  return correlationStorage.getStore();
}

export async function withSpan<T>(
  name: string,
  fn: (span: TelemetrySpan) => Promise<T>,
  attributes?: TelemetryAttributes,
): Promise<T> {
  const parent = correlationStorage.getStore();
  let span: TelemetrySpan;
  try {
    span = activeTracer.startSpan(
      name,
      attributes,
      parent?.traceId ? { traceId: parent.traceId, spanId: parent.spanId } : undefined,
    );
  } catch {
    return fn(new NoopTelemetrySpan());
  }
  return correlationStorage.run(
    {
      ...(parent?.requestId ? { requestId: parent.requestId } : {}),
      traceId: span.traceId,
      spanId: span.spanId,
    },
    async () => {
      try {
        const result = await fn(span);
        span.setAttribute('outcome', 'success');
        return result;
      } catch (error) {
        span.setAttribute('outcome', 'error');
        try {
          span.recordException(error);
        } catch {
          // telemetry failure must not propagate
        }
        throw error;
      } finally {
        try {
          span.end();
        } catch {
          // telemetry failure must not propagate
        }
      }
    },
  );
}

/**
 * OBSERVABILITY-ARCHITECTURE §25: HTTP metrics use a normalized route template
 * (e.g. /quarantine/inspections/:inspectionId/review), never the raw URL.
 */
export function normalizeRouteTemplate(pathname: string): string {
  const path = pathname.split(/[?#]/)[0] ?? '';
  const segments = path.split('/').filter((segment) => segment.length > 0);
  const normalized = segments.map((segment) => {
    if (UUID_LIKE.test(segment) || BUSINESS_ID_LIKE.test(segment) || IDENTIFIER_LIKE.test(segment))
      return ':id';
    return segment;
  });
  return `/${normalized.join('/')}`;
}

const UUID_LIKE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** Business identifiers like TSK-000123 / DOC-0184. */
const BUSINESS_ID_LIKE = /^[A-Z][A-Z0-9]*-\d+$/;
/** Opaque technical ids: long mixed segments that contain a digit. */
const IDENTIFIER_LIKE = /^(?=.*\d)[A-Za-z0-9_-]{12,}$/;
