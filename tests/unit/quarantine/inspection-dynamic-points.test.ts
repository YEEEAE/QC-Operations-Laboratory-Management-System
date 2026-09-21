import { describe, expect, it } from 'vitest';
import {
  classifyResolution,
  isMappingState,
  NO_APPROVED_TEMPLATE_MESSAGE,
  type MappedTemplateCandidate,
} from '../../../src/modules/quarantine/inspection/domain/inspection-item-mapping.js';
import {
  validateAqlSampling,
  isAqlSamplingResult,
} from '../../../src/modules/quarantine/inspection/domain/inspection-aql.js';
import { AppError } from '../../../src/shared/errors/app-error.js';
import {
  RecordInspectionResultsUseCase,
  type PointCriteriaReader,
  type PointCriteria,
} from '../../../src/modules/quarantine/inspection/application/record-inspection-results.js';
import { isClientAllowedPointResult } from '../../../src/modules/quarantine/inspection/domain/inspection-result.js';
import { inspectionAcceptanceReleasesMaterial } from '../../../src/modules/quarantine/receiving/domain/receiving-status.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import type { Inspection } from '../../../src/modules/quarantine/inspection/domain/inspection.js';
import type { InspectionRepository } from '../../../src/modules/quarantine/inspection/ports/repository.js';

const actor = (): ActorContext => ({
  id: '01900000-0000-7000-8000-0000000000a1',
  accountState: 'ACTIVE',
  roles: ['EMPLOYEE'],
  permissions: [
    { code: 'PERM-INSP-EDIT-DRAFT', scopes: ['OWN'] },
    { code: 'PERM-INSP-ENTER-RESULT', scopes: ['OWN'] },
  ],
});

describe('item→template mapping classification (QC-DATA-002 §3/§14)', () => {
  const candidate = (versionId: string): MappedTemplateCandidate => ({
    templateId: 'tpl-1',
    templateCode: 'TPL-NASAL',
    templateVersionId: versionId,
    versionNo: 'v1',
    name: 'Nasal cannula inspection',
  });

  it('auto-selects when exactly one approved candidate resolves', () => {
    const resolution = classifyResolution([candidate('ver-1')]);
    expect(resolution.unique?.templateVersionId).toBe('ver-1');
    expect(resolution.ambiguous).toHaveLength(0);
  });

  it('requires explicit authorized selection when more than one resolves', () => {
    const resolution = classifyResolution([candidate('ver-1'), candidate('ver-2')]);
    expect(resolution.unique).toBeNull();
    expect(resolution.ambiguous).toHaveLength(2);
  });

  it('exposes the approved fail-safe message when nothing resolves', () => {
    const resolution = classifyResolution([]);
    expect(resolution.unique).toBeNull();
    expect(resolution.ambiguous).toHaveLength(0);
    expect(NO_APPROVED_TEMPLATE_MESSAGE).toContain('No approved inspection template');
    expect(isMappingState('ACTIVE')).toBe(true);
    expect(isMappingState('RETIRED')).toBe(false);
  });
});

describe('structured AQL/sampling facts (QC-DATA-002 §8)', () => {
  it('validates and normalizes the operator-supplied AQL block', () => {
    const aql = validateAqlSampling({
      aql: ' 1.0 ',
      codeLetter: 'H',
      inspectionLevel: 'II',
      sampleSize: '50',
      acceptNumber: '1',
      rejectNumber: '2',
      observedDefects: '0',
      samplingResult: 'ACCEPT',
      sourceReference: 'ANSI/ASQ Z1.4 (approved copy), plan H',
    });
    expect(aql.aql).toBe('1.0');
    expect(aql.samplingResult).toBe('ACCEPT');
  });

  it('fails closed when the approved source reference is missing', () => {
    // Numbers without their approved source cannot be traced or reviewed.
    expect(() =>
      validateAqlSampling({
        aql: '1.0',
        sampleSize: '50',
        acceptNumber: '1',
        rejectNumber: '2',
        samplingResult: 'ACCEPT',
        sourceReference: '  ',
      }),
    ).toThrow(AppError);
  });

  it('rejects non-numeric sample data', () => {
    expect(() =>
      validateAqlSampling({
        aql: '1.0',
        sampleSize: 'fifty',
        acceptNumber: '1',
        rejectNumber: '2',
        samplingResult: 'ACCEPT',
        sourceReference: 'approved plan',
      }),
    ).toThrow(AppError);
    expect(isAqlSamplingResult('ACCEPT')).toBe(true);
    expect(isAqlSamplingResult('MAYBE')).toBe(false);
  });
});

