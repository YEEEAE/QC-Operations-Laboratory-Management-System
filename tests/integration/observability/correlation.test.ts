import { describe, expect, it, afterEach } from 'vitest';
import {
  getTelemetryMeter,
  getTelemetryTracer,
  normalizeRouteTemplate,
  resetTelemetryProviders,
  runWithCorrelation,
  safeMetricAttributes,
  setTelemetryProviders,
  withSpan,
  recordCounter,
  type TelemetryAttributes,
  type TelemetrySpan,
} from '../../../src/shared/observability/telemetry';
import { createTelemetryQueryPlugin } from '../../../src/shared/observability/db-telemetry';
import {
  createRequestLogger,
  type StructuredLogger,
} from '../../../src/shared/observability/logger';
import { processOutboxBatch } from '../../../src/shared/outbox/worker';
import type { OutboxRepository } from '../../../src/shared/outbox/outbox-repository';
import { FileService } from '../../../src/shared/files/file-service';
import type {
  EvidenceLink,
  FileRecord,
  FileUploadInput,
} from '../../../src/shared/files/file-record';
import type { FileRepository } from '../../../src/shared/files/file-repository';
import type { ObjectStore } from '../../../src/shared/files/object-store';

class RecordingTracer {
  readonly spans: {
    name: string;
    attributes: TelemetryAttributes;
    parentTraceId?: string;
    parentSpanId?: string;
    span: TelemetrySpan & { attributes: Record<string, string | number | boolean>; ended: boolean };
  }[] = [];
  failOnStartSpan = false;

  startSpan(
    name: string,
    attributes: TelemetryAttributes = {},
    parent?: { traceId?: string; spanId?: string },
  ): TelemetrySpan {
    if (this.failOnStartSpan) throw new Error('tracer backend down');
    const span = {
      traceId: parent?.traceId ?? `trace-${this.spans.length}`,
      spanId: `span-${this.spans.length}-${Math.random().toString(16).slice(2, 8)}`,
      attributes: { ...attributes } as Record<string, string | number | boolean>,
      ended: false,
      setAttribute(name: string, value: string | number | boolean) {
        this.attributes[name] = value;
      },
      recordException() {},
      end() {
        this.ended = true;
      },
    };
    this.spans.push({
      name,
      attributes,
      parentTraceId: parent?.traceId,
      parentSpanId: parent?.spanId,
      span,
    });
    return span;
  }
}

class RecordingMeter {
  readonly counters: {
    name: string;
    delta: number;
    attributes: Record<string, string | number | boolean>;
  }[] = [];
  failOnIncrement = false;

  createCounter(name: string) {
    return {
      increment: (delta = 1, attributes: TelemetryAttributes = {}) => {
        if (this.failOnIncrement) throw new Error('metrics backend down');
        this.counters.push({ name, delta, attributes: safeMetricAttributes(attributes) });
      },
    };
  }
}

describe('request → trace correlation', () => {
  afterEach(() => resetTelemetryProviders());

  it('propagates correlation from request context into nested domain spans', async () => {
    const tracer = new RecordingTracer();
    setTelemetryProviders(tracer);

    await runWithCorrelation(
      { requestId: 'req_1', traceId: 'trace-root', spanId: 'span-root' },
      async () => {
        await withSpan('inspection.approve', async () => {
          await withSpan('db.inspection.update', async () => {});
        });
      },
    );

    expect(tracer.spans.map((s) => s.name)).toEqual(['inspection.approve', 'db.inspection.update']);
    const [outer, inner] = tracer.spans;
    expect(outer.parentTraceId).toBe('trace-root');
    expect(outer.parentSpanId).toBe('span-root');
    expect(inner.parentTraceId).toBe('trace-root');
    expect(inner.parentSpanId).toBe(outer.span.spanId);
    expect(inner.span.traceId).toBe('trace-root');
    expect(inner.span.spanId).not.toBe(outer.span.spanId);
    expect(outer.span.ended).toBe(true);
    expect(inner.span.ended).toBe(true);
  });

  it('defaults to a no-op tracer that still runs business logic and returns span ids', async () => {
    const result = await withSpan('task.create', async () => 'ok');
    expect(result).toBe('ok');
    expect(getTelemetryTracer().startSpan('x').traceId).toMatch(/^[0-9a-f]{32}$/);
    expect(getTelemetryTracer().startSpan('x').spanId).toMatch(/^[0-9a-f]{16}$/);
  });

  it('never lets telemetry failure break a controlled operation (exporter down)', async () => {
    const tracer = new RecordingTracer();
    tracer.failOnStartSpan = true;
    const meter = new RecordingMeter();
    meter.failOnIncrement = true;
    setTelemetryProviders(tracer, meter);

    const result = await withSpan('quarantine.release', async () => {
      recordCounter('qc_operations_total', 1, { outcome: 'success' });
      return 'committed';
    });
    expect(result).toBe('committed');

    await expect(
      withSpan('quarantine.release', async () => {
        throw new Error('business failure');
      }),
    ).rejects.toThrow('business failure');
  });

  it('marks spans failed on business error and still ends them', async () => {
    const tracer = new RecordingTracer();
    setTelemetryProviders(tracer);
    await withSpan('inspection.approve', async () => {}).catch(() => undefined);
    try {
      await withSpan('inspection.approve', async () => {
        throw new Error('denied');
      });
    } catch {
      // expected
    }
    expect(tracer.spans.at(-1)?.span.attributes['outcome']).toBe('error');
    expect(tracer.spans.at(-1)?.span.ended).toBe(true);
  });
});

