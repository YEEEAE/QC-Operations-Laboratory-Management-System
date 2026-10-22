import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync(
  new URL('../../../src/pages/assets/equipment/new.astro', import.meta.url),
  'utf8',
);

describe('equipment create form surface', () => {
  it('preserves the native action and all existing field names and values', () => {
    expect(page).toContain('method="post" data-action="assets.createEquipment"');
    for (const name of [
      'equipmentNo',
      'name',
      'manufacturer',
      'model',
      'serialNo',
      'location',
      'calibrationRequired',
      'maintenanceRequired',
    ])
      expect(page).toContain(`name="${name}"`);
    for (const value of [
      'values.equipmentNo',
      'values.name',
      'values.manufacturer',
      'values.model',
      'values.serialNo',
      'values.location',
      'values.calibrationRequired',
      'values.maintenanceRequired',
    ])
      expect(page).toContain(value);
    expect(page).toContain('actions.assets.createEquipment');
    expect(page).toContain('guardUnsavedChanges(form)');
  });

  it('states why source eligibility and histories are unavailable for an uncreated draft', () => {
    expect(page).toContain('no equipment record exists yet');
    expect(page).toContain('no calibration record is linked to this draft');
    expect(page).toContain('no maintenance record is linked to this draft');
    expect(page).toContain('View equipment records and history');
    expect(page).not.toMatch(/MAKE_CURRENT|VOID|data-export/);
  });

  it('uses one column by default and two columns only at the wide breakpoint', () => {
    expect(page).toContain('.fields{display:grid;grid-template-columns:minmax(0,1fr)');
    expect(page).toContain(
      '@media(min-width:60rem){.fields{grid-template-columns:repeat(2,minmax(0,1fr))}}',
    );
    expect(page).toContain('min-block-size:44px');
    expect(page).toContain('aria-describedby={failure?.fieldErrors.equipmentNo');
    expect(page).toContain('class="result-status" role="status" data-result');
  });

  it('preserves the existing create and navigation actions without filters or export', () => {
    expect(page).toContain('<button type="submit" data-submit>Create draft</button>');
    expect(page).toContain('class="secondary" href={LIST_HREF}>Cancel</a>');
    expect(page).toContain('href="/assets/equipment">Back to equipment</a>');
    expect(page).not.toMatch(/FilterBar|AppliedFilters|Pagination|data-export/);
  });
});