describe('server-side result evaluation and client-claim rejection (§5)', () => {
  const criteria: PointCriteria[] = [
    {
      pointId: '01900000-0000-7000-8000-0000000000b1',
      dataType: 'NUMERIC_MEASUREMENT',
      acceptanceRuleType: 'RANGE_INCLUSIVE',
      acceptanceRulePayload: { lower: '5.0', upper: '6.0' },
    },
    {
      pointId: '01900000-0000-7000-8000-0000000000b2',
      dataType: 'BOOLEAN_ACCEPTABILITY',
      acceptanceRuleType: 'ENUM_ALLOWED',
      acceptanceRulePayload: { allowed: ['Acceptable', 'Not acceptable'] },
    },
    {
      pointId: '01900000-0000-7000-8000-0000000000b3',
      dataType: 'TEXT',
      acceptanceRuleType: null,
      acceptanceRulePayload: null,
    },
  ];
  const criteriaReader: PointCriteriaReader = {
    async listPointCriteria() {
      return criteria;
    },
  };

  const draftInspection = {
    id: '01900000-0000-7000-8000-0000000000c1',
    state: 'DRAFT',
    authorId: actor().id,
    assignedTo: actor().id,
    version: 3n,
    template: {
      templateId: 'tpl-1',
      templateVersionId: 'ver-1',
      versionNo: 'v1',
      templateSnapshot: {},
      approved: true,
    },
  } as unknown as Inspection;

  function repo(): { capture: { saved?: unknown }; repository: InspectionRepository } {
    const capture: { saved?: unknown } = {};
    const repository: InspectionRepository = {
      async get() {
        return draftInspection;
      },
      async listPointCriteria() {
        return criteria;
      },
      async saveAql() {},
      async saveDraft(input) {
        capture.saved = input.results;
        return draftInspection;
      },
      async create() {
        return draftInspection;
      },
      async list() {
        return [draftInspection];
      },
      async transition() {
        return draftInspection;
      },
    };
    return { repository, capture };
  }

  it('computes PASS server-side from the approved limits', async () => {
    const capture = repo();
    const useCase = new RecordInspectionResultsUseCase(capture.repository, criteriaReader);
    await useCase.execute({
      actor: actor(),
      id: draftInspection.id,
      expectedVersion: 3n,
      requestId: 'req-eval',
      results: [
        {
          id: 'r1',
          pointId: criteria[0]!.pointId,
          value: 5.4,
          version: 1n,
        },
      ],
    });
    expect((capture.capture.saved as { pointId: string; result?: string }[])[0]?.result).toBe('PASS');
  });

  it('computes FAIL server-side when the observation breaches the approved limits', async () => {
    const capture = repo();
    const useCase = new RecordInspectionResultsUseCase(capture.repository, criteriaReader);
    await useCase.execute({
      actor: actor(),
      id: draftInspection.id,
      expectedVersion: 3n,
      requestId: 'req-eval-fail',
      results: [
        {
          id: 'r1',
          pointId: criteria[0]!.pointId,
          value: 6.4,
          version: 1n,
        },
      ],
    });
    expect((capture.capture.saved as { result?: string }[])[0]?.result).toBe('FAIL');
  });

  it('evaluates enum acceptability against the approved allowed list', async () => {
    const capture = repo();
    const useCase = new RecordInspectionResultsUseCase(capture.repository, criteriaReader);
    await useCase.execute({
      actor: actor(),
      id: draftInspection.id,
      expectedVersion: 3n,
      requestId: 'req-eval-enum',
      results: [
        { id: 'r2', pointId: criteria[1]!.pointId, value: 'Acceptable', version: 1n },
      ],
    });
    expect((capture.capture.saved as { result?: string }[])[0]?.result).toBe('PASS');
  });

  it('leaves the result to the human reviewer when no formal rule exists', async () => {
    const capture = repo();
    const useCase = new RecordInspectionResultsUseCase(capture.repository, criteriaReader);
    await useCase.execute({
      actor: actor(),
      id: draftInspection.id,
      expectedVersion: 3n,
      requestId: 'req-eval-none',
      results: [{ id: 'r3', pointId: criteria[2]!.pointId, value: 'clear, no irregularities', version: 1n }],
    });
    expect((capture.capture.saved as { result?: string }[])[0]?.result).toBeUndefined();
  });

  it('rejects a client-declared PASS/FAIL claim outright', async () => {
    const useCase = new RecordInspectionResultsUseCase(repo().repository, criteriaReader);
    await expect(
      useCase.execute({
        actor: actor(),
        id: draftInspection.id,
        expectedVersion: 3n,
        requestId: 'req-forge',
        results: [
          { id: 'r1', pointId: criteria[0]!.pointId, value: 5.4, result: 'PASS', version: 1n },
        ],
      }),
    ).rejects.toThrow(AppError);
    // The vocabulary helper agrees: only REMARK/NA may come from the client.
    expect(isClientAllowedPointResult('PASS')).toBe(false);
    expect(isClientAllowedPointResult('FAIL')).toBe(false);
    expect(isClientAllowedPointResult('REMARK')).toBe(true);
    expect(isClientAllowedPointResult('NA')).toBe(true);
  });
});

describe('PASS never releases (invariant, §19)', () => {
  it('keeps the release projection separated from inspection acceptance', () => {
    // The canonical invariant: an accepted inspection is not a release.
    expect(inspectionAcceptanceReleasesMaterial()).toBe(false);
  });
});
