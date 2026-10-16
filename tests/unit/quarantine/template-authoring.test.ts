import { describe, expect, it } from 'vitest';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { AppError } from '../../../src/shared/errors/app-error.js';
import {
  controlledFormSchema,
  CONTROLLED_FORM_V1_TYPES,
  CONTROLLED_FORM_TYPES,
  validateControlledFormValues,
} from '../../../src/modules/quarantine/catalog/domain/controlled-form.js';
import {
  CreateAuthoredTemplateUseCase,
  SaveTemplateDraftDesignUseCase,
} from '../../../src/modules/quarantine/templates/application/authoring.js';
import { CreateTemplateUseCase } from '../../../src/modules/quarantine/templates/application/create-template.js';
import type { TemplateVersion } from '../../../src/modules/quarantine/templates/domain/template.js';
import type { TemplateRepository } from '../../../src/modules/quarantine/templates/ports/repository.js';

const AUTHOR_ID = '01900000-0000-7000-8000-000000000001';

const actor = (roles: string[], loginIdentity?: string): ActorContext => ({
  id: AUTHOR_ID,
  ...(loginIdentity ? { loginIdentity } : {}),
  accountState: 'ACTIVE',
  roles,
  permissions: [{ code: 'PERM-ADM-TEMPLATES', scopes: ['GLOBAL'] }],
});

/** Minimal repository double: records writes, enforces the invariants we assert. */
class RecordingRepository implements Partial<TemplateRepository> {
  row: TemplateVersion | undefined;
  readonly designs: Array<{ contentHash: string; reportRevision: string; authoringOrigin: string }> = [];

  async create(input: { template: TemplateVersion }): Promise<TemplateVersion> {
    this.row = input.template;
    return input.template;
  }
  async get(): Promise<TemplateVersion | undefined> {
    return this.row;
  }
  async saveDesign(input: {
    design: unknown;
    contentHash: string;
    reportRevision: string;
    authoringOrigin: TemplateVersion['authoringOrigin'];
    expectedVersion: bigint;
  }): Promise<TemplateVersion> {
    if (!this.row) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (this.row.authoringOrigin !== input.authoringOrigin)
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    this.designs.push({
      contentHash: input.contentHash,
      reportRevision: input.reportRevision,
      authoringOrigin: input.authoringOrigin,
    });
    this.row = {
      ...this.row,
      digitalForm: input.design,
      contentHash: input.contentHash,
      reportRevision: input.reportRevision,
      version: input.expectedVersion + 1n,
    };
    return this.row;
  }
  async list(): Promise<TemplateVersion[]> {
    return this.row ? [this.row] : [];
  }
}

function version(overrides: Partial<TemplateVersion> = {}): TemplateVersion {
  return {
    id: '01900000-0000-7000-8000-0000000000aa',
    templateId: '01900000-0000-7000-8000-0000000000bb',
    templateCode: 'QC-AUTH-001',
    versionNo: '1',
    state: 'DRAFT',
    name: 'Authored specimen inspection',
    description: null,
    contentHash: null,
    sourceDocument: null,
    authoringOrigin: 'USER_AUTHORED_SPECIFICATION',
    createdBy: AUTHOR_ID,
    authorId: AUTHOR_ID,
    reviewerId: null,
    approverId: null,
    approvedAt: null,
    approvedBy: null,
    version: 1n,
    createdAt: new Date('2026-10-16T00:00:00Z'),
    updatedAt: new Date('2026-10-16T00:00:00Z'),
    ...overrides,
  };
}

/** A minimal but complete v2 authored design. */
function authoredDesign(overrides: Record<string, unknown> = {}) {
  return {
    schemaVersion: 2,
    docCode: 'QC-AUTH-001',
    reportRevision: '1',
    sourceTitle: 'Authored specimen inspection',
    sourceDate: null,
    headerFields: [
      { key: 'lot', label: 'Lot number', dataType: 'TEXT', required: true, receivingKey: 'lot' },
      {
        key: 'inspectionDate',
        label: 'Inspection date',
        dataType: 'DATE',
        required: true,
      },
    ],
    sections: [
      {
        code: 'VISUAL',
        title: 'Visual inspection',
        points: [
          {
            key: 'seal',
            label: 'Seal integrity',
            dataType: 'PASS_FAIL_NA',
            required: true,
            requirementText: 'No visible breach of the sterile barrier.',
            criticalInspectionPoint: true,
            resultRequired: true,
            remarksAllowed: true,
          },
          {
            key: 'verdict',
            label: 'Inspector verdict',
            dataType: 'OPTION',
            required: true,
            allowedValues: ['Conforming', 'Non-conforming'],
            description: 'Record the inspection verdict only.',
            requirementText: null,
            criticalInspectionPoint: null,
            resultRequired: true,
            remarksAllowed: false,
          },
          {
            key: 'lengths',
            label: 'Length readings',
            dataType: 'TABLE',
            required: true,
            requirementText: 'Five readings in millimetres.',
            criticalInspectionPoint: null,
            resultRequired: true,
            remarksAllowed: false,
            columns: [
              { key: 'reading', label: 'Reading', dataType: 'MEASUREMENT', unit: 'mm', required: true },
            ],
          },
        ],
      },
    ],
    aqlFields: ['AQL'],
    resultVocabulary: 'PASS_FAIL_REMARK_NA',
    finalDisposition: ['Accepted', 'Rejected'],
    reviewResponsibilities: ['Checked by: Inspector'],
    ...overrides,
  };
}

