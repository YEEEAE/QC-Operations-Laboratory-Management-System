import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync(
  new URL('../../../src/pages/assets/index.astro', import.meta.url),
  'utf8',
);

describe('assets overview presentation contract', () => {
  it('preserves the overview fields, relationships, and control-boundary copy', () => {
    for (const content of [
      'Equipment identity, calibration history, and maintenance work in one authorized workspace.',
      'Equipment register',
      'Identity, operational state, and controlled context',
      'Calibration records',
      'History and source-provided dates',
      'Maintenance',
      'Planned and completed work history',
      'Control boundary',
      'Asset master changes do not rewrite historical Laboratory snapshots. PASS, calibration status, and release are separate controlled facts.',
      '{scopeLabel}',
      '{equipment.length}',
      '{calibrations.length}',
      '{maintenance.length}',
    ]) {
      expect(page).toContain(content);
    }
    expect(page).toContain('title="Asset data is unavailable"');
    expect(page).toContain('description="Asset data could not be loaded. Counts are not shown."');
  });

  it('keeps the three existing destinations and exposes no new filter, export, or mutation', () => {
    expect([...page.matchAll(/href="([^"]+)"/g)].map((match) => match[1])).toEqual([
      '/assets/equipment',
      '/assets/calibrations',
      '/assets/maintenance',
    ]);
    expect(page).not.toMatch(
      /<form|data-(?:filter|export)|MAKE_CURRENT|VOID|expectedVersion|requestId/i,
    );
    expect(page).toContain('assetsReadDependencies()');
    expect(page).not.toContain('assetsActionDependencies()');
  });

  it('prioritizes the existing equipment destination while retaining readable keyboard and responsive treatments', () => {
    expect(page).toContain('class="workspace workspace--next" href="/assets/equipment"');
    expect(page).toContain('aria-label="Asset workspaces"');
    expect(page).toContain('.workspace:focus-visible');
    expect(page).toContain('min-block-size:44px');
    expect(page).toContain('font-size:var(--font-size-sm)');
    expect(page).toContain('@media(max-width:900px)');
    expect(page).toContain('@media(max-width:560px)');
    expect(page).toContain('@media(prefers-reduced-motion:reduce)');
    expect(page).toContain('@media(forced-colors:active)');
  });
});
