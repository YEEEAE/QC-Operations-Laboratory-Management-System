/**
 * Template Designer — DRAFT-only visual authoring of a controlled inspection
 * form.
 *
 * The form DOM is the source of truth for what the author is editing: every
 * control carries `data-prop`, every ordered list carries `data-list`, and the
 * module serializes the DOM into the canonical control design on submit. That
 * keeps one representation in the page (no shadow model that can drift), makes
 * reordering a DOM move, and leaves a real no-JavaScript baseline: the visible
 * design JSON textarea can be edited and submitted by hand.
 *
 * Nothing here approves, publishes or maps anything. It prepares a DRAFT design
 * for the server, which re-validates the full schema and recomputes the content
 * hash before persisting anything.
 */

export interface DesignerField {
  key: string;
  label: string;
  dataType: string;
  required: boolean;
  unit?: string | null;
  allowedValues?: string[];
  description?: string;
  requirementText?: string | null;
  criticalInspectionPoint?: boolean | null;
  resultRequired?: boolean;
  remarksAllowed?: boolean;
  columns?: DesignerField[];
  equipmentReference?: string;
  accuracyText?: string;
  minValue?: number;
  maxValue?: number;
  validationPattern?: string;
  relatedSpecification?: string;
  receivingKey?: string;
}

export interface DesignerSection {
  code: string;
  title: string;
  points: DesignerField[];
}

export interface DesignerDesign {
  schemaVersion: number;
  docCode: string;
  reportRevision: string;
  sourceTitle: string;
  sourceDate: string | null;
  criticalInspectionColumn?: boolean;
  headerFields: DesignerField[];
  sections: DesignerSection[];
  aqlFields: string[];
  resultVocabulary: string;
  finalDisposition: string[];
  reviewResponsibilities: string[];
}

type FieldKind = 'point' | 'header' | 'column';

const BOOLEAN_PROPS = new Set(['required', 'resultRequired', 'remarksAllowed']);
const NUMBER_PROPS = new Set(['minValue', 'maxValue']);
const LIST_PROPS = new Set(['allowedValues']);
const TRI_STATE_PROPS = new Set(['criticalInspectionPoint']);
const NUMERIC_TYPES = ['INTEGER', 'DECIMAL', 'MEASUREMENT'];

const kindOfList = (list: string): FieldKind =>
  list === 'columns' ? 'column' : list === 'headerFields' ? 'header' : 'point';

function readControl(control: HTMLElement): unknown {
  const prop = control.dataset.prop ?? '';
  if (control instanceof HTMLInputElement && control.type === 'checkbox') return control.checked;
  const raw =
    control instanceof HTMLInputElement ||
    control instanceof HTMLTextAreaElement ||
    control instanceof HTMLSelectElement
      ? control.value
      : '';
  const value = raw.trim();
  if (TRI_STATE_PROPS.has(prop)) return value === 'true' ? true : value === 'false' ? false : null;
  if (BOOLEAN_PROPS.has(prop)) return value === 'true';
  if (value === '') return undefined;
  if (NUMBER_PROPS.has(prop)) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  }
  if (LIST_PROPS.has(prop))
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  return value;
}