describe('controlled form v2 (authored specifications)', () => {
  it('keeps the v1 vocabulary closed and unchanged', () => {
    expect(CONTROLLED_FORM_V1_TYPES).toContain('TABLE');
    expect(CONTROLLED_FORM_V1_TYPES).not.toContain('DATE');
    expect(CONTROLLED_FORM_TYPES).toContain('DATE');
    expect(CONTROLLED_FORM_TYPES).toContain('FILE_EVIDENCE');
  });

  it('accepts an authored v2 design', () => {
    expect(controlledFormSchema.safeParse(authoredDesign()).success).toBe(true);
  });

  it('rejects an unknown schema version instead of guessing', () => {
    expect(controlledFormSchema.safeParse(authoredDesign({ schemaVersion: 3 })).success).toBe(false);
  });

  it('rejects v2-only field types inside a v1 transcription', () => {
    const design = authoredDesign({ schemaVersion: 1 });
    expect(controlledFormSchema.safeParse(design).success).toBe(false);
  });

  it('rejects authoring metadata leakage into v1', () => {
    const design = authoredDesign({
      schemaVersion: 1,
      sections: [
        {
          code: 'S',
          title: 'S',
          points: [
            {
              key: 'p',
              label: 'p',
              dataType: 'TEXT',
              required: true,
              requirementText: 'x',
              criticalInspectionPoint: null,
              resultRequired: true,
              remarksAllowed: false,
              minValue: 1,
            },
          ],
        },
      ],
    });
    expect(controlledFormSchema.safeParse(design).success).toBe(false);
  });

  it('rejects a numeric bound on a non-numeric field and an inverted bound', () => {
    const base = authoredDesign();
    const lengthPoint = (base.sections[0]!.points as Array<Record<string, unknown>>)[2]!;
    const withBound = (minValue: number, maxValue: number) => {
      lengthPoint.minValue = minValue;
      lengthPoint.maxValue = maxValue;
      return structuredClone(base);
    };
    expect(controlledFormSchema.safeParse(withBound(1, 5)).success).toBe(false);

    const numeric = authoredDesign();
    (numeric.sections[0]!.points as Array<Record<string, unknown>>)[2] = {
      ...lengthPoint,
      dataType: 'MEASUREMENT',
      columns: undefined,
      minValue: 10,
      maxValue: 2,
    };
    expect(controlledFormSchema.safeParse(numeric).success).toBe(false);
  });

  it('requires accepted values for a list field', () => {
    const design = authoredDesign();
    const option = (design.sections[0]!.points as Array<Record<string, unknown>>)[1]!;
    option.allowedValues = [];
    expect(controlledFormSchema.safeParse(design).success).toBe(false);
  });
});

describe('referential field values fail closed', () => {
  const referential = () =>
    controlledFormSchema.parse(
      authoredDesign({
        sections: [
          {
            code: 'TRACE',
            title: 'Traceability',
            points: [
              {
                key: 'procedure',
                label: 'Procedure',
                dataType: 'DOCUMENT_REFERENCE',
                required: true,
                requirementText: null,
                criticalInspectionPoint: null,
                resultRequired: true,
                remarksAllowed: false,
              },
            ],
          },
        ],
      }),
    );

  it('rejects a browser-supplied reference when the server cannot resolve it', () => {
    expect(() =>
      validateControlledFormValues(referential(), {
        headers: {},
        points: { procedure: { value: 'WI-99', result: 'PASS' } },
      }),
    ).toThrow(AppError);
  });

  it('accepts a reference only through a server verifier', () => {
    const form = referential();
    expect(() =>
      validateControlledFormValues(
        form,
        { headers: {}, points: { procedure: { value: 'WI-99', result: 'PASS' } } },
        false,
        { DOCUMENT_REFERENCE: () => false },
      ),
    ).toThrow(AppError);
    expect(
      validateControlledFormValues(
        form,
        { headers: {}, points: { procedure: { value: 'WI-99', result: 'PASS' } } },
        false,
        { DOCUMENT_REFERENCE: (reference) => reference === 'WI-99' },
      ).points.procedure?.value,
    ).toBe('WI-99');
  });
});

