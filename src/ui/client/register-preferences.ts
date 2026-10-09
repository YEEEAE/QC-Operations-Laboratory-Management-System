export interface FilterPreset { name: string; query: string; }

export function registerPreferenceKey(account: string, path: string): string | null {
  return account ? `qc.register.v1:${encodeURIComponent(account)}:${encodeURIComponent(path)}` : null;
}

export function readFilterPresets(raw: string | null, names: readonly string[]): FilterPreset[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, 10).flatMap((value) => {
      if (!value || typeof value.name !== 'string' || typeof value.query !== 'string' || value.name.length > 60 || value.query.length > 2048) return [];
      const query = new URLSearchParams(value.query);
      for (const name of query.keys()) if (!names.includes(name) || /password|token|secret|csrf/i.test(name)) return [];
      return [{ name: value.name.trim(), query: query.toString() }].filter((preset) => preset.name);
    });
  } catch { return []; }
}

export function presetQuery(data: FormData, names: readonly string[]): string {
  const query = new URLSearchParams();
  for (const [name, value] of data.entries()) {
    if (names.includes(name) && typeof value === 'string' && value && name !== 'page' && !/password|token|secret|csrf/i.test(name)) query.append(name, value);
  }
  return query.toString();
}

function button(label: string): HTMLButtonElement {
  const control = document.createElement('button');
  control.type = 'button';
  control.textContent = label;
  return control;
}

