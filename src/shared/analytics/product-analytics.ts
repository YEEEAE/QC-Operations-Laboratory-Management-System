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

const MAX_STRING_LENGTH = 64;
const MAX_ATTRIBUTES = 16;

function safeValue(value: ProductAnalyticsValue): ProductAnalyticsValue | undefined {
  if (typeof value === 'string') {
    if (value.length === 0 || value.length > MAX_STRING_LENGTH) return undefined;
    return value;
  }
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  return value;
}

export function sanitizeProductAnalyticsEvent(
  event: ProductAnalyticsEvent,
): ProductAnalyticsEvent | undefined {
  if (!EVENT_NAMES.has(event.name)) return undefined;
  const attributes: Record<string, ProductAnalyticsValue> = {};
  for (const [name, value] of Object.entries(event.attributes)) {
    if (!ATTRIBUTE_NAMES.has(name) || Object.hasOwn(attributes, name)) continue;
    const safe = safeValue(value);
    if (safe !== undefined) attributes[name] = safe;
    if (Object.keys(attributes).length >= MAX_ATTRIBUTES) break;
  }
  return {
    name: event.name,
    occurredAt: event.occurredAt,
    environment: event.environment,
    ...(event.routeTemplate
      ? { routeTemplate: event.routeTemplate.slice(0, MAX_STRING_LENGTH) }
      : {}),
    ...(event.domain ? { domain: event.domain.slice(0, MAX_STRING_LENGTH) } : {}),
    ...(event.operation ? { operation: event.operation.slice(0, MAX_STRING_LENGTH) } : {}),
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
