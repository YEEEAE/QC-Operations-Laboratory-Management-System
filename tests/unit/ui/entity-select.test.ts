import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ListApprovedLabTemplatesUseCase } from '../../../src/modules/laboratory/application/list-approved-templates.js';
import type {
  ApprovedLabTemplateOption,
  ControlledLabSources,
} from '../../../src/modules/laboratory/ports/controlled-sources.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import type { PermissionCode } from '../../../src/shared/authorization/permissions.js';
import {
  resolvePreselectedId,
  safeListHref,
  toSelectOptions,
} from '../../../src/ui/forms/entity-select.js';

const ID_A = '01900000-0000-7000-8000-000000000001';
const ID_B = '01900000-0000-7000-8000-000000000002';
const ID_UNKNOWN = '01900000-0000-7000-8000-000000000099';

const readPage = (path: string): string =>
  readFileSync(new URL(`../../../src/pages/${path}`, import.meta.url), 'utf8');

function actorWith(...codes: PermissionCode[]): ActorContext {
  return {
    id: ID_A,
    accountState: 'ACTIVE',
    roles: ['EMPLOYEE'],
    permissions: codes.map((code) => ({ code, scopes: ['GLOBAL'] as const })),
  };
}

function fakeSources(options: readonly ApprovedLabTemplateOption[]): ControlledLabSources {
  return {
    async resolve() {
      throw new Error('not under test');
    },
    async listApprovedTemplates() {
      return options;
    },
    async validateExecution() {},
    async evaluate() {
      throw new Error('not under test');
    },
  };
}

describe('authorized selector helpers (F-06)', () => {
  it('builds options from authorized lists, keeping UUIDs as values only', () => {
    const options = toSelectOptions([
      { id: ID_A, label: 'EQP-001 · Centrifuge' },
      { id: `  ${ID_B}  `, label: '  EQP-002 · Oven  ' },
      { id: ID_A, label: 'duplicate id is dropped' },
      { id: 'not-a-uuid', label: 'non-UUID values never become options' },
      { id: ID_UNKNOWN, label: '   ' },
    ]);
    expect(options).toEqual([
      { value: ID_A, label: 'EQP-001 · Centrifuge' },
      { value: ID_B, label: 'EQP-002 · Oven' },
    ]);
    // Labels are human-readable; no raw UUID is shown as a label.
    for (const option of options) {
      expect(option.label).not.toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      );
    }
  });

  it('resolves contextual preselection only when still authorized (stale-selection)', () => {
    const options = [{ value: ID_A, label: 'EQP-001 · Centrifuge' }];
    expect(resolvePreselectedId(ID_A, options)).toEqual({ id: ID_A, stale: false });
    expect(resolvePreselectedId(null, options)).toEqual({ id: '', stale: false });
    expect(resolvePreselectedId('  ', options)).toEqual({ id: '', stale: false });
    // Unknown-but-well-formed ids are stale: never submitted silently.
    expect(resolvePreselectedId(ID_UNKNOWN, options)).toEqual({ id: '', stale: true });
    // Malformed preselection is stale, never trusted.
    expect(resolvePreselectedId('not-a-uuid', options)).toEqual({ id: '', stale: true });
  });

  it('keeps list return context internal-only (safe Cancel/back)', () => {
    expect(safeListHref('/assets/calibrations', '/assets/calibrations')).toBe(
      '/assets/calibrations',
    );
    expect(safeListHref('/assets/calibrations?state=DRAFT', '/assets/calibrations')).toBe(
      '/assets/calibrations?state=DRAFT',
    );
    expect(safeListHref('https://evil.example/x', '/assets/calibrations')).toBe(
      '/assets/calibrations',
    );
    expect(safeListHref('//evil.example/x', '/assets/calibrations')).toBe('/assets/calibrations');
    expect(safeListHref('/login?returnTo=%2Fassets', '/assets/calibrations')).toBe(
      '/assets/calibrations',
    );
    expect(safeListHref('/tasks/E2E-1', '/assets/calibrations')).toBe('/assets/calibrations');
    expect(safeListHref('/assets/equipment', '/assets/calibrations')).toBe('/assets/calibrations');
    expect(safeListHref(null, '/assets/calibrations')).toBe('/assets/calibrations');
    expect(safeListHref('javascript:alert(1)', '/assets/calibrations')).toBe(
      '/assets/calibrations',
    );
  });
});