export function enhanceRegisterFilters(root: ParentNode = document): void {
  const account = document.querySelector<HTMLElement>('[data-preference-account]')?.dataset.preferenceAccount ?? '';
  root.querySelectorAll<HTMLFormElement>('form.filters[method="get"], form[role="search"][method="get"]').forEach((form) => {
    if (form.dataset.registerEnhanced || !form.closest('#main-content') || window.location.pathname === '/search') return;
    form.dataset.registerEnhanced = 'true';
    const fields = Array.from(form.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input[name], select[name]'));
    const names = fields.map((field) => field.name);
    const applied = new URLSearchParams(window.location.search);
    const chips = document.createElement('nav');
    chips.className = 'applied-filters';
    chips.setAttribute('aria-label', 'Applied filters');
    for (const [name, value] of applied) {
      if (!value || !names.includes(name) || ['page', 'limit', 'tab', 'sort', 'direction'].includes(name)) continue;
      const field = fields.find((item) => item.name === name);
      const label = field?.labels?.[0]?.textContent?.split('\n')[0]?.trim() || name;
      const next = new URLSearchParams(applied);
      next.delete(name);
      next.delete('page');
      const chip = document.createElement('a');
      chip.href = `${window.location.pathname}?${next}`;
      chip.textContent = `${label}: ${value}`;
      chip.setAttribute('aria-label', `Remove ${label} filter: ${value}`);
      chips.append(chip);
    }
    if (chips.childElementCount) {
      const clear = document.createElement('a');
      const next = new URLSearchParams();
      if (applied.has('tab')) next.set('tab', applied.get('tab')!);
      clear.href = `${window.location.pathname}${next.size ? `?${next}` : ''}`;
      clear.textContent = 'Clear all filters';
      chips.append(clear);
      form.append(chips);
    }
    const groups = Array.from(form.children).filter((child) => child.matches('label, .field, .filter-field') && child.querySelector('input[name],select[name]'));
    if (groups.length > 3 && !form.querySelector('[data-advanced-filters]')) {
      const details = document.createElement('details');
      details.className = 'advanced-filters';
      details.dataset.advancedFilters = 'true';
      const summary = document.createElement('summary');
      const advanced = groups.slice(3);
      const active = advanced.flatMap((group) => Array.from(group.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input[name],select[name]'))).filter((field) => (field instanceof HTMLInputElement && ['checkbox', 'radio'].includes(field.type) ? field.checked : Boolean(field.value))).length;
      summary.textContent = active ? `More filters (${active} applied)` : 'More filters';
      details.append(summary);
      const content = document.createElement('div');
      content.className = 'advanced-filter-fields';
      advanced.forEach((group) => content.append(group));
      details.append(content);
      form.insertBefore(details, form.querySelector('.filters-actions') ?? null);
    }
    const status = form.querySelector<HTMLElement>('.submit-status') ?? document.createElement('p');
    if (!status.parentNode) {
      status.className = 'submit-status';
      status.setAttribute('role', 'status');
      status.hidden = true;
      form.append(status);
      form.addEventListener('submit', () => { form.setAttribute('aria-busy', 'true'); status.textContent = 'Updating results...'; status.hidden = false; });
    }
    const key = registerPreferenceKey(account, window.location.pathname);
    if (!key || names.length === 0) return;
    let presets: FilterPreset[] = [];
    try { presets = readFilterPresets(localStorage.getItem(key), names); } catch { /* Filtering remains usable without persistence. */ }
    const controls = document.createElement('div');
    controls.className = 'filter-presets';
    const name = document.createElement('input');
    name.type = 'text';
    name.maxLength = 60;
    name.setAttribute('aria-label', 'Filter preset name');
    name.placeholder = 'Preset name';
    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Preset name';
    nameLabel.append(name);
    const picker = document.createElement('select');
    picker.setAttribute('aria-label', 'Saved filter presets');
    const render = () => {
      picker.replaceChildren(new Option('Saved filters', ''));
      presets.forEach((preset, index) => picker.add(new Option(preset.name, String(index))));
    };
    render();
    const save = button('Save filters');
    const remove = button('Delete preset');
    const feedback = document.createElement('span');
    feedback.setAttribute('role', 'status');
    const persist = () => {
      try { localStorage.setItem(key, JSON.stringify(presets)); feedback.textContent = 'Saved on this device.'; }
      catch { feedback.textContent = 'Browser storage is unavailable. Filters are kept for this page only.'; }
      render();
    };
    save.addEventListener('click', () => {
      if (!name.value.trim()) { feedback.textContent = 'Enter a preset name.'; name.focus(); return; }
      const query = presetQuery(new FormData(form), names);
      if (query.length > 2048) { feedback.textContent = 'These filters are too long to save.'; return; }
      presets = [{ name: name.value.trim(), query }, ...presets.filter((preset) => preset.name !== name.value.trim())].slice(0, 10);
      persist();
    });
    picker.addEventListener('change', () => {
      if (picker.value === '') return;
      const preset = presets[Number(picker.value)];
      if (preset) window.location.assign(`${window.location.pathname}${preset.query ? `?${preset.query}` : ''}`);
    });
    remove.addEventListener('click', () => {
      if (picker.value === '') { feedback.textContent = 'Select a saved preset.'; picker.focus(); return; }
      presets.splice(Number(picker.value), 1);
      persist();
    });
    controls.append(picker, nameLabel, save, remove, feedback);
    form.append(controls);
  });
}

export function enhanceRegisterTables(root: ParentNode = document): void {
  const path = window.location.pathname.replace(/\/$/, '');
  const registers = ['/tasks', '/audit', '/notifications', '/change-requests', '/documents', '/approvals', '/reject-reports', '/quality/findings', '/quality/ncr', '/quality/rca', '/quality/capa', '/quarantine/receiving', '/quarantine/inspections', '/laboratory/tests', '/assets/equipment', '/assets/calibrations', '/assets/maintenance', '/admin/users', '/admin/roles', '/admin/permissions', '/admin/scopes', '/system/backups'];
  if (!registers.includes(path)) return;
  root.querySelectorAll<HTMLTableElement>('#main-content table').forEach((table) => {
    if (table.dataset.responsiveRegister || !table.caption) return;
    const headings = Array.from(table.querySelectorAll<HTMLTableCellElement>('thead th')).map((cell) => cell.textContent?.trim() ?? '');
    const rows = Array.from(table.querySelectorAll<HTMLTableRowElement>('tbody tr'));
    if (!headings.length || rows.some((row) => Array.from(row.cells).some((cell) => cell.colSpan !== 1 || cell.rowSpan !== 1))) return;
    table.dataset.responsiveRegister = 'true';
    table.setAttribute('role', 'table');
    table.querySelector('thead')?.setAttribute('role', 'rowgroup');
    table.querySelector('tbody')?.setAttribute('role', 'rowgroup');
    table.querySelectorAll('thead tr').forEach((row) => row.setAttribute('role', 'row'));
    table.querySelectorAll('thead th').forEach((cell) => cell.setAttribute('role', 'columnheader'));
    rows.forEach((row) => {
      row.setAttribute('role', 'row');
      const identity = row.querySelector('th[scope="row"]');
      const reference = identity?.querySelector('a')?.getAttribute('href') ?? identity?.textContent?.trim();
      if (reference) row.dataset.rowIdentity = reference;
      Array.from(row.cells).forEach((cell, index) => {
        cell.dataset.columnLabel = headings[index];
        cell.setAttribute('role', cell.matches('th[scope="row"]') ? 'rowheader' : 'cell');
      });
    });
  });
}
