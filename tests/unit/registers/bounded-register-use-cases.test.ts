import { describe, expect, it, vi } from 'vitest';
import { ListEquipmentUseCase } from '../../../src/modules/assets/equipment/application/list-equipment.js';
import { ListReceivingUseCase } from '../../../src/modules/quarantine/receiving/application/list-receiving.js';
import { ListInspectionsUseCase } from '../../../src/modules/quarantine/inspection/application/list-inspections.js';
import { ListDocumentsUseCase } from '../../../src/modules/documents/application/list-documents.js';
import { ListRcaUseCase } from '../../../src/modules/quality/rca/application/list-rca.js';
import { ListCapaUseCase } from '../../../src/modules/quality/capa/application/list-capa.js';
import { parsePageInput } from '../../../src/shared/pagination/page.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const actor = (permission: string): ActorContext => ({
  id: '00000000-0000-7000-8000-000000000001', accountState: 'ACTIVE', roles: ['Employee'],
  permissions: [{ code: permission as never, scopes: ['OWN'] }],
});
const pageResult = { items: [], total: 0, page: 1, pageSize: 25 };

describe('bounded register application boundaries', () => {
  it('authorizes equipment before any paged query and never loads the full list', () => {
    const repository = { list: vi.fn(), listPage: vi.fn().mockResolvedValue(pageResult) };
    const useCase = new ListEquipmentUseCase(repository as never);
    expect(() => useCase.executePage({ actor: actor('PERM-EQP-CREATE') })).toThrow();
    expect(repository.listPage).not.toHaveBeenCalled();
    useCase.executePage({ actor: actor('PERM-EQP-VIEW'), filter: { state: 'DRAFT' }, page: { page: 2, pageSize: 500 } });
    expect(repository.listPage).toHaveBeenCalledWith(expect.objectContaining({ filter: { state: 'DRAFT' }, page: { page: 2, pageSize: 100, offset: 100 } }));
    expect(repository.list).not.toHaveBeenCalled();
  });
  it('keeps Receiving UTC date and operational filters in the bounded repository query', () => {
    const repo = { list: vi.fn(), listPage: vi.fn().mockResolvedValue(pageResult) };
    const useCase = new ListReceivingUseCase(repo as never, () => new Date('2026-10-09T23:59:59Z'));
    useCase.executePage({ actor: actor('PERM-QUAR-VIEW'), receivedOn: 'today', inspectionResult: 'PASS', releaseState: 'RELEASE_PENDING', q: 'LOT%1', page: { page: 2 } });
    expect(repo.listPage).toHaveBeenCalledWith(expect.objectContaining({ receivingDate: '2026-10-09', inspectionResult: 'PASS', releaseState: 'RELEASE_PENDING', search: 'LOT%1', page: { page: 2, pageSize: 25, offset: 25 } }));
    expect(repo.list).not.toHaveBeenCalled();
  });
  it('authorizes document and inspection page reads before persistence', () => {
    const docs = { listDocuments: vi.fn(), listDocumentsPage: vi.fn().mockResolvedValue(pageResult) };
    const inspections = { list: vi.fn(), listPage: vi.fn().mockResolvedValue(pageResult) };
    expect(() => new ListDocumentsUseCase(docs as never).executePage({ actor: actor('PERM-DOC-CREATE') })).toThrow();
    expect(() => new ListInspectionsUseCase(inspections as never).executePage({ actor: actor('PERM-INSP-CREATE') })).toThrow();
    expect(docs.listDocumentsPage).not.toHaveBeenCalled();
    expect(inspections.listPage).not.toHaveBeenCalled();
  });
  it('passes RCA state and CAPA source filters to SQL, preserving existing full list methods', () => {
    const repo = { list: vi.fn(), listPage: vi.fn().mockResolvedValue(pageResult) };
    new ListRcaUseCase(repo as never).executePage({ actor: actor('PERM-RCA-VIEW'), state: 'SUBMITTED', ncrId: 'source' });
    new ListCapaUseCase(repo as never).executePage({ actor: actor('PERM-CAPA-VIEW'), state: 'OPEN', ncrId: 'source' });
    expect(repo.listPage).toHaveBeenCalledWith(expect.objectContaining({ state: 'SUBMITTED', ncrId: 'source' }));
    expect(repo.listPage).toHaveBeenCalledWith(expect.objectContaining({ state: 'OPEN', ncrId: 'source' }));
    expect(repo.list).not.toHaveBeenCalled();
  });
  it('rejects unsafe or malformed integers before a database offset is built', () => {
    for (const page of ['9007199254740993', '9'.repeat(400), '1.5', 'next']) {
      expect(() => parsePageInput({ page })).toThrow();
    }
    expect(parsePageInput({ page: '-1', pageSize: 1000 })).toEqual({ page: 1, pageSize: 100, offset: 0 });
  });
});
