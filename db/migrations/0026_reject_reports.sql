-- QC-REJECT-REPORTS-001: Reject Reports module (Issue Slip + Daily Reject).
--
-- Product rule: the module is a normal operational surface. Every ACTIVE
-- authenticated user may view and create both report types. Baseline creation
-- permission rows are seeded in this migration so the deliberate product
-- policy holds on every environment (foundation/test seeds re-assert the same
-- grants idempotently from db/seeds/common.ts).
--
-- Approval confirmations are creator-recorded attestations that a real-world
-- approval was obtained. They are NOT electronic signatures by the named
-- approver roles and must never be rendered as such.
--
-- uuidv7 is a PostgreSQL built-in resolved from pg_catalog. The migration
-- runner configures search_path with pg_catalog after qc.

INSERT INTO qc.permissions (id, code, domain, action, description, risk_level, active)
SELECT uuidv7(), code, 'RREJ', split_part(code, '-', 3), description, 'UNSPECIFIED', TRUE
FROM (
  VALUES
    ('PERM-RREJ-VIEW', 'View Reject Reports (operational read).'),
    ('PERM-RREJ-CREATE', 'Create Reject Issue Slips and Daily Reject records.'),
    ('PERM-RREJ-EDIT', 'Edit own Reject Report drafts.'),
    ('PERM-RREJ-CONFIRM-APPROVAL', 'Record real-world approval confirmations on own Issue Slips.'),
    ('PERM-RREJ-FINALIZE', 'Finalize own Daily Reject records.'),
    ('PERM-RREJ-VOID', 'Void own Reject Reports with reason (non-destructive).'),
    ('PERM-RREJ-ADMIN-CORRECT', 'Administrative recovery on Reject Reports (audited, never forges approval identity).')
) AS seed (code, description)
ON CONFLICT (code) DO NOTHING;

INSERT INTO qc.role_permissions (role_id, permission_id)
SELECT role.id, permission.id
FROM qc.roles role
CROSS JOIN qc.permissions permission
WHERE role.code IN ('EMPLOYEE', 'SUPERVISOR', 'MANAGER', 'ADMIN')
  AND permission.code IN (
    'PERM-RREJ-VIEW',
    'PERM-RREJ-CREATE',
    'PERM-RREJ-EDIT',
    'PERM-RREJ-CONFIRM-APPROVAL',
    'PERM-RREJ-FINALIZE',
    'PERM-RREJ-VOID'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

CREATE TABLE qc.reject_reports (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  report_no TEXT NOT NULL CHECK (length(btrim(report_no)) > 0),
  report_type TEXT NOT NULL CHECK (report_type IN ('ISSUE_SLIP', 'DAILY_REJECT')),
  report_date DATE NOT NULL,
  department TEXT NOT NULL CHECK (length(btrim(department)) > 0),
  shift TEXT,
  status TEXT NOT NULL CHECK (
    (report_type = 'ISSUE_SLIP' AND status IN ('DRAFT', 'ISSUED', 'APPROVAL_TRACKING', 'COMPLETED', 'VOID'))
    OR (report_type = 'DAILY_REJECT' AND status IN ('DRAFT', 'FINALIZED', 'VOID'))
  ),
  issued_at TIMESTAMPTZ,
  finalized_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  voided_by UUID,
  void_reason TEXT,
  correction_of UUID,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_reject_reports__report_no UNIQUE (report_no),
  CONSTRAINT ck_reject_reports__no_self_correction CHECK (correction_of IS NULL OR correction_of <> id),
  CONSTRAINT ck_reject_reports__void_reason CHECK (voided_at IS NULL OR length(btrim(void_reason)) > 0),
  CONSTRAINT fk_reject_reports__created_by FOREIGN KEY (created_by) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_reject_reports__updated_by FOREIGN KEY (updated_by) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_reject_reports__voided_by FOREIGN KEY (voided_by) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_reject_reports__correction_of FOREIGN KEY (correction_of) REFERENCES qc.reject_reports (id) ON DELETE RESTRICT
);

CREATE TABLE qc.reject_issue_slips (
  report_id UUID PRIMARY KEY,
  goods_description TEXT,
  item_code TEXT NOT NULL CHECK (length(btrim(item_code)) > 0),
  item_name TEXT NOT NULL CHECK (length(btrim(item_name)) > 0),
  lot_no TEXT,
  unit TEXT NOT NULL CHECK (length(btrim(unit)) > 0),
  rejected_qty NUMERIC NOT NULL CHECK (rejected_qty > 0),
  unit_cost NUMERIC CHECK (unit_cost IS NULL OR unit_cost >= 0),
  total_value NUMERIC CHECK (total_value IS NULL OR total_value >= 0),
  reject_reason TEXT NOT NULL CHECK (length(btrim(reject_reason)) > 0),
  remarks TEXT,
  CONSTRAINT fk_reject_issue_slips__report_id FOREIGN KEY (report_id) REFERENCES qc.reject_reports (id) ON DELETE RESTRICT
);

-- One row per required approval checkpoint per Issue Slip. Rows are created
-- with the report (all PENDING) and are never deleted; status moves PENDING →
-- CONFIRMED → (REVERSED only through the controlled correction path).
CREATE TABLE qc.issue_slip_approval_confirmations (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  report_id UUID NOT NULL,
  approval_role TEXT NOT NULL CHECK (approval_role IN ('SUPERVISOR', 'QC_MANAGER', 'FACTORY_DIRECTOR')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'REVERSED')),
  approver_name TEXT,
  confirmed_by UUID,
  confirmed_at TIMESTAMPTZ,
  note TEXT,
  evidence_file_id UUID,
  reversed_by UUID,
  reversed_at TIMESTAMPTZ,
  reversal_reason TEXT,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_issue_slip_approvals__report_role UNIQUE (report_id, approval_role),
  CONSTRAINT ck_issue_slip_approvals__confirmed_fields CHECK (
    (status = 'CONFIRMED' AND confirmed_by IS NOT NULL AND confirmed_at IS NOT NULL)
    OR (status <> 'CONFIRMED')
  ),
  CONSTRAINT ck_issue_slip_approvals__reversal_reason CHECK (
    (status = 'REVERSED' AND reversed_by IS NOT NULL AND reversed_at IS NOT NULL AND length(btrim(reversal_reason)) > 0)
    OR (status <> 'REVERSED')
  ),
  CONSTRAINT fk_issue_slip_approvals__report_id FOREIGN KEY (report_id) REFERENCES qc.reject_reports (id) ON DELETE RESTRICT,
  CONSTRAINT fk_issue_slip_approvals__confirmed_by FOREIGN KEY (confirmed_by) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_issue_slip_approvals__reversed_by FOREIGN KEY (reversed_by) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_issue_slip_approvals__evidence_file FOREIGN KEY (evidence_file_id) REFERENCES qc.files (id) ON DELETE RESTRICT
);

