import { describe, expect, it } from 'vitest';
import {
  createDraftMaintenance,
  transitionMaintenance,
  type MaintenanceRecord,
} from '../../../src/modules/assets/maintenance/domain/maintenance.js';
import { TransitionMaintenanceUseCase } from '../../../src/modules/assets/maintenance/application/transition-maintenance.js';
import { CreateMaintenanceUseCase } from '../../../src/modules/assets/maintenance/application/create-maintenance.js';
import type { MaintenanceRepository } from '../../../src/modules/assets/maintenance/ports/repository.js';
const actorId = '00000000-0000-7000-8000-000000000001';
const equipmentId = '00000000-0000-7000-8000-000000000002';
const make = (): MaintenanceRecord =>
  createDraftMaintenance({
    id: '00000000-0000-7000-8000-000000000003',
    maintenanceNo: 'MNT-001',
    equipmentId,
    description: 'Inspect housing',
    createdBy: actorId,
    now: new Date('2026-01-01T00:00:00Z'),
  });
class FakeMaintenanceRepository implements MaintenanceRepository {
  value = make();
  async create({ maintenance }: { maintenance: MaintenanceRecord }) {
    this.value = maintenance;
    return maintenance;
  }
  async get() {
    return this.value;
  }
  async list() {
    return [this.value];
  }
  async transition(input: Parameters<MaintenanceRepository['transition']>[0]) {
    this.value = transitionMaintenance(this.value, input.action, new Date(), input.reason);
    return this.value;
  }
}
const actor = (permission: string) => ({
  id: actorId,
  accountState: 'ACTIVE' as const,
  roles: ['Supervisor'],
  permissions: [{ code: permission as never, scopes: ['GLOBAL' as const] }],
});
describe('Assets maintenance controls', () => {
  it('creates a corrective repair draft for ineligible equipment without granting laboratory use', async () => {
    const repo = new FakeMaintenanceRepository();
    const create = new CreateMaintenanceUseCase(repo);
    const created = await create.execute({
      actor: actor('PERM-MNT-CREATE'),
      maintenanceNo: 'MNT-REPAIR-001',
      equipmentId,
      maintenanceType: 'CORRECTIVE',
      description: 'Repair equipment whose calibration is expired',
      requestId: 'req-repair-ineligible-equipment',
    });
    expect(created).toMatchObject({
      maintenanceNo: 'MNT-REPAIR-001',
      equipmentId,
      state: 'DRAFT',
      maintenanceType: 'CORRECTIVE',
    });
    expect(repo.value.id).toBe(created.id);
  });
  it('requires reasons for cancellation and preserves the maintenance record', () => {
    expect(() => transitionMaintenance(make(), 'CANCEL', new Date())).toThrow();
    expect(transitionMaintenance(make(), 'CANCEL', new Date(), 'Vendor unavailable').state).toBe(
      'CANCELLED',
    );
  });
  it('denies VOID at the domain boundary until a controlled transition is approved', () => {
    expect(() => transitionMaintenance(make(), 'VOID', new Date(), 'retire record')).toThrow();
  });
  it('rejects a transition from the wrong state and checks permission', async () => {
    const repo = new FakeMaintenanceRepository();
    const useCase = new TransitionMaintenanceUseCase(repo);
    await expect(
      useCase.execute({
        actor: actor('PERM-MNT-COMPLETE'),
        maintenanceId: repo.value.id,
        expectedVersion: 1n,
        action: 'COMPLETE',
        requestId: 'req-6',
      }),
    ).rejects.toThrow();
  });
});