describe('SaveTemplateDraftDesignUseCase', () => {
  const design = authoredDesign();

  it('saves a design on an authored DRAFT and hashes the canonical content', async () => {
    const repository = new RecordingRepository();
    repository.row = version();
    const result = await new SaveTemplateDraftDesignUseCase(
      repository as unknown as TemplateRepository,
    ).execute({
      actor: actor(['SUPERVISOR']),
      id: repository.row.id,
      expectedVersion: 1n,
      design,
      requestId: 'req-1',
    });
    expect(result.reportRevision).toBe('1');
    expect(repository.designs).toHaveLength(1);
    expect(repository.designs[0]!.contentHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('refuses to edit anything that is not a DRAFT', async () => {
    const repository = new RecordingRepository();
    repository.row = version({ state: 'APPROVED' });
    await expect(
      new SaveTemplateDraftDesignUseCase(repository as unknown as TemplateRepository).execute({
        actor: actor(['SUPERVISOR']),
        id: repository.row.id,
        expectedVersion: 1n,
        design,
        requestId: 'req-2',
      }),
    ).rejects.toThrow(AppError);
  });

  it('rejects a design whose document code or revision drifts from the record', async () => {
    const repository = new RecordingRepository();
    repository.row = version();
    const useCase = new SaveTemplateDraftDesignUseCase(repository as unknown as TemplateRepository);
    await expect(
      useCase.execute({
        actor: actor(['SUPERVISOR']),
        id: repository.row.id,
        expectedVersion: 1n,
        design: authoredDesign({ docCode: 'OTHER-CODE' }),
        requestId: 'req-3',
      }),
    ).rejects.toThrow(AppError);
    await expect(
      useCase.execute({
        actor: actor(['SUPERVISOR']),
        id: repository.row.id,
        expectedVersion: 1n,
        design: authoredDesign({ reportRevision: '2' }),
        requestId: 'req-4',
      }),
    ).rejects.toThrow(AppError);
  });

  it('keeps a transcription on the v1 vocabulary', async () => {
    const repository = new RecordingRepository();
    repository.row = version({ authoringOrigin: 'SOURCE_TRANSCRIPTION' });
    const useCase = new SaveTemplateDraftDesignUseCase(repository as unknown as TemplateRepository);
    await expect(
      useCase.execute({
        actor: actor(['SUPERVISOR']),
        id: repository.row.id,
        expectedVersion: 1n,
        design,
        requestId: 'req-5',
      }),
    ).rejects.toThrow(AppError);
  });

  it('denies an actor without the template permission', async () => {
    const repository = new RecordingRepository();
    repository.row = version();
    const noPermission: ActorContext = { ...actor(['SUPERVISOR']), permissions: [] };
    await expect(
      new SaveTemplateDraftDesignUseCase(repository as unknown as TemplateRepository).execute({
        actor: noPermission,
        id: repository.row.id,
        expectedVersion: 1n,
        design,
        requestId: 'req-6',
      }),
    ).rejects.toThrow(AppError);
  });
});

describe('CreateAuthoredTemplateUseCase', () => {
  it('always produces a DRAFT, even for a P-06 authority with no ceremony', async () => {
    const repository = new RecordingRepository();
    const create = new CreateTemplateUseCase(repository as unknown as TemplateRepository);
    const result = await new CreateAuthoredTemplateUseCase(create).execute({
      actor: actor(['SUPERVISOR']),
      templateCode: 'QC-AUTH-001',
      versionNo: '1',
      name: 'Authored specimen inspection',
      requestId: 'req-7',
    });
    expect(result.state).toBe('DRAFT');
    expect(result.authoringOrigin).toBe('USER_AUTHORED_SPECIFICATION');
    expect(result.approvedAt).toBeNull();
  });

  it('never auto-approves an authored identity through the catalogue path', async () => {
    const repository = new RecordingRepository();
    const create = new CreateTemplateUseCase(repository as unknown as TemplateRepository);
    // Even when the caller asks for the immediate-approval path, an authored
    // origin forces DRAFT because approval needs a design and a bound document.
    const result = await create.execute({
      actor: actor(['SUPERVISOR']),
      templateCode: 'QC-AUTH-002',
      versionNo: '1',
      name: 'Authored specimen inspection',
      draftOnly: false,
      authoringOrigin: 'USER_AUTHORED_SPECIFICATION',
      requestId: 'req-8',
    });
    expect(result.state).toBe('DRAFT');
  });

  it('rejects an empty or oversized document code', async () => {
    const repository = new RecordingRepository();
    const useCase = new CreateAuthoredTemplateUseCase(
      new CreateTemplateUseCase(repository as unknown as TemplateRepository),
    );
    await expect(
      useCase.execute({
        actor: actor(['SUPERVISOR']),
        templateCode: '   ',
        versionNo: '1',
        name: 'x',
        requestId: 'req-9',
      }),
    ).rejects.toThrow(AppError);
    await expect(
      useCase.execute({
        actor: actor(['SUPERVISOR']),
        templateCode: 'A'.repeat(65),
        versionNo: '1',
        name: 'x',
        requestId: 'req-10',
      }),
    ).rejects.toThrow(AppError);
  });
});
