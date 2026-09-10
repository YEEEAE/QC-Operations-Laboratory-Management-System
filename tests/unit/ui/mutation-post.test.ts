import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  TransportValidationError,
  classifyFailure,
  extractDetailId,
  field,
  isUuidLike,
  optionalDate,
  optionalField,
  parseBigintField,
  parseJsonField,
  parseJsonValue,
  toFormFailure,
} from '../../../src/ui/forms/mutation-post.js';

const ID_A = '01900000-0000-7000-8000-000000000001';

const readPage = (path: string): string =>
  readFileSync(new URL(`../../../src/pages/${path}`, import.meta.url), 'utf8');

describe('mutation POST baseline helper (F-04 / F-05)', () => {
  it('accepts only uuid-like detail ids from action results', () => {
    expect(extractDetailId({ id: ID_A })).toBe(ID_A);
    expect(extractDetailId({ changeRequest: { id: ID_A } })).toBe(ID_A);
    expect(extractDetailId({ id: 'not-a-uuid' })).toBeNull();
    expect(extractDetailId({ id: '/tasks/1?taskNo=E2E' })).toBeNull();
    expect(extractDetailId(null)).toBeNull();
    expect(extractDetailId({})).toBeNull();
    expect(isUuidLike(ID_A)).toBe(true);
    expect(isUuidLike('01900000-zzzz-7000-8000-000000000001')).toBe(false);
  });

  it('reads and trims FormData transport values', () => {
    const form = new FormData();
    form.set('taskNo', '  E2E-1 ');
    expect(field(form, 'taskNo')).toBe('E2E-1');
    expect(field(form, 'missing')).toBe('');
    expect(optionalField(form, 'taskNo')).toBe('E2E-1');
    expect(optionalField(form, 'missing')).toBeUndefined();
    form.set('blank', '   ');
    expect(optionalField(form, 'blank')).toBeUndefined();
  });

  it('keeps blank dates undefined so optional schemas are not tripped', () => {
    const form = new FormData();
    expect(optionalDate(form, 'dueAt')).toBeUndefined();
    form.set('dueAt', '2026-09-09T10:00');
    expect(optionalDate(form, 'dueAt')).toBeInstanceOf(Date);
  });

  it('parses bigint and JSON transport fields with field attribution', () => {
    expect(parseBigintField(' 3 ', 'targetVersion')).toBe(3n);
    let transportField: string | null = null;
    try {
      parseBigintField('abc', 'targetVersion');
    } catch (error) {
      transportField = (error as TransportValidationError).field;
    }
    expect(transportField).toBe('targetVersion');
    expect(parseJsonField('{"a":1}', 'targetSnapshot')).toEqual({ a: 1 });
    expect(() => parseJsonField('', 'targetSnapshot')).toThrow(TransportValidationError);
    expect(() => parseJsonField('[1,2]', 'targetSnapshot')).toThrow(TransportValidationError);
    expect(() => parseJsonField('{oops', 'targetSnapshot')).toThrow(TransportValidationError);
    expect(parseJsonValue('')).toBeUndefined();
    expect(parseJsonValue('42')).toBe(42);
    expect(parseJsonValue('plain text')).toBe('plain text');
  });

  it('classifies failures structurally without instanceof', () => {
    expect(classifyFailure(new TransportValidationError('qty')).kind).toBe('validation');
    expect(
      classifyFailure({ type: 'AstroActionInputError', fields: { qty: ['expected'] } }),
    ).toEqual({ kind: 'validation', inputFields: ['qty'] });
    expect(
      classifyFailure({
        type: 'AstroActionInputError',
        issues: [{ path: ['lot'], message: 'x' }],
      }).inputFields,
    ).toEqual(['lot']);
    expect(classifyFailure({ type: 'AstroActionError', message: 'errors.authz_denied' }).kind).toBe(
      'auth',
    );
    expect(
      classifyFailure({ type: 'AstroActionError', message: 'errors.conflict_stale_version' }).kind,
    ).toBe('conflict');
    expect(
      classifyFailure({ type: 'AstroActionError', message: 'errors.resource_not_found' }).kind,
    ).toBe('dependency');
    expect(
      classifyFailure({ type: 'AstroActionError', message: 'errors.validation_failed' }).kind,
    ).toBe('validation');
    expect(
      classifyFailure({ type: 'AstroActionError', message: 'errors.system_database_unavailable' })
        .kind,
    ).toBe('unavailable');
    expect(classifyFailure({ type: 'AstroActionError', message: 'weird' }).kind).toBe('unknown');
    expect(classifyFailure(null).kind).toBe('unknown');
  });

  it('builds user-safe summaries with recovery and ordered field errors', () => {
    const base = {
      entity: 'Task',
      requiredFields: [
        { name: 'taskNo', label: 'Task number' },
        { name: 'title', label: 'Title' },
      ],
      values: { taskNo: '', title: 'kept' } as Record<string, string>,
      listHref: '/tasks',
      listLabel: 'tasks',
    };
    const validation = toFormFailure(
      { type: 'AstroActionInputError', fields: { taskNo: ['bad'] } },
      base,
    );
    expect(validation.kind).toBe('validation');
    expect(validation.fieldErrors.taskNo).toMatch(/task number/i);
    expect(validation.firstInvalidField).toBe('taskNo');
    expect(validation.summary).toMatch(/could not be created/i);

    const empty = toFormFailure(
      { type: 'AstroActionError', message: 'errors.validation_failed' },
      base,
    );
    expect(empty.fieldErrors.taskNo).toBe('This field is required.');

    const auth = toFormFailure(
      { type: 'AstroActionError', message: 'errors.authz_permission_missing' },
      base,
    );
    expect(auth.kind).toBe('auth');
    expect(auth.summary).toMatch(/not authorized/i);
    expect(auth.recovery).toMatch(/preserved/i);

    const conflict = toFormFailure(
      { type: 'AstroActionError', message: 'errors.resource_already_exists' },
      base,
    );
    expect(conflict.kind).toBe('conflict');
    expect(conflict.recovery).toMatch(/same.*number|already exist/i);

    const dependency = toFormFailure(
      { type: 'AstroActionError', message: 'errors.resource_not_found' },
      base,
    );
    expect(dependency.recovery).toMatch(/identifier/i);

    const unavailable = toFormFailure(
      { type: 'AstroActionError', message: 'errors.system_internal' },
      base,
    );
    expect(unavailable.recovery).toMatch(/nothing was saved/i);

    for (const failure of [validation, empty, auth, conflict, dependency, unavailable]) {
      expect(failure.summary).not.toMatch(/stack|node_modules|select .* from/i);
      expect(JSON.stringify(failure)).not.toContain('DATABASE_URL');
    }
  });
});

