CREATE TABLE qc.tasks (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  task_no TEXT NOT NULL,
  title TEXT NOT NULL CHECK (length(btrim(title)) > 0),
  description TEXT,
  priority TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('DRAFT', 'OPEN', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'CANCELLED')),
  due_at TIMESTAMPTZ,
  current_assignee_id UUID,
  completed_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT uq_tasks__task_no UNIQUE (task_no),
  CONSTRAINT fk_tasks__current_assignee_id FOREIGN KEY (current_assignee_id) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_tasks__created_by FOREIGN KEY (created_by) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_tasks__updated_by FOREIGN KEY (updated_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.task_assignments (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  task_id UUID NOT NULL,
  assignee_id UUID NOT NULL,
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  unassigned_at TIMESTAMPTZ,
  reason TEXT,
  CONSTRAINT fk_task_assignments__task_id FOREIGN KEY (task_id) REFERENCES qc.tasks (id) ON DELETE RESTRICT,
  CONSTRAINT fk_task_assignments__assignee_id FOREIGN KEY (assignee_id) REFERENCES qc.users (id) ON DELETE RESTRICT,
  CONSTRAINT fk_task_assignments__assigned_by FOREIGN KEY (assigned_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.task_checklist_items (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  task_id UUID NOT NULL,
  label TEXT NOT NULL CHECK (length(btrim(label)) > 0),
  required BOOLEAN NOT NULL,
  position INTEGER NOT NULL,
  completed BOOLEAN NOT NULL,
  completed_by UUID,
  completed_at TIMESTAMPTZ,
  version BIGINT NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT fk_task_checklist_items__task_id FOREIGN KEY (task_id) REFERENCES qc.tasks (id) ON DELETE RESTRICT,
  CONSTRAINT fk_task_checklist_items__completed_by FOREIGN KEY (completed_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.task_comments (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  task_id UUID NOT NULL,
  author_id UUID NOT NULL,
  body TEXT NOT NULL CHECK (length(btrim(body)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  edited_at TIMESTAMPTZ,
  CONSTRAINT fk_task_comments__task_id FOREIGN KEY (task_id) REFERENCES qc.tasks (id) ON DELETE RESTRICT,
  CONSTRAINT fk_task_comments__author_id FOREIGN KEY (author_id) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE TABLE qc.task_dependencies (
  id UUID PRIMARY KEY DEFAULT uuidv7(),
  task_id UUID NOT NULL,
  depends_on_task_id UUID NOT NULL,
  dependency_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_by UUID NOT NULL,
  CONSTRAINT ck_task_dependencies__not_self CHECK (task_id <> depends_on_task_id),
  CONSTRAINT fk_task_dependencies__task_id FOREIGN KEY (task_id) REFERENCES qc.tasks (id) ON DELETE RESTRICT,
  CONSTRAINT fk_task_dependencies__depends_on_task_id FOREIGN KEY (depends_on_task_id) REFERENCES qc.tasks (id) ON DELETE RESTRICT,
  CONSTRAINT fk_task_dependencies__created_by FOREIGN KEY (created_by) REFERENCES qc.users (id) ON DELETE RESTRICT
);

CREATE INDEX idx_tasks__current_assignee_id ON qc.tasks (current_assignee_id);
CREATE INDEX idx_tasks__state ON qc.tasks (state);
CREATE INDEX idx_tasks__due_at ON qc.tasks (due_at);
CREATE INDEX idx_task_assignments__task_id ON qc.task_assignments (task_id);
CREATE INDEX idx_task_assignments__assignee_id ON qc.task_assignments (assignee_id);
CREATE INDEX idx_task_checklist_items__task_id ON qc.task_checklist_items (task_id);
CREATE INDEX idx_task_comments__task_id ON qc.task_comments (task_id);
CREATE INDEX idx_task_dependencies__task_id ON qc.task_dependencies (task_id);
CREATE INDEX idx_task_dependencies__depends_on_task_id ON qc.task_dependencies (depends_on_task_id);

ALTER TABLE qc.tasks OWNER TO qc_migrator;
ALTER TABLE qc.task_assignments OWNER TO qc_migrator;
ALTER TABLE qc.task_checklist_items OWNER TO qc_migrator;
ALTER TABLE qc.task_comments OWNER TO qc_migrator;
ALTER TABLE qc.task_dependencies OWNER TO qc_migrator;

GRANT SELECT, INSERT, UPDATE ON qc.tasks, qc.task_assignments, qc.task_checklist_items, qc.task_comments, qc.task_dependencies TO qc_app_runtime;