function keyFromLabel(label: string, row: HTMLElement): string {
  const base =
    label
      .normalize('NFKD')
      .replace(/[^A-Za-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40) || 'field';
  const taken = new Set(
    [...row.ownerDocument.querySelectorAll<HTMLInputElement>('[data-prop="key"]')]
      .map((input) => input.value.trim())
      .filter(Boolean),
  );
  let candidate = base;
  let suffix = 1;
  while (taken.has(candidate)) candidate = `${base}_${++suffix}`;
  return candidate;
}

/**
 * Explicit per-kind property allow-lists. Reading only declared properties is
 * what keeps a row's hidden controls from leaking into the saved design: the
 * schema is `.strict()`, so an unexpected property is a rejection rather than a
 * silently ignored field.
 */
const ALWAYS_PROPS = [
  'key',
  'label',
  'dataType',
  'unit',
  'allowedValues',
  'description',
  'minValue',
  'maxValue',
  'validationPattern',
  'relatedSpecification',
] as const;
const PROPS_BY_KIND: Record<FieldKind, readonly string[]> = {
  header: [...ALWAYS_PROPS, 'receivingKey'],
  column: [...ALWAYS_PROPS],
  point: [
    ...ALWAYS_PROPS,
    'requirementText',
    'criticalInspectionPoint',
    'resultRequired',
    'remarksAllowed',
    'equipmentReference',
    'accuracyText',
  ],
};

function readField(row: HTMLElement, kind: FieldKind): DesignerField {
  const controls = new Map<string, HTMLElement>();
  for (const control of row.querySelectorAll<HTMLElement>('[data-prop]'))
    controls.set(control.dataset.prop!, control);

  const field: Record<string, unknown> = {};
  for (const prop of PROPS_BY_KIND[kind]) {
    const control = controls.get(prop);
    if (!control) continue;
    const value = readControl(control);
    if (value !== undefined) field[prop] = value;
  }

  if (typeof field.key !== 'string' || !field.key)
    field.key = keyFromLabel(String(field.label ?? ''), row);

  if (kind === 'point' && field.dataType === 'TABLE') {
    const nested = row.querySelector<HTMLElement>('[data-list="columns"]');
    if (nested) field.columns = readList(nested, 'column');
  }
  return field as unknown as DesignerField;
}

function readList(container: HTMLElement, kind: FieldKind): DesignerField[] {
  return [...container.querySelectorAll<HTMLElement>(':scope > [data-field-row]')].map((row) =>
    readField(row, kind),
  );
}

function readSections(container: HTMLElement): DesignerSection[] {
  return [...container.querySelectorAll<HTMLElement>(':scope > [data-section-row]')].map((row) => {
    const points = row.querySelector<HTMLElement>('[data-list="points"]');
    return {
      code: row.querySelector<HTMLInputElement>('[data-prop="code"]')?.value.trim() ?? '',
      title: row.querySelector<HTMLInputElement>('[data-prop="title"]')?.value.trim() ?? '',
      points: points ? readList(points, 'point') : [],
    };
  });
}

function stringsFrom(container: HTMLElement, prop: string): string[] {
  return [...container.querySelectorAll<HTMLTextAreaElement>(`[data-prop="${prop}"]`)]
    .flatMap((control) => control.value.split('\n'))
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function readDesign(root: HTMLElement): DesignerDesign {
  const headers = root.querySelector<HTMLElement>('[data-list="headerFields"]');
  const sections = root.querySelector<HTMLElement>('[data-list="sections"]');
  const sourceDate = root.querySelector<HTMLInputElement>('[data-prop="sourceDate"]')?.value.trim();
  const criticalColumn = root.querySelector<HTMLSelectElement>(
    '[data-prop="criticalInspectionColumn"]',
  );
  return {
    schemaVersion: Number(root.dataset.schemaVersion ?? '2'),
    docCode: root.dataset.docCode ?? '',
    reportRevision: root.dataset.reportRevision ?? '',
    sourceTitle: root.dataset.sourceTitle ?? '',
    sourceDate: sourceDate ? sourceDate : null,
    ...(criticalColumn && criticalColumn.value !== ''
      ? { criticalInspectionColumn: criticalColumn.value === 'true' }
      : {}),
    headerFields: headers ? readList(headers, 'header') : [],
    sections: sections ? readSections(sections) : [],
    aqlFields: stringsFrom(root, 'aqlFields'),
    resultVocabulary: 'PASS_FAIL_REMARK_NA',
    finalDisposition: stringsFrom(root, 'finalDisposition'),
    reviewResponsibilities: stringsFrom(root, 'reviewResponsibilities'),
  };
}

export function enhanceTemplateDesigner(root: HTMLFormElement): void {
  const designJson = root.querySelector<HTMLTextAreaElement>('[data-design-json]');
  const status = root.querySelector<HTMLElement>('[data-designer-status]');
  const undoStack: string[][] = [];
  let undoButtons: HTMLButtonElement[] = [];
  let dirty = false;
  let ready = false;

  const listFor = (element: EventTarget | null): { container: HTMLElement; kind: FieldKind } | null => {
    if (!(element instanceof HTMLElement)) return null;
    const container = element.closest<HTMLElement>('[data-list]');
    if (!container?.dataset.list) return null;
    return { container, kind: kindOfList(container.dataset.list) };
  };

  const sync = (): void => {
    if (designJson) designJson.value = JSON.stringify(readDesign(root), null, 2);
  };

  const refreshUndoButtons = (): void => {
    for (const button of undoButtons) button.disabled = undoStack.length === 0;
  };

  const markDirty = (): void => {
    dirty = true;
    if (status) status.textContent = 'Unsaved design changes.';
    sync();
  };

  const cloneRow = (templateId: string): HTMLElement => {
    const template = document.getElementById(templateId) as HTMLTemplateElement | null;
    if (!template) throw new Error(`Missing designer template ${templateId}`);
    return template.content.firstElementChild!.cloneNode(true) as HTMLElement;
  };

  const syncDataTypeViews = (row: HTMLElement): void => {
    const type = row.querySelector<HTMLSelectElement>('[data-prop="dataType"]')?.value ?? '';
    const columns = row.querySelector<HTMLElement>('[data-columns-block]');
    if (columns) columns.hidden = type !== 'TABLE';
    const listValues = row.querySelector<HTMLElement>('[data-list-values-block]');
    if (listValues) listValues.hidden = type !== 'OPTION';
    const numeric = row.querySelector<HTMLElement>('[data-numeric-block]');
    if (numeric) numeric.hidden = !NUMERIC_TYPES.includes(type);
  };

  const renumber = (container: HTMLElement, kind: FieldKind): void => {
    const rows = [...container.querySelectorAll<HTMLElement>(':scope > [data-field-row]')];
    rows.forEach((row, index) => {
      row.dataset.rowIndex = String(index);
      const number = row.querySelector<HTMLElement>('[data-row-number]');
      if (number) number.textContent = String(index + 1);
      const remove = row.querySelector<HTMLButtonElement>('[data-action="remove"]');
      if (remove) remove.setAttribute('aria-label', `Remove field ${index + 1}`);
      for (const control of row.querySelectorAll<HTMLElement>('[data-prop]'))
        control.id = `${kind}-${index}-${control.dataset.prop}`;
      for (const element of row.querySelectorAll<HTMLElement>('[data-applies]')) {
        const applies = element.dataset.applies!.split(' ');
        element.hidden = !applies.includes(kind);
        for (const control of element.querySelectorAll<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | HTMLButtonElement
        >('[data-prop]'))
          control.disabled = element.hidden;
      }
      const nested = row.querySelector<HTMLElement>('[data-list="columns"]');
      if (nested) renumber(nested, 'column');
      syncDataTypeViews(row);
    });
  };

  const renumberAll = (): void => {
    const headers = root.querySelector<HTMLElement>('[data-list="headerFields"]');
    const sections = root.querySelector<HTMLElement>('[data-list="sections"]');
    if (headers) renumber(headers, 'header');
    if (!sections) return;
    [...sections.querySelectorAll<HTMLElement>(':scope > [data-section-row]')].forEach((row, index) => {
      row.dataset.sectionIndex = String(index);
      const heading = row.querySelector<HTMLElement>('[data-section-number]');
      if (heading) heading.textContent = String(index + 1);
      const points = row.querySelector<HTMLElement>('[data-list="points"]');
      if (points) renumber(points, 'point');
    });
  };

  const commit = (): void => {
    renumberAll();
    undoButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-action="undo"]')];
    refreshUndoButtons();
    sync();
    if (ready) markDirty();
  };

  const snapshot = (): string[] => [
    root.querySelector<HTMLElement>('[data-list="headerFields"]')?.innerHTML ?? '',
    root.querySelector<HTMLElement>('[data-list="sections"]')?.innerHTML ?? '',
    root.querySelector<HTMLInputElement>('[data-prop="sourceDate"]')?.value ?? '',
  ];

  const pushUndo = (): void => {
    undoStack.push(snapshot());
    if (undoStack.length > 40) undoStack.shift();
    refreshUndoButtons();
  };

  const restore = (value: string[]): void => {
    const headers = root.querySelector<HTMLElement>('[data-list="headerFields"]');
    const sections = root.querySelector<HTMLElement>('[data-list="sections"]');
    if (headers) headers.innerHTML = value[0] ?? '';
    if (sections) sections.innerHTML = value[1] ?? '';
    const sourceDate = root.querySelector<HTMLInputElement>('[data-prop="sourceDate"]');
    if (sourceDate) sourceDate.value = value[2] ?? '';
    renumberAll();
    refreshUndoButtons();
    markDirty();
  };

  const buildField = (container: HTMLElement, kind: FieldKind, dataType?: string): HTMLElement => {
    const row = cloneRow('designer-field-row');
    const type = row.querySelector<HTMLSelectElement>('[data-prop="dataType"]');
    if (type && dataType) type.value = dataType;
    container.append(row);
    renumber(container, kind);
    const label = row.querySelector<HTMLInputElement>('[data-prop="label"]');
    if (label) label.focus();
    return row;
  };

  const moveRow = (row: HTMLElement, direction: -1 | 1): boolean => {
    const sibling = direction === -1 ? row.previousElementSibling : row.nextElementSibling;
    if (!sibling) return false;
    if (direction === -1) row.parentElement!.insertBefore(row, sibling);
    else row.parentElement!.insertBefore(sibling, row);
    return true;
  };

  root.addEventListener('click', (event) => {
    const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>('[data-action]');
    if (!button) return;
    const action = button.dataset.action;

    if (action === 'undo') {
      const previous = undoStack.pop();
      if (previous) restore(previous);
      event.preventDefault();
      return;
    }

    if (action === 'add-section') {
      pushUndo();
      const container = root.querySelector<HTMLElement>('[data-list="sections"]');
      if (container) {
        const row = cloneRow('designer-section-row');
        container.append(row);
        const points = row.querySelector<HTMLElement>('[data-list="points"]');
        if (points) {
          buildField(points, 'point', 'PASS_FAIL_NA');
          buildField(points, 'point', 'PASS_FAIL_NA');
        }
        commit();
        row.querySelector<HTMLInputElement>('[data-prop="title"]')?.focus();
      }
      event.preventDefault();
      return;
    }

    if (action === 'add-field') {
      const list = listFor(button);
      if (!list) return;
      pushUndo();
      buildField(list.container, list.kind, button.dataset.fieldType);
      commit();
      event.preventDefault();
      return;
    }

    const sectionRow = button.closest<HTMLElement>('[data-section-row]');
    if (sectionRow && action === 'remove') {
      pushUndo();
      sectionRow.remove();
      commit();
      event.preventDefault();
      return;
    }

    const row = button.closest<HTMLElement>('[data-field-row]');
    if (!row) return;
    const container = row.parentElement;
    if (!container?.dataset.list) return;
    const kind = kindOfList(container.dataset.list);

    if (action === 'remove') {
      pushUndo();
      row.remove();
      renumber(container, kind);
      markDirty();
    } else if (action === 'duplicate') {
      pushUndo();
      const copy = row.cloneNode(true) as HTMLElement;
      const key = copy.querySelector<HTMLInputElement>('[data-prop="key"]');
      // A duplicated field is a new field and never inherits the identity of the
      // field it was copied from.
      if (key) key.value = '';
      row.after(copy);
      renumber(container, kind);
      markDirty();
    } else if (action === 'move-up' || action === 'move-down') {
      pushUndo();
      if (moveRow(row, action === 'move-up' ? -1 : 1)) {
        renumber(container, kind);
        markDirty();
      }
    } else {
      return;
    }
    event.preventDefault();
  });

  root.addEventListener('change', (event) => {
    const control = event.target as HTMLElement | null;
    const row = control?.closest<HTMLElement>('[data-field-row]');
    if (row && control?.dataset.prop === 'dataType') {
      pushUndo();
      const nested = row.querySelector<HTMLElement>('[data-list="columns"]');
      if (nested && !nested.querySelector('[data-field-row]'))
        buildField(nested, 'column', 'MEASUREMENT');
      renumberAll();
      syncDataTypeViews(row);
      markDirty();
      return;
    }
    markDirty();
  });

  root.addEventListener('input', (event) => {
    const control = event.target as HTMLElement | null;
    if (control?.dataset.prop === 'designSource') {
      dirty = false;
      if (status) status.textContent = 'Editing the raw design JSON.';
      return;
    }
    markDirty();
  });

  root.addEventListener('keydown', (event) => {
    if (event.key !== 'Delete' || !(event.altKey || event.metaKey)) return;
    const row = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-field-row]');
    if (!row) return;
    const container = row.parentElement;
    if (!container?.dataset.list) return;
    pushUndo();
    row.remove();
    renumber(container, kindOfList(container.dataset.list));
    markDirty();
    event.preventDefault();
  });

  root.addEventListener('submit', () => {
    sync();
    if (status) status.textContent = 'Saving design…';
  });

  commit();
  if (designJson) {
    try {
      const stored = JSON.parse(designJson.value) as DesignerDesign;
      if (stored && typeof stored === 'object') hydrateDesign(root, stored);
    } catch {
      // A malformed stored design is not silently replaced: the raw JSON stays
      // visible so the author can correct or discard it deliberately.
      if (status) status.textContent = 'The stored design JSON could not be read into the editor.';
    }
  }
  commit();
  ready = true;
  if (status) status.textContent = '';
}

