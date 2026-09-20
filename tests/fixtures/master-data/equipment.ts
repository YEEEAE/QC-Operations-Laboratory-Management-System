/**
 * QC-100-FINAL-019 — Disposable, task-owned fixtures for the equipment
 * master-data preflight/import verification. These are DISPOSABLE-FIXTURE
 * records, never approved business seed data (the catalog marks the
 * `equipment` entity's `dataClass` as APPROVED-BUSINESS for the *schema*, but
 * every value below is a synthetic local example, not an approved value).
 *
 * No scientific limit, tolerance, or real-world code list is present.
 */

import type { ImportRow } from '../../../scripts/data/import-preflight.js';

/** Fixed task-owned actor UUID; the integration test provisions this user. */
export const MASTER_DATA_TEST_ACTOR_ID = '01900000-0000-7000-8000-000000000019';

/** A second actor that is deliberately never created (unresolved-reference case). */
export const MASTER_DATA_MISSING_ACTOR_ID = '01900000-0000-7000-8000-000000000099';

export const VALID_EQUIPMENT_ROWS: ImportRow[] = [
  {
    equipment_no: 'FIX-EQP-0001',
    name: 'Disposable balance',
    manufacturer: 'Example Instruments',
    model: 'EX-100',
    serial_no: 'SN-0001',
    location: 'QC-UAT-ROOM',
    state: 'ACTIVE',
    created_by: MASTER_DATA_TEST_ACTOR_ID,
  },
  {
    equipment_no: 'FIX-EQP-0002',
    name: 'Disposable oven',
    manufacturer: 'Example Instruments',
    model: 'EX-200',
    serial_no: 'SN-0002',
    location: 'QC-UAT-ROOM',
    state: 'DRAFT',
    created_by: MASTER_DATA_TEST_ACTOR_ID,
  },
  {
    equipment_no: 'FIX-EQP-0003',
    name: 'Disposable pH meter',
    manufacturer: 'Example Instruments',
    model: 'EX-300',
    serial_no: 'SN-0003',
    location: 'QC-UAT-ROOM',
    state: 'ACTIVE',
    created_by: MASTER_DATA_TEST_ACTOR_ID,
  },
];

/** One valid row combined with every rejection classification. */
export const MIXED_EQUIPMENT_ROWS: ImportRow[] = [
  VALID_EQUIPMENT_ROWS[0],
  // Duplicate of row 1 inside the same batch.
  { ...VALID_EQUIPMENT_ROWS[0], name: 'Disposable balance (dup)' },
  // Missing required field.
  {
    equipment_no: 'FIX-EQP-0004',
    name: '',
    state: 'ACTIVE',
    created_by: MASTER_DATA_TEST_ACTOR_ID,
  },
  // Invalid allowed value (state).
  {
    equipment_no: 'FIX-EQP-0005',
    name: 'Disposable meter',
    state: 'RETIRED',
    created_by: MASTER_DATA_TEST_ACTOR_ID,
  },
  // Unresolved actor reference.
  {
    equipment_no: 'FIX-EQP-0006',
    name: 'Disposable meter',
    state: 'ACTIVE',
    created_by: MASTER_DATA_MISSING_ACTOR_ID,
  },
];
