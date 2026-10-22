import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync(
  new URL('../../../src/pages/assets/calibrations/new.astro', import.meta.url),
  'utf8',
);

describe('calibration create form surface', () => {
  it('preserves the native create action and every existing field name', () => {
    expect(page).toContain('method="post" data-action="assets.createCalibration"');
    for (const name of [
      'calibrationNo',
      'equipmentId',
      'calibrationDate',
      'dueDate',
      'provider',
      'certificateNo',
      'result',
    ])
      expect(page).toContain(`name="${name}"`);
    expect(page).toContain('name="calibrationNo" required value={values.calibrationNo}');
    expect(page).toContain('name="equipmentId" required');
    expect(page).toContain('name="calibrationDate" type="date" required value={values.calibrationDate}');
    expect(page).toContain('name="dueDate" type="date" value={values.dueDate}');
    expect(page).toContain('name="provider" value={values.provider}');
    expect(page).toContain('name="certificateNo" value={values.certificateNo}');
    expect(page).toContain('<textarea id="result" name="result" aria-describedby="result-help">{values.result}</textarea>');
  });

  it('keeps source eligibility, the equipment history route, and server-owned authorization', () => {
    expect(page).toContain('assessEligibility.assessMany(');
    expect(page).toContain('equipmentEligibilityOptionLabel(');
    expect(page).toContain('PERM-CAL-CREATE');
    expect(page).toContain('data-equipment-record-link');
    expect(page).toContain('/assets/equipment/${encodeURIComponent(equipmentSelect.value)}');
    expect(page).toContain('assets.createCalibration(payload');
    expect(page).not.toMatch(/MAKE_CURRENT|action="VOID"/);
  });

  it('uses one mobile column and only pairs independent fields on wide screens', () => {
    expect(page).toContain('.fields{display:grid;grid-template-columns:minmax(0,1fr)');
    expect(page).toContain('@media(min-width:64rem){.fields{grid-template-columns:repeat(2,minmax(0,1fr))}.field--paired{grid-column:auto}.field:not(.field--paired){grid-column:1/-1}}');
    expect(page).toContain('min-block-size:max(var(--control-height),44px)');
    expect(page).toContain('role="status" data-result');
    expect(page).toContain('aria-describedby="dueDate-help"');
    expect(page).toContain('prefers-reduced-motion:reduce');
    expect(page).toContain('forced-colors:active');
  });

  it('does not expose calibration transition actions from the create page', () => {
    expect(page).not.toMatch(/transitionCalibration|MAKE_CURRENT|MARK_OVERDUE|VOID|data-export/);
    expect(page).toContain('<button type="submit" data-submit>Create draft</button>');
    expect(page).toContain('href={returnHref}>Cancel</a>');
    expect(page).toContain('href={returnHref}>Back to calibrations</a>');
  });
});