function writeControl(control: HTMLElement, value: unknown): void {
  if (control instanceof HTMLInputElement && control.type === 'checkbox') {
    control.checked = value === true;
    return;
  }
  if (
    control instanceof HTMLInputElement ||
    control instanceof HTMLTextAreaElement ||
    control instanceof HTMLSelectElement
  ) {
    if (value === undefined || value === null) control.value = '';
    else if (Array.isArray(value)) control.value = value.join(', ');
    else control.value = String(value);
  }
}

function writeField(row: HTMLElement, field: DesignerField, kind: FieldKind): void {
  for (const control of row.querySelectorAll<HTMLElement>('[data-prop]')) {
    const prop = control.dataset.prop!;
    writeControl(control, (field as unknown as Record<string, unknown>)[prop]);
  }
  const nested = row.querySelector<HTMLElement>('[data-list="columns"]');
  if (!nested) return;
  for (const column of field.columns ?? []) {
    const columnRow = cloneFieldRow();
    writeField(columnRow, column, 'column');
    nested.append(columnRow);
  }
  void kind;
}

function cloneFieldRow(): HTMLElement {
  const template = document.getElementById('designer-field-row') as HTMLTemplateElement | null;
  if (!template) throw new Error('Missing designer field row template');
  return template.content.firstElementChild!.cloneNode(true) as HTMLElement;
}

