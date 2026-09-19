import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

/**
 * Design-system governance contract (QC-100-FINAL-005 item 4 + domains 68/69/70).
 *
 * Rules enforced:
 *  - the shared UI layer never renders type below the approved 12px floor;
 *  - layouts use logical properties only, so an RTL mirror is a direction
 *    change and not a rewrite;
 *  - UI chrome consumes tokens, never raw hex;
 *  - user-facing dates go through the shared Riyadh formatter;
 *  - the page-level type-floor debt is ratcheted so it can only shrink.
 */

const projectRoot = fileURLToPath(new URL('../../..', import.meta.url));
const read = (relative: string): string => readFileSync(join(projectRoot, relative), 'utf8');

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(join(projectRoot, dir))) {
    const rel = `${dir}/${entry}`;
    if (statSync(join(projectRoot, rel)).isDirectory()) walk(rel, out);
    else out.push(rel);
  }
  return out;
}

const MIN_FONT_PX = 12;
const uiStyleFiles = walk('src/ui').filter((path) => /\.(astro|css)$/.test(path));
const pageFiles = walk('src/pages')
  .filter((path) => path.endsWith('.astro'))
  .sort();

/** All declared font sizes in px (rem is converted at 16px). */
function subFloorFontSizes(source: string): string[] {
  const found: string[] = [];
  for (const match of source.matchAll(/font-size:\s*([^;}\n]+)/g)) {
    const value = match[1].trim();
    const rem = /^(-?[0-9.]+)rem$/.exec(value);
    const px = /^(-?[0-9.]+)px$/.exec(value);
    if (rem && Number(rem[1]) * 16 < MIN_FONT_PX) found.push(value);
    else if (px && Number(px[1]) < MIN_FONT_PX) found.push(value);
  }
  return found;
}