CREATE TABLE qc.daily_reject_entries (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  report_id UUID NOT NULL,
  position INTEGER NOT NULL,
  machine_name TEXT,
  item_code TEXT,
  item_description TEXT NOT NULL CHECK (length(btrim(item_description)) > 0),
  lot_no TEXT,
  bu_rm_product_name TEXT,
  rm_description TEXT,
  rm_unit TEXT,
  rm_lot_no TEXT,
  rm_type TEXT,
  pump_out_qty NUMERIC CHECK (pump_out_qty IS NULL OR pump_out_qty >= 0),
  reject_qty NUMERIC NOT NULL CHECK (reject_qty >= 0),
  good_qty NUMERIC NOT NULL CHECK (good_qty >= 0),
  -- Server-computed at write time: reject_qty / good_qty * 100 (NULL when
  -- good_qty = 0). Never trusted from the client. See Documents/STATE-MACHINES.md.
  reject_pct NUMERIC,
  reject_limit NUMERIC CHECK (reject_limit IS NULL OR reject_limit >= 0),
  production_formula TEXT,
  reject_reason TEXT NOT NULL CHECK (length(btrim(reject_reason)) > 0),
  analysis TEXT,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_daily_reject_entries__report_position UNIQUE (report_id, position),
  CONSTRAINT fk_daily_reject_entries__report_id FOREIGN KEY (report_id) REFERENCES qc.reject_reports (id) ON DELETE RESTRICT
);

CREATE INDEX idx_reject_reports__report_type ON qc.reject_reports (report_type);
CREATE INDEX idx_reject_reports__status ON qc.reject_reports (status);
CREATE INDEX idx_reject_reports__report_date ON qc.reject_reports (report_date);
CREATE INDEX idx_reject_reports__created_by ON qc.reject_reports (created_by);
CREATE INDEX idx_reject_reports__department ON qc.reject_reports (department);
CREATE INDEX idx_issue_slip_approvals__report_id ON qc.issue_slip_approval_confirmations (report_id);
CREATE INDEX idx_daily_reject_entries__report_id ON qc.daily_reject_entries (report_id);