describe('shared error-summary component contract', () => {
  const component = readFileSync(
    new URL('../../../src/ui/components/FormErrorSummary.astro', import.meta.url),
    'utf8',
  );

  it('announces failures assertively and takes focus for keyboard users', () => {
    expect(component).toContain('role="alert"');
    expect(component).toContain('tabindex="-1"');
    expect(component).toContain('data-error-summary');
    // Invalid `autofocus` on <section> was replaced by progressive script focus
    // (no-JS keeps the visible summary plus anchor links).
    expect(component).not.toContain('\n  autofocus');
    expect(component).toContain('.focus(');
  });

  it('always names a recovery step with a safe list return', () => {
    expect(component).toContain('Back to');
    expect(component).toContain('listHref');
  });

  it('links each invalid field to its exact control and keeps inline errors', () => {
    expect(component).toContain('errors?:');
    expect(component).toContain('fieldId');
    expect(component).toContain('href={`#${item.fieldId}`}');
  });
});

describe('shared async mutation interaction contract (ui-ux-pro-max)', () => {
  const contract = readFileSync(
    new URL('../../../src/ui/forms/mutation-interaction.ts', import.meta.url),
    'utf8',
  );

  it('exposes the eight canonical states without weakening server controls', () => {
    for (const state of [
      'IDLE',
      'SUBMITTING',
      'SUCCESS',
      'VALIDATION_ERROR',
      'CONFLICT_STALE',
      'AUTHORIZATION_CHANGED',
      'DEPENDENCY_UNAVAILABLE',
      'UNKNOWN_SAFE_ERROR',
    ]) {
      expect(contract).toContain(state);
    }
    expect(contract).not.toMatch(/getDatabase|Kysely|Postgres|SELECT .* FROM/i);
  });

  it('disables only the triggering submit, exposes aria-busy, and guards duplicates', () => {
    expect(contract).toContain('aria-busy');
    expect(contract).toContain('[data-submit]');
    expect(contract).toContain('mutationEnhanced');
    expect(contract).toContain('progressText');
    expect(contract).not.toMatch(/form\.reset|value\s*=\s*['"]{2}/);
  });

  it('preserves input, focuses status, and never leaks technical detail', () => {
    expect(contract).toContain('[data-result]');
    expect(contract).toContain('focus?.()');
    expect(contract).toContain('UNKNOWN_SAFE_ERROR');
    expect(contract).not.toMatch(/stack|node_modules|DATABASE_URL|select .* from/i);
  });

  it('classifies success, validation, stale, auth, dependency, and safe-unknown outcomes', async () => {
    const { classifyActionResult } = await import('../../../src/ui/forms/mutation-interaction.js');
    expect(
      classifyActionResult({ data: { id: '01900000-0000-7000-8000-000000000001' } }).state,
    ).toBe('SUCCESS');
    expect(classifyActionResult({ data: { ok: true } }).state).toBe('SUCCESS');
    expect(classifyActionResult({ error: { message: 'errors.validation_failed' } }).state).toBe(
      'VALIDATION_ERROR',
    );
    expect(
      classifyActionResult({ error: { message: 'errors.conflict_stale_version' } }).state,
    ).toBe('CONFLICT_STALE');
    expect(classifyActionResult({ error: { message: 'errors.authz_denied' } }).state).toBe(
      'AUTHORIZATION_CHANGED',
    );
    expect(classifyActionResult({ error: { message: 'errors.resource_not_found' } }).state).toBe(
      'DEPENDENCY_UNAVAILABLE',
    );
    expect(classifyActionResult({ error: { message: 'weird' } }).state).toBe('UNKNOWN_SAFE_ERROR');
  });
});

describe('create-form POST baseline contracts across the nine Tier-2 routes', () => {
  const pages = [
    'tasks/new.astro',
    'laboratory/tests/new.astro',
    'assets/equipment/new.astro',
    'assets/calibrations/new.astro',
    'assets/maintenance/new.astro',
    'change-requests/new.astro',
    'documents/new.astro',
    'quality/findings/new.astro',
    'quarantine/receiving/new.astro',
  ];

  for (const page of pages) {
    it(`${page}: real POST baseline with server-side action call`, () => {
      const source = readPage(page);
      expect(source).toContain('method="post"');
      expect(source).toContain('Astro.callAction');
      expect(source).toContain('Astro.request.method');
      expect(source).toContain('Astro.redirect');
      expect(source).toContain(', 303)');
      expect(source).not.toContain('?_astroAction');
    });

    it(`${page}: visible error summary, field errors, and retained values`, () => {
      const source = readPage(page);
      // The visible summary itself lives in the shared component so every
      // form stays consistent; the page must render it on failure.
      expect(source).toContain('FormErrorSummary');
      expect(source).toContain('<FormErrorSummary');
      expect(source).toContain('aria-invalid');
      expect(source).toContain('aria-describedby');
      expect(source).toContain('field-error');
      expect(source).toContain('value={values.');
    });

    it(`${page}: JavaScript stays an optional enhancement with pending state`, () => {
      const source = readPage(page);
      expect(source).toContain('<script>');
      expect(source).toContain('event.preventDefault()');
      expect(source).toContain('data-submit');
      expect(source).toContain('aria-busy');
      expect(source).toContain('role="status"');
    });

    it(`${page}: no business payload is placed in redirect or query URLs`, () => {
      const source = readPage(page);
      // Success redirects may carry only the new record id; business field
      // values must never be interpolated into navigation URLs.
      expect(source).not.toMatch(
        /location\.href\s*=\s*[^;]*(taskNo|title|equipmentNo|receivingNo|findingNo|documentNo|changeNo|labTestNo|calibrationNo|maintenanceNo|description|targetSnapshot)/,
      );
      expect(source).not.toContain('URLSearchParams');
    });
  }
});
