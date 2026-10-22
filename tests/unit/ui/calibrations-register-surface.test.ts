import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync(
  new URL('../../../src/pages/assets/calibrations/index.astro', import.meta.url),
  'utf8',
);

describe('calibrations register surface', () => {
  it('retains the native filters, applied-filter links, record fields and pagination', () => {
    for (const content of [
      '<FilterBar',
      'name="q"',
      'name="state"',
      'name="equipmentId"',
      'Calibration number',
      'Equipment',
      'Calibration state',
      'Calibration date',
      'Due date',
      'Certificate',
      'AppliedFilters',
      'Pagination',
      'calibration.list.executePage',
    ])
      expect(page).toContain(content);
  });

  it('reads equipment eligibility and in-progress maintenance from the existing source', () => {
    expect(page).toContain('assessEligibility.assessMany(');
    expect(page).toContain('assessEligibility.assess(actor, id)');
    expect(page).toContain('equipmentStateText');
    expect(page).toContain('No in-progress maintenance recorded');
    expect(page).toContain('Eligible for laboratory and inspection use');
    for (const reason of [
      'UNDER_MAINTENANCE',
      'OUT_OF_SERVICE',
      'NOT_ACTIVE',
      'NO_CURRENT_CALIBRATION',
      'CALIBRATION_NOT_CURRENT',
      'CALIBRATION_EXPIRED',
    ])
      expect(page).toContain(reason);
    expect(page).toContain('could not be confirmed');
  });

  it('keeps write actions out, preserves detail navigation, and makes the wide table reachable', () => {
    expect(page).toContain('href="/assets/calibrations/new"');
    expect(page).toContain('`/assets/calibrations/${record.id}`');
    expect(page).toContain('`/assets/equipment/${record.equipmentId}`');
    expect(page).toContain('role="region"');
    expect(page).toContain('tabindex="0"');
    expect(page).toContain('aria-label="Calibration records table"');
    expect(page).toContain('overflow-wrap:anywhere');
    expect(page).toContain('focus-visible');
    expect(page).not.toMatch(
      /MAKE_CURRENT|assetsActionDependencies|expectedVersion|data-export|createCalibration|transitionCalibration/i,
    );
  });

  it('keeps provider unavailability, true empty and filtered empty separate', () => {
    expect(page).toContain('providerUnavailable ?');
    expect(page).toContain('<ProviderUnavailableState');
    expect(page).toContain('records.length ?');
    expect(page).toContain('No calibration records match these filters');
    expect(page).toContain('No calibration records yet');
  });
});
