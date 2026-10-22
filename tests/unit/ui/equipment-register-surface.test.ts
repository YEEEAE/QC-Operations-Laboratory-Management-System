import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync(
  new URL('../../../src/pages/assets/equipment/index.astro', import.meta.url),
  'utf8',
);

describe('equipment register surface', () => {
  it('keeps the bounded equipment read, GET filters, applied filters, and pagination', () => {
    for (const content of [
      'equipment.list.executePage',
      'name="q"',
      'name="state"',
      'AppliedFilters',
      'Pagination',
      'Equipment number',
      'Name',
      'Model / serial',
      'Operational state',
      'Location and requirements',
      'Version',
    ])
      expect(page).toContain(content);
    expect(page).toContain("params.get('page')");
    expect(page).toContain('next.delete(drop)');
    expect(page).toContain("next.delete('page')");
    expect(page).toContain('State filter was not applied');
  });

  it('renders source-derived eligibility and linked calibration/maintenance records as text', () => {
    expect(page).toContain('assessEligibility.assessMany(actor, equipmentIds)');
    expect(page).toContain('assessEligibility.assess(actor, id)');
    expect(page).toContain('assessment.eligible');
    expect(page).toContain('assessment.calibrationState');
    expect(page).toContain('assessment.maintenanceState');
    expect(page).toContain('assessment.dueDate');
    expect(page).toContain('item.calibrationRequired');
    expect(page).toContain('item.maintenanceRequired');
    for (const reason of [
      'UNDER_MAINTENANCE',
      'OUT_OF_SERVICE',
      'NOT_ACTIVE',
      'NO_CURRENT_CALIBRATION',
      'CALIBRATION_NOT_CURRENT',
      'CALIBRATION_EXPIRED',
    ])
      expect(page).toContain(reason);
    expect(page).toContain('Not confirmed');
    expect(page).toContain('could not be confirmed');
  });

  it('keeps identifiers readable and the wide table keyboard-scrollable', () => {
    expect(page).toContain('role="region"');
    expect(page).toContain('tabindex="0"');
    expect(page).toContain('aria-label="Equipment register table"');
    expect(page).toContain('data-scroll-region');
    expect(page).toContain('overflow-wrap:anywhere');
    expect(page).toContain('word-break:break-word');
    expect(page).toContain(':focus-visible');
    expect(page).not.toMatch(/text-overflow|line-clamp/i);
    expect(page).not.toMatch(/\.identifier\s*\{[^}]*white-space:\s*nowrap/i);
    expect(page).not.toMatch(/\.long-value\s*\{[^}]*white-space:\s*nowrap/i);
  });

  it('preserves only existing create and read navigation; adds no export or state transition', () => {
    expect(page).toContain("permission.code === 'PERM-EQP-CREATE'");
    expect(page).toContain('href="/assets/equipment/new"');
    expect(page).toContain('`/assets/equipment/${item.id}`');
    expect(page).toContain('`/assets/calibrations/${item.currentCalibrationId}`');
    expect(page).not.toMatch(
      /MAKE_CURRENT|VOID|assetsActionDependencies|expectedVersion|requestId|csrf|data-export|transitionCalibration|transitionMaintenance/i,
    );
  });

  it('keeps provider failure, filtered empty, and truly empty states distinct', () => {
    expect(page).toContain('classifyReadFailure(error)');
    expect(page).toContain('<ProviderUnavailableState');
    expect(page).toContain('equipment.length ?');
    expect(page).toContain('No equipment matches these filters');
    expect(page).toContain('No equipment yet');
  });
});