/**
 * Rebuild the editor DOM from a stored design. Used once on load so a saved
 * DRAFT reopens with all of its content, and reused by the undo/redo path.
 */
export function hydrateDesign(root: HTMLElement, design: DesignerDesign): void {
  const headers = root.querySelector<HTMLElement>('[data-list="headerFields"]');
  const sections = root.querySelector<HTMLElement>('[data-list="sections"]');
  if (headers) {
    headers.replaceChildren();
    for (const field of design.headerFields ?? []) {
      const row = cloneFieldRow();
      writeField(row, field, 'header');
      headers.append(row);
    }
  }
  if (sections) {
    sections.replaceChildren();
    for (const section of design.sections ?? []) {
      const sectionTemplate = document.getElementById(
        'designer-section-row',
      ) as HTMLTemplateElement | null;
      if (!sectionTemplate) throw new Error('Missing designer section row template');
      const row = sectionTemplate.content.firstElementChild!.cloneNode(true) as HTMLElement;
      writeControl(row.querySelector<HTMLElement>('[data-prop="code"]')!, section.code);
      writeControl(row.querySelector<HTMLElement>('[data-prop="title"]')!, section.title);
      const points = row.querySelector<HTMLElement>('[data-list="points"]');
      if (points)
        for (const point of section.points ?? []) {
          const pointRow = cloneFieldRow();
          writeField(pointRow, point, 'point');
          points.append(pointRow);
        }
      sections.append(row);
    }
  }
  const sourceDate = root.querySelector<HTMLElement>('[data-prop="sourceDate"]');
  if (sourceDate) writeControl(sourceDate, design.sourceDate ?? '');
  const criticalColumn = root.querySelector<HTMLElement>('[data-prop="criticalInspectionColumn"]');
  if (criticalColumn)
    writeControl(
      criticalColumn,
      design.criticalInspectionColumn === undefined ? '' : String(design.criticalInspectionColumn),
    );
  writeControl(
    root.querySelector<HTMLElement>('[data-prop="aqlFields"]')!,
    (design.aqlFields ?? []).join('\n'),
  );
  writeControl(
    root.querySelector<HTMLElement>('[data-prop="finalDisposition"]')!,
    (design.finalDisposition ?? []).join('\n'),
  );
  writeControl(
    root.querySelector<HTMLElement>('[data-prop="reviewResponsibilities"]')!,
    (design.reviewResponsibilities ?? []).join('\n'),
  );
}

export function initialiseTemplateDesigners(): void {
  for (const form of document.querySelectorAll<HTMLFormElement>('[data-template-designer]'))
    enhanceTemplateDesigner(form);
}
