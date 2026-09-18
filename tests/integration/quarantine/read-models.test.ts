import { describe, expect, it } from 'vitest';
import {
  GetQuarantineOverviewUseCase,
  type ReceivingOverviewSource,
} from '../../../src/modules/quarantine/application/get-quarantine-overview.js';
import { GetQuarantineAdminUseCase } from '../../../src/modules/quarantine/application/get-quarantine-admin.js';
import type { ReceivingItem } from '../../../src/modules/quarantine/receiving/domain/receiving-item.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const actor: ActorContext = {
  id: '01900000-0000-7000-8000-000000000001',
  accountState: 'ACTIVE',
  roles: ['SUPERVISOR'],
  permissions: [
    { code: 'PERM-QUAR-VIEW', scopes: ['GLOBAL'] },
    { code: 'PERM-ADM-TEMPLATES', scopes: ['GLOBAL'] },
  ],
};

const item = (overrides: Partial<ReceivingItem>): ReceivingItem => ({
  id: crypto.randomUUID(),
  receivingNo: 'RCV-1',
  supplier: 'Supplier',
  docNo: 'DOC-1',
  itemCode: 'ITEM-1',
  description: 'Item',
  lot: 'LOT-1',
  qty: '10',
  receivingDate: new Date('2026-09-19T00:00:00.000Z'),
  workflowState: 'PENDING',
  inspectionResult: 'NOT_STARTED',
  releaseSystem: false,
  createdBy: actor.id,
  createdAt: new Date('2026-09-19T00:00:00.000Z'),
  updatedAt: new Date('2026-09-19T00:00:00.000Z'),
  version: 1n,
  ...overrides,
});

/**
 * A stand-in for the receiving register: it returns the seeded rows and records
 * the filters it was asked for, so the test can prove the overview only ever
 * asks the register for filters the register actually implements.
 */
function register(items: readonly ReceivingItem[], receivedToday: readonly ReceivingItem[] = []) {
  const calls: Array<Record<string, unknown>> = [];
  const source: ReceivingOverviewSource = {
    list: async (input) => {
      calls.push({ ...input });
      return input.receivedOn === 'today' ? receivedToday : items;
    },
  };
  return { source, calls };
}

describe('Quarantine read models', () => {
  it('requires explicit Quarantine view permission and exposes PASS separately from release', async () => {
    const { source } = register([
      item({ workflowState: 'RELEASE_PENDING', inspectionResult: 'PASS', releaseSystem: false }),
    ]);
    const result = await new GetQuarantineOverviewUseCase(source).execute({ actor });
    const pass = result.metrics.find((metric) => metric.key === 'pass-not-released');
    expect(pass?.value).toBe(1);
    expect(pass?.state).toContain('inspection result = PASS');
  });

  it('denies the overview without the quarantine view permission', async () => {
    const { source } = register([]);
    await expect(
      new GetQuarantineOverviewUseCase(source).execute({
        actor: { ...actor, permissions: [] },
      }),
    ).rejects.toThrow();
  });

  it('gives every counter a numerator, a state, an actor scope and one resolved window', async () => {
    const { source, calls } = register([item({})], [item({})]);
    const result = await new GetQuarantineOverviewUseCase(source).execute({ actor });
    expect(result.metrics.length).toBe(8);
    for (const metric of result.metrics) {
      expect(metric.numerator.length, metric.key).toBeGreaterThan(0);
      expect(metric.state.length, metric.key).toBeGreaterThan(0);
      expect(metric.actorScope.length, metric.key).toBeGreaterThan(0);
      expect(metric.timeRange.length, metric.key).toBeGreaterThan(0);
      expect(metric.href.startsWith('/quarantine/receiving'), metric.key).toBe(true);
    }
    // The "received today" window is resolved by the register itself, never by
    // re-implementing a date comparison in the projection.
    expect(calls.some((call) => call.receivedOn === 'today')).toBe(true);
    const filtersUsed = calls.flatMap((call) =>
      Object.entries(call)
        .filter(([key, value]) => key !== 'actor' && value !== undefined)
        .map(([key]) => key),
    );
    for (const key of filtersUsed) {
      expect(['receivedOn', 'state', 'inspectionResult', 'releaseState']).toContain(key);
    }
  });

  it('never spans two workflow states behind a single link', async () => {
    const { source } = register([
      item({ workflowState: 'PENDING', inspectionResult: 'HOLD' }),
      item({ workflowState: 'READY_FOR_INSPECTION' }),
    ]);
    const result = await new GetQuarantineOverviewUseCase(source).execute({ actor });
    const pending = result.metrics.find((metric) => metric.key === 'pending');
    const ready = result.metrics.find((metric) => metric.key === 'ready-for-inspection');
    // The old "Awaiting inspection" counter counted both states while its link
    // carried one of them.
    expect(pending?.value).toBe(1);
    expect(ready?.value).toBe(1);
    for (const metric of result.metrics) {
      expect(metric.href).not.toContain('awaiting');
    }
    // A receiving HOLD and an inspection HOLD are separate counters with
    // separate, reproducing links.
    const receivingHold = result.metrics.find((metric) => metric.key === 'receiving-hold');
    const inspectionHold = result.metrics.find((metric) => metric.key === 'inspection-hold');
    expect(receivingHold?.value).toBe(0);
    expect(inspectionHold?.value).toBe(1);
    expect(receivingHold?.href).toBe('/quarantine/receiving?state=HOLD');
    expect(inspectionHold?.href).toBe('/quarantine/receiving?inspectionResult=HOLD');
  });

  it('derives the attention board and the distribution from the same authorized rows', async () => {
    const hold = item({ workflowState: 'HOLD', receivingNo: 'RCV-HOLD' });
    const { source } = register([
      hold,
      item({ workflowState: 'RELEASED', inspectionResult: 'PASS', releaseSystem: true }),
      item({ workflowState: 'CANCELLED' }),
    ]);
    const result = await new GetQuarantineOverviewUseCase(source).execute({ actor });
    expect(result.attention.map((entry) => entry.title)).toEqual(['RCV-HOLD']);
    expect(result.attention[0]?.severity).toBe('CRITICAL');
    expect(result.attention[0]?.href).toBe(`/quarantine/receiving/${hold.id}`);
    expect(result.distributions).toEqual([
      { label: 'CANCELLED', value: 1 },
      { label: 'HOLD', value: 1 },
      { label: 'RELEASED', value: 1 },
    ]);
  });

  it('fails closed instead of reporting an empty register when the provider is unavailable', async () => {
    const failing: ReceivingOverviewSource = {
      list: async () => {
        throw new Error('register unavailable');
      },
    };
    await expect(new GetQuarantineOverviewUseCase(failing).execute({ actor })).rejects.toThrow();
  });

  it('requires the dedicated domain-admin permission', async () => {
    const result = await new GetQuarantineAdminUseCase({
      async getAdmin() {
        return { generatedAt: new Date(), templates: [], receivingByState: [] };
      },
    }).execute({ actor });
    expect(result.templates).toEqual([]);
  });
});
