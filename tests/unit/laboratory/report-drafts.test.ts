import { describe, expect, it } from 'vitest';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { AppError } from '../../../src/shared/errors/app-error.js';
import { createReportDraftOperations } from '../../../src/modules/laboratory/application/report-drafts.js';
import {
  emptyReportDraft,
  reportDraftSchema,
  type ReportType,
} from '../../../src/modules/laboratory/domain/report-draft.js';
import type {
  ReportDraftRepository,
  ReportDraftRow,
} from '../../../src/modules/laboratory/ports/report-draft-repository.js';

const OWNER = '01900000-0000-7000-8000-00000000a001';
const OTHER = '01900000-0000-7000-8000-00000000a002';
const actor = (
  id: string,
  grants: ActorContext['permissions'],
  accountState: ActorContext['accountState'] = 'ACTIVE',
): ActorContext => ({
  id,
  accountState,
  roles: [],
  permissions: grants,
});
const grant = (
  code: ActorContext['permissions'][number]['code'],
  ...scopes: ActorContext['permissions'][number]['scopes'][number][]
) => ({ code, scopes });

class MemoryRepository implements ReportDraftRepository {
  rows = new Map<string, ReportDraftRow>();
  audits: Array<{ action: string; actorId: string; requestId: string }> = [];
  async list(input: { authorId?: string }) {
    return [...this.rows.values()].filter(
      (row) => !input.authorId || row.author_id === input.authorId,
    );
  }
  async get(id: string) {
    return this.rows.get(id);
  }
  async create(input: {
    id: string;
    reportType: ReportType;
    formData: ReportDraftRow['form_data'];
    authorId: string;
    requestId: string;
  }) {
    this.rows.set(input.id, {
      id: input.id,
      report_type: input.reportType,
      form_data: input.formData,
      author_id: input.authorId,
      created_at: new Date('2026-09-24T00:00:00Z'),
      updated_at: new Date('2026-09-24T00:00:00Z'),
      version: 1n,
    });
    this.audits.push({ action: 'CREATE', actorId: input.authorId, requestId: input.requestId });
  }
  async update(input: {
    id: string;
    authorId?: string;
    reportType: ReportType;
    expectedVersion: bigint;
    formData: ReportDraftRow['form_data'];
    actorId: string;
    requestId: string;
  }) {
    const row = this.rows.get(input.id);
    if (
      !row ||
      (input.authorId && row.author_id !== input.authorId) ||
      row.report_type !== input.reportType ||
      row.version !== input.expectedVersion
    )
      throw new AppError('CONFLICT_STALE_VERSION');
    this.rows.set(input.id, {
      ...row,
      form_data: input.formData,
      version: row.version + 1n,
      updated_at: new Date(),
    });
    this.audits.push({ action: 'SAVE', actorId: input.actorId, requestId: input.requestId });
  }
}

