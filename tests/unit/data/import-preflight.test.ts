import { describe, expect, it } from 'vitest';

import {
  businessKeyTuple,
  preflightImport,
  type PreflightContext,
} from '../../../scripts/data/import-preflight.js';
import {
  assertImportable,
  getMasterDataEntity,
} from '../../../scripts/data/master-data-catalog.js';
import {
  EQUIPMENT_DATASET,
  getRegisteredDataset,
} from '../../../scripts/data/registered-datasets.js';
import {
  MASTER_DATA_MISSING_ACTOR_ID,
  MASTER_DATA_TEST_ACTOR_ID,
  MIXED_EQUIPMENT_ROWS,
  VALID_EQUIPMENT_ROWS,
} from '../../fixtures/master-data/equipment.js';

function context(overrides: Partial<PreflightContext> = {}): PreflightContext {
  return {
    existingKeys: new Set<string>(),
    referenceExists: async (_reference, value) => value === MASTER_DATA_TEST_ACTOR_ID,
    ...overrides,
  };
}

describe('master-data catalog gate', () => {
  it('permits APPROVED + GOVERNED entities and exposes their load order', () => {
    const equipment = getMasterDataEntity('equipment');
    expect(equipment.classification).toBe('APPROVED');
    expect(equipment.governance).toBe('GOVERNED');
    expect(equipment.businessKey).toEqual(['equipment_no']);
    expect(() => assertImportable(equipment)).not.toThrow();
  });

  it('refuses ungoverned/unconfirmed entities instead of inventing data', () => {
    for (const key of [
      'organization-site',
      'organization-department',
      'item',
      'supplier',
      'method',
    ]) {
      const entity = getMasterDataEntity(key);
      expect(entity.governance).toBe('NOT-GOVERNED');
      expect(() => assertImportable(entity)).toThrow(/Refusing to import/);
      expect(() => getRegisteredDataset(key)).toThrow();
    }
    expect(getRegisteredDataset('equipment')).toBe(EQUIPMENT_DATASET);
  });
});

describe('businessKeyTuple', () => {
  it('returns null when a key part is missing or blank', () => {
    expect(businessKeyTuple(EQUIPMENT_DATASET, { equipment_no: '   ' })).toBeNull();
    expect(businessKeyTuple(EQUIPMENT_DATASET, {})).toBeNull();
  });

  it('joins key parts deterministically', () => {
    expect(businessKeyTuple(EQUIPMENT_DATASET, { equipment_no: 'FIX-EQP-0001' })).toBe(
      'FIX-EQP-0001',
    );
  });
});

describe('preflightImport', () => {
  it('accepts a fully valid batch', async () => {
    const report = await preflightImport(EQUIPMENT_DATASET, VALID_EQUIPMENT_ROWS, context());
    expect(report.counts).toMatchObject({ total: 3, ready: 3, alreadyPresent: 0 });
    expect(report.issues).toHaveLength(0);
    expect(report.rejectedRows).toHaveLength(0);
  });

  it('flags missing/empty required fields, invalid values, in-batch duplicates and unresolved references', async () => {
    const report = await preflightImport(EQUIPMENT_DATASET, MIXED_EQUIPMENT_ROWS, context());
    expect(report.counts.ready).toBe(1);
    const codes = report.issues.map((issue) => issue.code);
    expect(codes).toContain('DUPLICATE_IN_BATCH');
    expect(codes).toContain('EMPTY_REQUIRED_FIELD');
    expect(codes).toContain('INVALID_VALUE');
    expect(codes).toContain('UNRESOLVED_REFERENCE');
    expect(report.counts.missingRequiredField).toBe(0);
    expect(report.counts.emptyRequiredField).toBe(1);
    expect(report.counts.invalidValue).toBe(1);
    expect(report.counts.duplicateInBatch).toBe(1);
    expect(report.counts.unresolvedReference).toBe(1);
    expect(report.rejectedRows).toHaveLength(4);
  });

  it('treats an already-present business key as an idempotent skip, not a rejection', async () => {
    const existingKeys = new Set(['FIX-EQP-0001']);
    const report = await preflightImport(
      EQUIPMENT_DATASET,
      VALID_EQUIPMENT_ROWS,
      context({ existingKeys }),
    );
    expect(report.counts.ready).toBe(2);
    expect(report.counts.alreadyPresent).toBe(1);
    expect(report.alreadyPresentRows).toHaveLength(1);
    expect(report.rejectedRows).toHaveLength(0);
  });

  it('rejects a reference that does not resolve', async () => {
    const row = { ...VALID_EQUIPMENT_ROWS[0], created_by: MASTER_DATA_MISSING_ACTOR_ID };
    const report = await preflightImport(EQUIPMENT_DATASET, [row], context());
    expect(report.counts.unresolvedReference).toBe(1);
    expect(report.issues[0]).toMatchObject({ code: 'UNRESOLVED_REFERENCE', field: 'created_by' });
  });
});
