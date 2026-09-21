import { uuidv7 } from '../id/uuid.js';
import type { OutboxRepository } from '../outbox/outbox-repository.js';

/** Product Analytics is optional UX telemetry, never business/audit evidence. */
export type ProductAnalyticsOutcome =
  'started' | 'completed' | 'failed' | 'abandoned' | 'unavailable';

export type ProductAnalyticsValue = string | number | boolean;

export interface ProductAnalyticsEvent {
  name: string;
  occurredAt: string;
  environment: 'test' | 'staging' | 'production';
  routeTemplate?: string;
  domain?: string;
  operation?: string;
  outcome?: ProductAnalyticsOutcome;
  attributes: Record<string, ProductAnalyticsValue>;
}

export interface ProductAnalyticsTracker {
  track(event: ProductAnalyticsEvent): Promise<void>;
}

const EVENT_NAMES = new Set([
  'search.submitted',
  'search.zero_result',
  'form.validation_failed',
  'form.validation_recovered',
  'mutation.submit_attempted',
  'mutation.duplicate_prevented',
  'mutation.accepted',
  'error.presented',
  'error.recovery_started',
  'error.recovered',
  'feature.entered',
  'feature.completed',
  'responsive.issue_detected',
  'responsive.task_completed',
  'performance.page_timing',
  'performance.action_timing',
]);

const ATTRIBUTE_NAMES = new Set([
  'search_surface',
  'query_length_bucket',
  'result_count_bucket',
  'resolution',
  'duration_bucket',
  'filter_count_bucket',
  'suggestion_shown',
  'suggestion_used',
  'form_key',
  'field_group',
  'error_family',
  'error_code_family',
  'attempt_index_bucket',
  'recovery_outcome',
  'submit_outcome',
  'input_method',
  'operation',
  'route_template',
  'workflow_family',
  'step_key',
  'state_before',
  'state_after',
  'completion_outcome',
  'recovery_action',
  'request_reference_present',
  'feature_key',
  'domain',
  'device_class',
  'viewport_bucket',
  'orientation',
  'issue_family',
  'resource_class',
  'connection_class',
  'metric_name',
  'metric_bucket',
  'status_class',
]);

const MAX_ATTRIBUTES = 4;

const SAFE_SEARCH_VALUES: Record<string, ReadonlySet<string>> = {
  search_surface: new Set(['global']),
  query_length_bucket: new Set(['0-3', '4-20', '21-200']),
  result_count_bucket: new Set(['0', '1-9', '10+']),
  resolution: new Set(['unresolved', 'results_available']),
  form_key: new Set(['global-search']),
  field_group: new Set(['query']),
  error_family: new Set(['invalid_query']),
};

const SAFE_ROOT_VALUES = {
  domain: new Set(['search']),
  operation: new Set(['search']),
} as const;

function safeValue(name: string, value: ProductAnalyticsValue): ProductAnalyticsValue | undefined {
  if (typeof value === 'string') {
    if (!SAFE_SEARCH_VALUES[name]?.has(value)) return undefined;
    return value;
  }
  return undefined;
}

export function sanitizeProductAnalyticsEvent(
  event: ProductAnalyticsEvent,
): ProductAnalyticsEvent | undefined {
  if (!EVENT_NAMES.has(event.name)) return undefined;
  if (
    !Number.isFinite(Date.parse(event.occurredAt)) ||
    !['test', 'staging', 'production'].includes(event.environment) ||
    (event.outcome !== undefined &&
      !['started', 'completed', 'failed', 'abandoned', 'unavailable'].includes(event.outcome))
  ) {
    return undefined;
  }
  const attributes: Record<string, ProductAnalyticsValue> = {};
  for (const [name, value] of Object.entries(event.attributes)) {
    if (
      !ATTRIBUTE_NAMES.has(name) ||
      !Object.hasOwn(SAFE_SEARCH_VALUES, name) ||
      Object.hasOwn(attributes, name)
    )
      continue;
    const safe = safeValue(name, value);
    if (safe !== undefined) attributes[name] = safe;
    if (Object.keys(attributes).length >= MAX_ATTRIBUTES) break;
  }
  return {
    name: event.name,
    occurredAt: event.occurredAt,
    environment: event.environment,
    ...(event.routeTemplate &&
    /^\/(?:[a-z][a-z0-9-]*)(?:\/[a-z][a-z0-9-]*)*$/.test(event.routeTemplate)
      ? { routeTemplate: event.routeTemplate }
      : {}),
    ...(event.domain && SAFE_ROOT_VALUES.domain.has(event.domain) ? { domain: event.domain } : {}),
    ...(event.operation && SAFE_ROOT_VALUES.operation.has(event.operation)
      ? { operation: event.operation }
      : {}),
    ...(event.outcome ? { outcome: event.outcome } : {}),
    attributes,
  };
}

export class NoopProductAnalyticsTracker implements ProductAnalyticsTracker {
  async track(event: ProductAnalyticsEvent): Promise<void> {
    void event;
  }
}

/** Durable, internal hand-off. A future exporter can consume this event type. */
export class OutboxProductAnalyticsTracker implements ProductAnalyticsTracker {
  constructor(
    private readonly outbox: OutboxRepository,
    private readonly environment: ProductAnalyticsEvent['environment'] = 'production',
  ) {}

  async track(event: ProductAnalyticsEvent): Promise<void> {
    const safe = sanitizeProductAnalyticsEvent({ ...event, environment: this.environment });
    if (!safe) return;
    await this.outbox.enqueue({
      eventType: 'PRODUCT_ANALYTICS_EVENT',
      aggregateType: 'PRODUCT_ANALYTICS',
      aggregateId: uuidv7(),
      payload: { ...safe, attributes: { ...safe.attributes } },
    });
  }
}

export async function safeTrack(
  tracker: ProductAnalyticsTracker | undefined,
  event: ProductAnalyticsEvent,
): Promise<void> {
  if (!tracker) return;
  try {
    await tracker.track(event);
  } catch {
    // Analytics is non-critical and must never break a business request.
  }
}