describe('metrics cardinality guard', () => {
  afterEach(() => resetTelemetryProviders());

  it('strips forbidden high-cardinality labels before a counter records', () => {
    const meter = new RecordingMeter();
    setTelemetryProviders(undefined, meter);
    recordCounter('qc_http_requests_total', 1, {
      route_template: '/tasks/:id',
      http_method: 'POST',
      status_class: '2xx',
      requestId: 'req_abc',
      traceId: 'trace_abc',
      spanId: 'span_abc',
      userId: 'u-123',
      recordId: 'r-123',
      email: 'user@example.com',
    });
    expect(meter.counters[0]?.attributes).toEqual({
      route_template: '/tasks/:id',
      http_method: 'POST',
      status_class: '2xx',
    });
  });

  it('bounds label values to a safe length', () => {
    const bounded = safeMetricAttributes({
      operation: 'x'.repeat(500),
      dependency: 'postgres',
    });
    expect(bounded['operation']).toHaveLength(128);
    expect(bounded['dependency']).toBe('postgres');
  });
});

describe('normalized route templates', () => {
  it('replaces technical/business identifiers with bounded placeholders', () => {
    expect(normalizeRouteTemplate('/tasks/550e8400-e29b-41d4-a716-446655440000')).toBe(
      '/tasks/:id',
    );
    expect(normalizeRouteTemplate('/quarantine/inspections/TSK-000123/review')).toBe(
      '/quarantine/inspections/:id/review',
    );
    expect(normalizeRouteTemplate('/login')).toBe('/login');
    expect(
      normalizeRouteTemplate('/assets/equipment/123e4567-e89b-12d3-a456-426614174000/calibration'),
    ).toBe('/assets/equipment/:id/calibration');
    expect(normalizeRouteTemplate('/tasks/')).toBe('/tasks');
  });

  it('never includes query strings or raw uuids in the template', () => {
    const template = normalizeRouteTemplate(
      '/documents/doc-018f3c2e-7b1a-7cc2-9d4e-3a1f2b3c4d5e?v=2',
    );
    expect(template).toBe('/documents/:id');
    expect(template).not.toContain('018f');
  });
});

