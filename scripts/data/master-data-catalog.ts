/**
 * QC-100-FINAL-019 — Approved operational starting data: master-data inventory.
 *
 * This module is an *inventory and contract*, not a policy source. Every entry
 * points at the canonical document or migration that already owns the fact; it
 * never introduces a new scientific limit, code value, organizational unit, or
 * import policy.
 *
 * Governing rules reused (not restated as new policy):
 *  - `Documents/DATA-DICTIONARY.md` §3 — APPROVED / SOURCE-DEPENDENT /
 *    POLICY-DEPENDENT / UNCONFIRMED vocabulary (`UNCONFIRMED = DO NOT INVENT`).
 *  - `Documents/DATA-DICTIONARY.md` §16 — organizational scope is
 *    `UNCONFIRMED — DO NOT MIGRATE UNTIL ORGANIZATIONAL STRUCTURE IS APPROVED`.
 *  - `Documents/BUSINESS-RULES.md` BR-GEN-063 (APPROVED: import uses the same
 *    rules as manual input), BR-GEN-064 (UNCONFIRMED: import failure strategy),
 *    BD-019/BD-020 (open administrator decisions), P-06 (template authority).
 *
 * A steward is a *role/owner slot*, never a named person. Unresolved ownership
 * is recorded as an explicit dependency instead of being invented.
 */

export type MasterDataClassification =
  'APPROVED' | 'SOURCE-DEPENDENT' | 'POLICY-DEPENDENT' | 'UNCONFIRMED';

/** Whether a governed physical table with constraints exists in source today. */
export type MasterDataGovernance = 'GOVERNED' | 'NOT-GOVERNED';

/** Approved business data vs disposable test fixtures. */
export type MasterDataClass = 'APPROVED-BUSINESS' | 'DISPOSABLE-FIXTURE' | 'UNRESOLVED';

export interface MasterDataEntity {
  /** Stable inventory key (also the requirement->implementation handle). */
  key: string;
  label: string;
  classification: MasterDataClassification;
  governance: MasterDataGovernance;
  /** Governed table when one exists; `null` when the entity has no table. */
  governedTable: string | null;
  /** Natural business key columns used for duplicate detection (governed only). */
  businessKey: readonly string[];
  /** Canonical documented source of the definition. Never a new source. */
  sourceReference: string;
  /** Accountable role/administrator slot. `UNRESOLVED` entries name the owner. */
  steward: string;
  /** Where the validation rule comes from. Never invented. */
  validationRule: string;
  /** Dependency-safe loading order; 1 loads before 2. */
  loadingOrder: number;
  /** Entities that must already exist before this one loads. */
  dependsOn: readonly string[];
  dataClass: MasterDataClass;
  notes: string;
}

/**
 * Resolution order for starting data. Identity/authorization (`users`, `roles`,
 * grants) is the platform bootstrap owned elsewhere (`db:seed:foundation`,
 * `bootstrap:admin`, `access:grant-system-owner`) and is not re-imported here.
 * Order 1 = no master-data dependency; order 2 = referenced by operational facts.
 */