describe('laboratory report draft schema and access', () => {
  it('keeps both template identifiers distinct and allows incomplete transcription data', () => {
    const leakage = emptyReportDraft('SUBATMOSPHERIC_AIR_LEAKAGE');
    const decay = emptyReportDraft('PRESSURE_DECAY');
    expect(reportDraftSchema.parse(leakage).reportType).not.toBe(
      reportDraftSchema.parse(decay).reportType,
    );
    expect(leakage.samples).toHaveLength(12);
    expect(leakage.overallResult).toBe('');
    expect(leakage.samples[0]?.setPressure).toBe('');
  });

  it('rejects an incorrect sample count and unknown properties', () => {
    const draft = emptyReportDraft('PRESSURE_DECAY');
    expect(
      reportDraftSchema.safeParse({ ...draft, samples: draft.samples.slice(0, 11) }).success,
    ).toBe(false);
    expect(reportDraftSchema.safeParse({ ...draft, scientificLimit: 'invented' }).success).toBe(
      false,
    );
    expect(
      reportDraftSchema.safeParse({
        ...draft,
        samples: [{ ...draft.samples[0], injected: true }, ...draft.samples.slice(1)],
      }).success,
    ).toBe(false);
  });

  it('preserves precise source measurement text without numeric coercion', () => {
    const draft = emptyReportDraft('SUBATMOSPHERIC_AIR_LEAKAGE');
    draft.samples[0]!.leakageRate = '9007199254740993.0000000001';
    expect(reportDraftSchema.parse(draft).samples[0]?.leakageRate).toBe(
      '9007199254740993.0000000001',
    );
  });

  it('persists create and update with server-owned identity, version checks, and scoped reads', async () => {
    const repo = new MemoryRepository();
    const service = createReportDraftOperations(repo);
    const owner = actor(OWNER, [
      grant('PERM-LAB-VIEW', 'OWN'),
      grant('PERM-LAB-CREATE', 'OWN'),
      grant('PERM-LAB-EDIT-DRAFT', 'OWN'),
    ]);
    const data = emptyReportDraft('PRESSURE_DECAY');
    data.lotNumber = 'LOT-01';
    const id = await service.save({ actor: owner, data, requestId: 'draft-create' });
    expect(repo.rows.get(id)).toMatchObject({
      author_id: OWNER,
      report_type: 'PRESSURE_DECAY',
      version: 1n,
    });
    expect(repo.audits).toEqual([{ action: 'CREATE', actorId: OWNER, requestId: 'draft-create' }]);
    const loaded = await service.get(owner, id);
    expect(loaded.data.lotNumber).toBe('LOT-01');
    await service.save({ actor: owner, id, expectedVersion: 1n, data, requestId: 'draft-update' });
    expect(repo.rows.get(id)?.version).toBe(2n);
    expect(repo.audits.at(-1)).toEqual({
      action: 'SAVE',
      actorId: OWNER,
      requestId: 'draft-update',
    });
    await expect(
      service.save({ actor: owner, id, expectedVersion: 1n, data, requestId: 'stale' }),
    ).rejects.toMatchObject({ code: 'CONFLICT_STALE_VERSION' });
    await expect(
      service.get(actor(OTHER, [grant('PERM-LAB-VIEW', 'OWN')]), id),
    ).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' });
  });

  it('allows GLOBAL lab viewers/editors and rejects inactive or unauthorized accounts', async () => {
    const repo = new MemoryRepository();
    const service = createReportDraftOperations(repo);
    const owner = actor(OWNER, [grant('PERM-LAB-VIEW', 'OWN'), grant('PERM-LAB-CREATE', 'OWN')]);
    const id = await service.save({
      actor: owner,
      data: emptyReportDraft('PRESSURE_DECAY'),
      requestId: 'global-fixture',
    });
    expect(await service.list(actor(OTHER, [grant('PERM-LAB-VIEW', 'GLOBAL')]))).toHaveLength(1);
    await service.save({
      actor: actor(OTHER, [grant('PERM-LAB-EDIT-DRAFT', 'GLOBAL')]),
      id,
      expectedVersion: 1n,
      data: emptyReportDraft('PRESSURE_DECAY'),
      requestId: 'global-edit',
    });
    await expect(
      service.list(actor(OTHER, [grant('PERM-LAB-VIEW', 'OWN')], 'DISABLED')),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    await expect(
      service.save({
        actor: actor(OTHER, []),
        data: emptyReportDraft('PRESSURE_DECAY'),
        requestId: 'denied',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
  });

  it('does not allow an update to switch the report type', async () => {
    const repo = new MemoryRepository();
    const service = createReportDraftOperations(repo);
    const owner = actor(OWNER, [
      grant('PERM-LAB-VIEW', 'OWN'),
      grant('PERM-LAB-CREATE', 'OWN'),
      grant('PERM-LAB-EDIT-DRAFT', 'OWN'),
    ]);
    const id = await service.save({
      actor: owner,
      data: emptyReportDraft('PRESSURE_DECAY'),
      requestId: 'create',
    });
    await expect(
      service.save({
        actor: owner,
        id,
        expectedVersion: 1n,
        data: emptyReportDraft('SUBATMOSPHERIC_AIR_LEAKAGE'),
        requestId: 'switch',
      }),
    ).rejects.toMatchObject({ code: 'CONFLICT_STALE_VERSION' });
    expect(repo.rows.get(id)?.report_type).toBe('PRESSURE_DECAY');
  });
});