describe('database client telemetry', () => {
  afterEach(() => resetTelemetryProviders());

  it('emits bounded spans/counters for queries without SQL text, parameters, or ids', async () => {
    const tracer = new RecordingTracer();
    const meter = new RecordingMeter();
    setTelemetryProviders(tracer, meter);
    const plugin = createTelemetryQueryPlugin();
    const queryId = { queryId: 1 } as never;
    plugin.transformQuery!({ queryId, node: { kind: 'InsertQueryNode' } } as never);

    const result = await plugin.transformResult!({
      queryId,
      result: { rows: [] },
    } as never);

    expect(result.rows).toEqual([]);
    expect(tracer.spans).toHaveLength(1);
    expect(tracer.spans[0]?.name).toBe('postgres.query');
    expect(tracer.spans[0]?.attributes['dependency']).toBe('postgres');
    expect(tracer.spans[0]?.attributes['statement_kind']).toBe('InsertQueryNode');
    expect(JSON.stringify(tracer.spans[0]?.attributes)).not.toMatch(/insert into|values|\$/i);
    expect(meter.counters.map((c) => c.name)).toContain('qc_db_queries_total');
    const counter = meter.counters.find((c) => c.name === 'qc_db_queries_total');
    expect(counter?.attributes['outcome']).toBe('success');
    expect(
      Object.keys(counter?.attributes ?? {}).every((k) =>
        [
          'dependency',
          'statement_kind',
          'outcome',
          'domain',
          'operation',
          'route_template',
          'http_method',
          'status_class',
          'error_family',
          'environment',
        ].includes(k),
      ),
    ).toBe(true);
  });

  it('keeps the raw query node unchanged', () => {
    const plugin = createTelemetryQueryPlugin();
    const queryId = { queryId: 2 } as never;
    const node = { kind: 'SelectQueryNode' } as never;
    expect(plugin.transformQuery!({ queryId, node } as never)).toBe(node);
  });
});

describe('structured logging has no secret leakage', () => {
  it('redacts known sensitive fields and binds request correlation', async () => {
    const lines: string[] = [];
    const stream = {
      write(chunk: string) {
        lines.push(chunk);
      },
    } as never;
    const logger: StructuredLogger = createRequestLogger(
      { requestId: 'req_9', traceId: 'trace_9', spanId: 'span_9' },
      stream,
    );
    logger.info(
      {
        password: 'hunter2',
        passwordHash: 'argon2-hash',
        token: 'session-token-value',
        resetToken: 'reset-token-value',
        authorization: 'Bearer abc',
        cookie: '__Host-qc_session=x',
        route_template: '/login',
      },
      'login attempt',
    );
    await new Promise((resolve) => setTimeout(resolve, 10));
    const entry = JSON.parse(lines[0]!) as Record<string, unknown>;
    expect(entry['password']).toBe('[REDACTED]');
    expect(entry['passwordHash']).toBe('[REDACTED]');
    expect(entry['token']).toBe('[REDACTED]');
    expect(entry['resetToken']).toBe('[REDACTED]');
    expect(entry['authorization']).toBe('[REDACTED]');
    expect(entry['cookie']).toBe('[REDACTED]');
    expect(entry['route_template']).toBe('/login');
    expect(entry['requestId']).toBe('req_9');
    expect(entry['traceId']).toBe('trace_9');
    expect(entry['spanId']).toBe('span_9');
    expect(JSON.stringify(entry)).not.toContain('hunter2');
    expect(JSON.stringify(entry)).not.toContain('session-token-value');
  });

  it('keeps the redaction-safe logger available when the underlying sink is unavailable', () => {
    const throwingStream = {
      write() {
        throw new Error('log sink down');
      },
    } as never;
    const logger: StructuredLogger = createRequestLogger(undefined, throwingStream);
    expect(() => logger.info({ route_template: '/login' }, 'still safe')).not.toThrow();
  });
});

describe('no-op meter baseline', () => {
  it('exposes counters that never throw without a backend', () => {
    expect(() => getTelemetryMeter().createCounter('qc_any_total').increment()).not.toThrow();
  });
});

describe('durable outbox telemetry', () => {
  afterEach(() => resetTelemetryProviders());

  it('emits bounded outcomes for processed and retried events without payload leakage', async () => {
    const tracer = new RecordingTracer();
    const meter = new RecordingMeter();
    setTelemetryProviders(tracer, meter);
    const events = [
      {
        id: 'e1',
        eventType: 'NOTIFY',
        aggregateType: 'TASK',
        aggregateId: 't1',
        payload: {},
        attemptCount: 1,
        availableAt: new Date(),
      },
      {
        id: 'e2',
        eventType: 'NOTIFY',
        aggregateType: 'TASK',
        aggregateId: 't2',
        payload: {},
        attemptCount: 1,
        availableAt: new Date(),
      },
    ];
    const repository: OutboxRepository = {
      async enqueue() {},
      async claim() {
        return events;
      },
      async markProcessed() {},
      async markRetry() {},
    };
    let calls = 0;
    const count = await processOutboxBatch(repository, async (event) => {
      if (event.id === 'e2') throw new Error('handler down with sensitive payload {secret}');
      calls += 1;
    });
    expect(count).toBe(2);
    expect(calls).toBe(1); // e2 handler throws before the success probe increments
    const outcomes = meter.counters
      .filter((c) => c.name === 'qc_outbox_events_total')
      .map((c) => c.attributes['outcome']);
    expect(outcomes.sort()).toEqual(['error', 'success']);
    expect(tracer.spans.every((s) => s.name === 'outbox.process')).toBe(true);
    const serialized = JSON.stringify({
      spans: tracer.spans.map((s) => s.attributes),
      counters: meter.counters,
    });
    expect(serialized).not.toContain('sensitive payload');
    expect(serialized).not.toContain('{secret}');
  });
});

