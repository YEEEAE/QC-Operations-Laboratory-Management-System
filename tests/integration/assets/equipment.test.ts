import { describe, expect, it } from 'vitest';
import { createDraftEquipment, transitionEquipment, type Equipment } from '../../../src/modules/assets/equipment/domain/equipment.js';
import { CreateEquipmentUseCase } from '../../../src/modules/assets/equipment/application/create-equipment.js';
import { UpdateEquipmentUseCase } from '../../../src/modules/assets/equipment/application/update-equipment.js';
import type { EquipmentRepository } from '../../../src/modules/assets/equipment/ports/repository.js';
const actor = (permission = 'PERM-EQP-CREATE', scopes: ('OWN'|'GLOBAL')[] = ['GLOBAL']) => ({ id: '00000000-0000-7000-8000-000000000001', accountState: 'ACTIVE' as const, roles: ['Supervisor'], permissions: [{ code: permission as never, scopes }] });
const seed = (): Equipment => createDraftEquipment({ id: '00000000-0000-7000-8000-000000000002', equipmentNo: 'EQ-001', name: 'Balance', createdBy: actor().id, now: new Date('2026-01-01T00:00:00Z') });
class FakeEquipmentRepository implements EquipmentRepository { value = seed(); async create({ equipment }: { equipment: Equipment }) { this.value = equipment; return equipment; } async get() { return this.value; } async list() { return [this.value]; } async updateDraft(input: any) { this.value = { ...this.value, equipmentNo: input.equipmentNo, name: input.name, version: input.expectedVersion + 1n, updatedAt: new Date() }; return this.value; } async transition(input: any) { this.value = transitionEquipment(this.value, input.action, new Date(), input.reason, true); return this.value; } }
describe('Assets equipment use cases', () => {
  it('creates a DRAFT and keeps the server-owned initial state', async () => { const repo = new FakeEquipmentRepository(); const result = await new CreateEquipmentUseCase(repo, () => new Date('2026-01-02T00:00:00Z')).execute({ actor: actor(), equipmentNo: 'EQ-002', name: 'Microscope', requestId: 'req-1' }); expect(result.state).toBe('DRAFT'); expect(result.version).toBe(1n); });
  it('rejects editing a stale version', async () => { const repo = new FakeEquipmentRepository(); const useCase = new UpdateEquipmentUseCase(repo); await expect(useCase.execute({ actor: actor('PERM-EQP-EDIT'), equipmentId: repo.value.id, expectedVersion: 9n, equipmentNo: 'EQ-001', name: 'Changed', requestId: 'req-2' })).rejects.toThrow(); });
  it('does not silently make activation policy up', () => { expect(() => transitionEquipment(seed(), 'ACTIVATE', new Date())).toThrow(); expect(transitionEquipment(seed(), 'ACTIVATE', new Date(), undefined, true).state).toBe('ACTIVE'); });
});
