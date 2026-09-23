/**
 * QC-100-FINAL-019 — Registered import dataset specifications.
 *
 * A dataset is only registered when the catalog marks its entity APPROVED and
 * GOVERNED (a real table with source constraints exists). The equipment adapter
 * is wired end-to-end but remains closed until a concrete value-set approval is recorded. Entities that are
 * UNCONFIRMED / POLICY-DEPENDENT / SOURCE-DEPENDENT are deliberately not
 * registered; the catalog refuses to invent them.
 *
 * Every rule below is copied from the source migration — no scientific limit,
 * tolerance, or code list is introduced here.
 */

import { getMasterDataEntity } from './master-data-catalog.js';
import type { ImportDatasetSpec } from './import-preflight.js';
import { assertImportable } from './master-data-catalog.js';

/** `qc.equipment` — db/migrations/0010_assets.sql. */
export const EQUIPMENT_DATASET: ImportDatasetSpec = {
  entityKey: 'equipment',
  targetTable: 'equipment',
  conflictTarget: ['equipment_no'],
  fields: [
    { column: 'equipment_no', required: true },
    { column: 'name', required: true },
    { column: 'manufacturer', required: false },
    { column: 'model', required: false },
    { column: 'serial_no', required: false },
    { column: 'location', required: false },
    {
      column: 'state',
      required: true,
      allowedValues: ['DRAFT', 'ACTIVE', 'OUT_OF_SERVICE', 'UNDER_MAINTENANCE', 'DECOMMISSIONED'],
    },
  ],
  references: [{ column: 'created_by', parentTable: 'users', parentColumn: 'id', required: true }],
};

export const REGISTERED_DATASETS: Record<string, ImportDatasetSpec> = {
  equipment: EQUIPMENT_DATASET,
};

export function getRegisteredDataset(entityKey: string): ImportDatasetSpec {
  // The catalog gate must pass before any spec is used.
  assertImportable(getMasterDataEntity(entityKey));
  const spec = REGISTERED_DATASETS[entityKey];
  if (!spec) {
    throw new Error(
      `No import dataset is registered for '${entityKey}'. Registering a new entity requires an ` +
        'APPROVED + GOVERNED source; unresolved entities stay unregistered.',
    );
  }
  return spec;
}