describe('file telemetry', () => {
  afterEach(() => resetTelemetryProviders());

  function makeFileService(options?: { failOnPut?: boolean }): {
    service: FileService;
    repository: FileRepository;
    store: ObjectStore;
  } {
    const file: FileRecord = {
      id: 'f-1',
      originalFilename: 'confidential-report.pdf',
      storageKey: 'files/f-1',
      storageProvider: 'OBJECT_STORE',
      mimeType: 'application/pdf',
      sizeBytes: 4,
      sha256: '4bf5122f344554c53bde2ebb8cd2b7e3d1600ad631c385a5d7cce23c7785459a',
      uploadedBy: 'u-1',
      uploadedAt: new Date(),
      state: 'ACTIVE',
    };
    const evidence: EvidenceLink = {
      id: 'l-1',
      fileId: 'f-1',
      subjectType: 'TASK',
      subjectId: 't-1',
      linkedBy: 'u-1',
      linkedAt: new Date(),
    };
    const repository = {
      async create() {
        return file;
      },
      async findById() {
        return file;
      },
      async linkEvidence() {
        return evidence;
      },
    } as unknown as FileRepository;
    const store = {
      async put() {
        if (options?.failOnPut) throw new Error('object store unavailable');
      },
      async get() {
        return { bytes: new Uint8Array([1]), contentType: 'application/pdf' };
      },
    } as unknown as ObjectStore;
    const service = new FileService(repository, store, async () => undefined);
    return { service, repository, store };
  }

  it('emits bounded operation counters without filenames or subject ids', async () => {
    const tracer = new RecordingTracer();
    const meter = new RecordingMeter();
    setTelemetryProviders(tracer, meter);
    const { service } = makeFileService();
    const input: FileUploadInput = {
      originalFilename: 'confidential-report.pdf',
      mimeType: 'application/pdf',
      bytes: new Uint8Array([1, 2, 3, 4]),
      subjectType: 'TASK',
      subjectId: 't-1',
      uploadedBy: 'u-1',
    };
    await service.upload(input);
    await service.download('u-1', {
      id: 'l-1',
      fileId: 'f-1',
      subjectType: 'TASK',
      subjectId: 't-1',
      linkedBy: 'u-1',
      linkedAt: new Date(),
    });
    const operations = meter.counters.filter((c) => c.name === 'qc_file_operations_total');
    expect(operations.map((c) => c.attributes['operation']).sort()).toEqual(['download', 'upload']);
    expect(operations.every((c) => c.attributes['outcome'] === 'success')).toBe(true);
    const serialized = JSON.stringify({
      spans: tracer.spans.map((s) => s.attributes),
      counters: meter.counters,
    });
    expect(serialized).not.toContain('confidential-report.pdf');
    expect(serialized).not.toContain('t-1');
  });

  it('records failures without leaking uploaded content details', async () => {
    const tracer = new RecordingTracer();
    const meter = new RecordingMeter();
    setTelemetryProviders(tracer, meter);
    const { service } = makeFileService({ failOnPut: true });
    await expect(
      service.upload({
        originalFilename: 'secret.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        bytes: new Uint8Array([9, 9, 9, 9]),
        subjectType: 'LAB_TEST',
        subjectId: 'lt-9',
        uploadedBy: 'u-1',
      }),
    ).rejects.toThrow();
    const failures = meter.counters.filter(
      (c) => c.name === 'qc_file_operations_total' && c.attributes['outcome'] === 'error',
    );
    expect(failures.map((c) => c.attributes['operation'])).toEqual(['upload']);
    expect(JSON.stringify(meter.counters)).not.toContain('secret.docx');
  });
});