export const MASTER_DATA_ENTITIES: readonly MasterDataEntity[] = [
  {
    key: 'organization-site',
    label: 'Site',
    classification: 'UNCONFIRMED',
    governance: 'NOT-GOVERNED',
    governedTable: null,
    businessKey: [],
    sourceReference: 'Documents/DATA-DICTIONARY.md §16 (Organizational Scope)',
    steward: 'UNRESOLVED — organizational structure approval required (owner decision via 013/026)',
    validationRule: 'None approved — no organizational-unit schema exists (DO NOT MIGRATE).',
    loadingOrder: 1,
    dependsOn: [],
    dataClass: 'UNRESOLVED',
    notes:
      '`SITE` exists only as an authorization `scope_kind`. No site master table is approved; ' +
      'no code list may be invented. Tracked as an external authority dependency.',
  },
  {
    key: 'organization-department',
    label: 'Department',
    classification: 'UNCONFIRMED',
    governance: 'NOT-GOVERNED',
    governedTable: null,
    businessKey: [],
    sourceReference: 'Documents/DATA-DICTIONARY.md §16 (Organizational Scope)',
    steward: 'UNRESOLVED — organizational structure approval required (owner decision via 013/026)',
    validationRule: 'None approved — no organizational-unit schema exists (DO NOT MIGRATE).',
    loadingOrder: 1,
    dependsOn: [],
    dataClass: 'UNRESOLVED',
    notes:
      '`DEPARTMENT` exists as an authorization `scope_kind` and as free text on ' +
      '`qc.reject_reports.department` (0026, non-empty CHECK). No governed department catalog.',
  },
  {
    key: 'item',
    label: 'Item',
    classification: 'POLICY-DEPENDENT',
    governance: 'NOT-GOVERNED',
    governedTable: null,
    businessKey: [],
    sourceReference:
      'Documents/DATA-DICTIONARY.md §26 (receiving_items.item_code) and §22 (ncrs.affected_item_code)',
    steward: 'UNRESOLVED — controlled reference-data governance (BD-020, owner decision via 013)',
    validationRule:
      'Source rule only: `length(btrim(item_code)) > 0` (0008/0026 CHECK). No code list.',
    loadingOrder: 2,
    dependsOn: [],
    dataClass: 'UNRESOLVED',
    notes:
      'Items are free-text codes carried on operational records, not a governed catalog. ' +
      'Importing an item list would create unapproved master data — withheld.',
  },
  {
    key: 'supplier',
    label: 'Supplier',
    classification: 'POLICY-DEPENDENT',
    governance: 'NOT-GOVERNED',
    governedTable: null,
    businessKey: [],
    sourceReference:
      'db/migrations/0025_qc_closure_006_workflow.sql (receiving_items.supplier_name)',
    steward: 'UNRESOLVED — controlled reference-data governance (BD-020, owner decision via 013)',
    validationRule: 'Source rule only: nullable free text. No supplier code list or constraint.',
    loadingOrder: 2,
    dependsOn: [],
    dataClass: 'UNRESOLVED',
    notes:
      'Supplier appears as descriptive text (receiving) and `provider`/`performed_by` (assets). ' +
      'No governed supplier master exists; none invented.',
  },
  {
    key: 'equipment',
    label: 'Equipment',
    classification: 'APPROVED',
    governance: 'GOVERNED',
    governedTable: 'equipment',
    businessKey: ['equipment_no'],
    sourceReference: 'db/migrations/0010_assets.sql (qc.equipment) · Documents/DATA-DICTIONARY.md',
    steward:
      'Admin (authorized controlled administrative operations, ROLE-MATRIX §43–48); ' +
      'equipment lifecycle actions gated by PERM-EQP-* (PERMISSION-MATRIX)',
    validationRule:
      'Source constraints: `equipment_no` UNIQUE; `name` non-empty CHECK; `state` CHECK IN ' +
      '(DRAFT, ACTIVE, OUT_OF_SERVICE, UNDER_MAINTENANCE, DECOMMISSIONED); `created_by` FK users.',
    loadingOrder: 1,
    dependsOn: [],
    dataClass: 'APPROVED-BUSINESS',
    notes:
      'This is the first governed master-data entity with a real unique business key, so it is the ' +
      'registered end-to-end preflight/import dataset. It still requires an existing actor (`created_by`).',
  },
  {
    key: 'method',
    label: 'Test / analysis method',
    classification: 'SOURCE-DEPENDENT',
    governance: 'NOT-GOVERNED',
    governedTable: null,
    businessKey: [],
    sourceReference:
      'Documents/DATA-DICTIONARY.md §3 (SOURCE-DEPENDENT) · §23 (rcas.method) · ' +
      'db/migrations/0009_laboratory.sql (lab_test_template_versions.method_reference)',
    steward: 'UNRESOLVED — laboratory controlled-source owner (SOURCE-DEPENDENT; via 013)',
    validationRule:
      'SOURCE-DEPENDENT: must resolve to a controlled source (SOP/WI/Specification/Test Method). ' +
      'No method value, tolerance, or acceptance rule may be invented.',
    loadingOrder: 1,
    dependsOn: [],
    dataClass: 'UNRESOLVED',
    notes:
      'Method is a free-text reference on template versions and RCA records. It is intentionally not ' +
      'importable because its values are controlled-source dependent.',
  },
  {
    key: 'controlled-template',
    label: 'Controlled template (inspection / laboratory)',
    classification: 'APPROVED',
    governance: 'GOVERNED',
    governedTable: 'inspection_templates, lab_test_templates',
    businessKey: ['template_code', 'test_code'],
    sourceReference:
      'db/migrations/0008_quarantine.sql · db/migrations/0009_laboratory.sql · ' +
      'Documents/BUSINESS-RULES.md P-06',
    steward:
      'Every active user may create DRAFT; Supervisor/Manager/named yazeed/SYSTEM_OWNER direct-create ' +
      'and review/approve (P-06, BR-APR authority)',
    validationRule:
      'Source constraints: `template_code`/`test_code` UNIQUE; non-empty `name`; approved content is ' +
      'never edited in place (new revision only). Import must preserve P-06 lifecycle.',
    loadingOrder: 1,
    dependsOn: [],
    dataClass: 'APPROVED-BUSINESS',
    notes:
      'Governed but multi-level (template → version → sections → points/parameters). A safe import of ' +
      'approved template content requires an owner decision on the approved template source; only the ' +
      'single-level equipment dataset is wired end-to-end here.',
  },
] as const;

export function getMasterDataEntity(key: string): MasterDataEntity {
  const entity = MASTER_DATA_ENTITIES.find((candidate) => candidate.key === key);
  if (!entity) throw new Error(`Unknown master-data entity: ${key}`);
  return entity;
}

/** Entities that may never be loaded locally because they are not APPROVED/GOVERNED. */
export function assertImportable(entity: MasterDataEntity): void {
  if (entity.governance !== 'GOVERNED' || entity.classification !== 'APPROVED') {
    throw new Error(
      `Refusing to import '${entity.key}': classification=${entity.classification}, ` +
        `governance=${entity.governance}. Only APPROVED + GOVERNED entities are importable; ` +
        'UNCONFIRMED/POLICY-DEPENDENT/SOURCE-DEPENDENT values must not be invented.',
    );
  }
}