describe('approved template selector authorization (F-06)', () => {
  const approved: ApprovedLabTemplateOption[] = [
    { id: ID_A, versionNo: 'v3', methodReference: 'METHOD-ONLY-001' },
  ];

  it('denies the selector source without an explicit lab-create grant', async () => {
    await expect(
      new ListApprovedLabTemplatesUseCase(fakeSources(approved)).execute({
        actor: actorWith('PERM-LAB-VIEW'),
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
  });

  it('denies the selector source for inactive accounts', async () => {
    const actor: ActorContext = {
      ...actorWith('PERM-LAB-CREATE'),
      accountState: 'DISABLED',
    };
    await expect(
      new ListApprovedLabTemplatesUseCase(fakeSources(approved)).execute({ actor }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
  });

  it('returns approved options unchanged for an authorized creator', async () => {
    await expect(
      new ListApprovedLabTemplatesUseCase(fakeSources(approved)).execute({
        actor: actorWith('PERM-LAB-CREATE'),
      }),
    ).resolves.toEqual(approved);
  });
});

describe('selector and navigation contracts across the touched create forms (F-06 / F-09)', () => {
  it('laboratory/tests/new: authorized template selector replaces the raw UUID field', () => {
    const source = readPage('laboratory/tests/new.astro');
    expect(source).toContain('<select id="templateVersionId"');
    expect(source).toContain('listApprovedTemplates');
    expect(source).not.toContain('<input id="templateVersionId"');
    expect(source).toContain('no longer available in your authorized scope');
    expect(source).toContain('No approved templates are available');
    expect(source).toContain('temporarily unavailable');
  });

  it('calibrations/new + maintenance/new: authorized equipment selectors replace raw IDs', () => {
    for (const page of ['assets/calibrations/new.astro', 'assets/maintenance/new.astro']) {
      const source = readPage(page);
      expect(source).toContain('<select id="equipmentId"');
      expect(source).toContain('equipment.list.execute');
      expect(source).not.toMatch(/<input[^>]*name="equipmentId"/);
      expect(source).toContain('no longer available in your authorized scope');
      expect(source).toContain('No equipment is available in your authorized scope');
      expect(source).toContain('temporarily unavailable');
      // Contextual create route for missing equipment.
      expect(source).toContain('href="/assets/equipment/new"');
    }
  });

  it('equipment workspace links back into contextual creation (no UUID typing)', () => {
    const source = readPage('assets/equipment/[equipmentId].astro');
    expect(source).toContain('/assets/calibrations/new?equipmentId=');
    expect(source).toContain('/assets/maintenance/new?equipmentId=');
  });

  it('change-requests/new: authorized version selector with an allowlisted field editor', () => {
    const source = readPage('change-requests/new.astro');
    // The operator selects an authorized controlled version and one
    // allowlisted field; everything authoritative resolves server-side.
    expect(source).toContain('<select id="documentVersionId"');
    expect(source).toContain('<select id="changeField"');
    expect(source).toContain('listChangeTargets');
    expect(source).toContain('no longer available in your authorized scope');
    expect(source).toContain('createForDocumentVersion');
    // No raw UUID/JSON/storage-model inputs reach the operator UI.
    for (const raw of [
      'name="targetSnapshot"',
      'name="targetSnapshotHash"',
      'name="fieldPath"',
      'name="dataType"',
      'name="targetId"',
      'name="targetVersion"',
      'name="currentValue"',
      'name="targetType"',
    ]) {
      expect(source).not.toContain(raw);
    }
    expect(source).toContain('name="expectedDocumentVersion"');
    // Exactly the three allowlisted fields live in the application vocabulary.
    const vocabulary = readFileSync(
      new URL(
        '../../../src/modules/change-requests/application/document-version-change-fields.ts',
        import.meta.url,
      ),
      'utf8',
    );
    expect(vocabulary).toContain('revision');
    expect(vocabulary).toContain('changeSummary');
    expect(vocabulary).toContain('contentHash');
  });

  it('documents/new: controlled document-type vocabulary from the domain constant', () => {
    const source = readPage('documents/new.astro');
    expect(source).toContain('<select id="documentType"');
    expect(source).toContain('document-vocabulary');
    expect(source).toContain('DOCUMENT_TYPE_OPTIONS');
    expect(source).not.toContain('placeholder="WI or SOP"');
    expect(source).not.toContain('modules/documents/domain');
    // The vocabulary stays sourced from the domain constant (no invented values).
    const vocabulary = readFileSync(
      new URL('../../../src/modules/documents/application/document-vocabulary.ts', import.meta.url),
      'utf8',
    );
    expect(vocabulary).toContain('DOCUMENT_TYPES');
  });

  it('business numbers stay operator-supplied from an approved source (no invented numbering)', () => {
    // No approved server-side numbering policy exists in this baseline
    // (DATA-DICTIONARY DD-008 / BUSINESS-RULES BD-013 are open), so forms
    // must not invent generated numbers: the operator supplies the approved
    // number and the technical id is generated server-side.
    for (const page of [
      'tasks/new.astro',
      'laboratory/tests/new.astro',
      'assets/equipment/new.astro',
      'assets/calibrations/new.astro',
      'assets/maintenance/new.astro',
      'change-requests/new.astro',
      'documents/new.astro',
      'quality/findings/new.astro',
      'quarantine/receiving/new.astro',
    ]) {
      const source = readPage(page);
      expect(source).toMatch(/approved source/i);
      expect(source).toMatch(/generated server-side/i);
    }
    // Technical UUIDs are generated server-side only: create use cases mint
    // uuidv7 and never accept a client-supplied record id.
    const creates = [
      '../../../src/modules/tasks/application/create.ts',
      '../../../src/modules/laboratory/application/create-lab-test.ts',
      '../../../src/modules/assets/equipment/application/create-equipment.ts',
      '../../../src/modules/assets/calibration/application/create-calibration.ts',
      '../../../src/modules/assets/maintenance/application/create-maintenance.ts',
      '../../../src/modules/change-requests/application/create-change-request.ts',
      '../../../src/modules/documents/application/create-document.ts',
      '../../../src/modules/quality/findings/application/create-finding.ts',
      '../../../src/modules/quarantine/receiving/application/create-receiving.ts',
    ];
    for (const file of creates) {
      const source = readFileSync(new URL(file, import.meta.url), 'utf8');
      expect(source).toContain('uuidv7()');
    }
  });

  it('touched forms keep consistent Cancel/back controls with safe list return', () => {
    for (const page of [
      'laboratory/tests/new.astro',
      'assets/calibrations/new.astro',
      'assets/maintenance/new.astro',
      'change-requests/new.astro',
      'documents/new.astro',
      'tasks/new.astro',
    ]) {
      const source = readPage(page);
      expect(source).toContain('>Cancel</a>');
      expect(source).toMatch(/Back to /);
    }
    for (const page of [
      'laboratory/tests/new.astro',
      'assets/calibrations/new.astro',
      'assets/maintenance/new.astro',
      'change-requests/new.astro',
      'documents/new.astro',
    ]) {
      const source = readPage(page);
      expect(source).toContain('safeListHref');
      expect(source).toContain('returnHref');
    }
  });

  it('selectors stay keyboard-operable native controls with labelled errors', () => {
    // Native <select> keeps type-ahead search, arrow-key navigation, and
    // screen-reader semantics with no custom keyboard handling to invent.
    for (const page of [
      'laboratory/tests/new.astro',
      'assets/calibrations/new.astro',
      'assets/maintenance/new.astro',
      'change-requests/new.astro',
      'documents/new.astro',
    ]) {
      const source = readPage(page);
      expect(source).toContain('<select ');
      expect(source).toContain('required');
      expect(source).toContain('aria-describedby');
      expect(source).toContain('aria-invalid');
      // No positive tabindex or div-button keyboard traps around selectors.
      expect(source).not.toMatch(/tabindex="[1-9]/);
      expect(source).not.toContain('role="combobox"');
    }
    // Pending (loading) state stays announced; Cancel stays a real link.
    for (const page of [
      'laboratory/tests/new.astro',
      'assets/calibrations/new.astro',
      'assets/maintenance/new.astro',
    ]) {
      const source = readPage(page);
      expect(source).toContain('aria-busy');
      expect(source).toContain('role="status"');
    }
  });
});