const PHYSICAL_PROPERTY =
  /(?:margin|padding|border)-(?:left|right)\s*:|[;{\s](?:left|right)\s*:|text-align:\s*(?:left|right)/;

/**
 * Pages still formatting dates ad hoc instead of through the shared formatter.
 * Each entry must move to `formatDate`/`formatDateTime`; the list may only
 * shrink. Owner: 018 for copy-sensitive surfaces, 005-B for the rest.
 */
const ADHOC_DATE_PAGES = [
  'src/pages/admin/users/[userId].astro',
  'src/pages/approvals/[approvalId].astro',
  'src/pages/assets/calibrations/[calibrationId].astro',
  'src/pages/assets/equipment/[equipmentId].astro',
  'src/pages/assets/maintenance/[maintenanceId].astro',
  'src/pages/documents/[documentId]/index.astro',
  'src/pages/documents/[documentId]/versions/[versionId]/index.astro',
  'src/pages/documents/index.astro',
  'src/pages/quality/findings/index.astro',
  'src/pages/quarantine/inspections/[inspectionId]/index.astro',
  'src/pages/quarantine/receiving/[receivingId].astro',
  'src/pages/reject-reports/daily/[reportId].astro',
  'src/pages/reject-reports/index.astro',
  'src/pages/reject-reports/issue-slips/[reportId].astro',
  'src/pages/system/backups/[backupId]/index.astro',
  'src/pages/system/backups/[backupId]/restore.astro',
  'src/pages/system/backups/index.astro',
  'src/pages/system/control-center.astro',
  'src/pages/tasks/[taskId].astro',
];

/**
 * Page-level type-floor debt that this phase did not own. Measured on the
 * frozen candidate: 71 occurrences across 51 page files (largest: the reject
 * report surfaces, backups, control center, health). The ceiling may only go
 * down; the pages this phase touched must already be at zero.
 */
const PAGE_TYPE_FLOOR_CEILING_TOTAL = 71;

/** Pages this phase touched: they must carry no sub-floor type at all. */
const PHASE_OWNED_PAGES = [
  'src/pages/admin/index.astro',
  'src/pages/assets/calibrations/index.astro',
  'src/pages/assets/equipment/index.astro',
  'src/pages/assets/maintenance/index.astro',
  'src/pages/audit.astro',
  'src/pages/change-requests/[changeRequestId]/review.astro',
  'src/pages/change-requests/index.astro',
  'src/pages/tasks/index.astro',
];

describe('design tokens — typography floor', () => {
  it('defines 12px as the small-text floor token', () => {
    const tokens = read('src/ui/styles/tokens.css');
    expect(tokens).toMatch(/--font-size-xs:\s*0\.75rem/);
  });

  it('renders no shared-component type below the 12px floor', () => {
    const offenders = uiStyleFiles
      .map((file) => ({ file, sizes: subFloorFontSizes(read(file)) }))
      .filter((entry) => entry.sizes.length > 0);
    expect(offenders).toEqual([]);
  });

  it('keeps the pages this phase touched at the 12px floor', () => {
    const offenders = PHASE_OWNED_PAGES.map((file) => ({
      file,
      sizes: subFloorFontSizes(read(file)),
    })).filter((entry) => entry.sizes.length > 0);
    expect(offenders).toEqual([]);
  });

  it('keeps the remaining page-level type-floor debt inside the recorded ceiling', () => {
    const total = pageFiles.reduce((sum, file) => sum + subFloorFontSizes(read(file)).length, 0);
    expect(total).toBeLessThanOrEqual(PAGE_TYPE_FLOOR_CEILING_TOTAL);
  });
});

describe('design tokens — direction independence (RTL readiness)', () => {
  it('uses logical properties only in pages and shared UI', () => {
    const offenders = [...pageFiles, ...uiStyleFiles].filter((file) =>
      PHYSICAL_PROPERTY.test(read(file)),
    );
    expect(offenders).toEqual([]);
  });

  it('maps the sans family per direction instead of hard-coding one script', () => {
    const tokens = read('src/ui/styles/tokens.css');
    expect(tokens).toContain('--font-arabic:');
    expect(tokens).toMatch(/\[dir='rtl'\]\s*\{[^}]*--font-sans:\s*var\(--font-arabic\)/);
  });

  it('mirrors the tooltip anchor instead of pinning it to the left', () => {
    const tooltip = read('src/ui/components/Tooltip.astro');
    expect(tooltip).toContain('inset-inline-start: 50%');
    expect(tooltip).toMatch(/\[dir="rtl"\]\s*\.tooltip/);
  });

  it('carries an explicit locale/direction contract into the shell', () => {
    const layout = read('src/ui/layouts/AppLayout.astro');
    expect(layout).toContain('locale');
    expect(layout).toContain('direction');
  });
});

describe('design tokens — colour and date contracts', () => {
  it('consumes tokens instead of raw hex in UI chrome', () => {
    const chrome = walk('src/ui/components')
      .concat(walk('src/ui/shell'), walk('src/ui/charts'), walk('src/ui/layouts'))
      .filter((path) => /\.(astro|css)$/.test(path))
      .filter((path) => !path.endsWith('QCLogin3DBackground.astro'));
    const offenders = chrome.filter((file) => /#[0-9a-fA-F]{3,8}\b/.test(read(file)));
    expect(offenders).toEqual([]);
  });

  it('keeps one approved Riyadh date/time formatter as the display contract', () => {
    const format = read('src/shared/copy/format.ts');
    expect(format).toContain("const TIME_ZONE = 'Asia/Riyadh'");
    expect(format).toContain("const LOCALE = 'en-GB'");
    expect(format).toContain('export function formatDate');
    expect(format).toContain('export function formatDateTime');
  });

  it('cannot grow the ad-hoc date-rendering list', () => {
    const adHoc = pageFiles.filter((file) => /toLocale(?:Date|Time)?String/.test(read(file)));
    expect(adHoc).toEqual(ADHOC_DATE_PAGES);
  });
});
