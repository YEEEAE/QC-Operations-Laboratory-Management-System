import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const exec = (args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const read = (path) => readFileSync(path, 'utf8');

const before = JSON.parse(read('audit/CA-P-500/before/evidence.json'));
const after = JSON.parse(read('audit/CA-P-500/after/evidence.json'));

// 1. Shared layer and shell must be untouched by this page task.
const sidebar = 'src/ui/shell/Sidebar.astro';
const baseLayout = 'src/ui/layouts/BaseLayout.astro';
const unchangedSources = {};
for (const file of [sidebar, baseLayout]) {
  const head = exec(['show', `HEAD:${file}`]);
  unchangedSources[file] = head === read(file) ? 'IDENTICAL' : 'CHANGED';
  assert.equal(unchangedSources[file], 'IDENTICAL', `${file} changed`);
}
const changedProduct = exec(['diff', '--name-only', 'HEAD'])
  .split('\n')
  .filter((line) => /^(src|db|scripts)\//.test(line));
const outOfScope = changedProduct.filter(
  (line) => !line.startsWith('src/pages/') && !line.startsWith('scripts/'),
);
assert.deepEqual(outOfScope, [], `non-page product source changed: ${outOfScope.join(', ')}`);

// 2. Same conditions and same data in both phases.
assert.equal(before.node, after.node, 'runtime differs between phases');
assert.equal(after.status, 'PASS', `after runner failed: ${after.error ?? ''}`);
assert.ok(before.status >= 500 && after.status >= 500, 'error status contract');
const widths = [320, 390, 768, 1024, 1440];
assert.deepEqual(
  before.checks.map((entry) => entry.width),
  widths,
);
assert.deepEqual(
  after.checks.map((entry) => entry.width),
  widths,
);

const rows = [];
for (const width of widths) {
  const b = before.checks.find((entry) => entry.width === width);
  const a = after.checks.find((entry) => entry.width === width);
  // Invariants that must not move with the presentation change.
  assert.equal(a.title, b.title, `title@${width}`);
  assert.equal(a.lang, b.lang, `lang@${width}`);
  assert.equal(a.direction, b.direction, `dir@${width}`);
  assert.equal(a.visualDirection, b.visualDirection, `visualDirection@${width}`);
  assert.deepEqual(a.headings, b.headings, `headings@${width}`);
  assert.deepEqual(a.actionLinks, b.actionLinks, `action links@${width}`);
  assert.equal(a.referenceText?.startsWith('Reference:'), true, `reference@${width}`);
  assert.equal(b.referenceText?.startsWith('Reference:'), true, `reference@${width}`);
  assert.equal(a.cardCount, 1, `card count@${width}`);
  assert.equal(a.sidebarCount, 0, `sidebar rendered@${width}`);
  // Acceptance gates on the final version.
  assert.equal(a.overflow, 0, `overflow@${width}`);
  assert.equal(a.smallTargets.length, 0, `targets@${width}`);
  assert.equal(a.smallText.length, 0, `text floor@${width}`);
  assert.equal(a.axe.length, 0, `axe@${width}`);
  rows.push({
    width,
    headingCount: a.headings.length,
    actionCount: a.actionLinks.length,
    actionHref: a.actionLinks[0]?.href,
    reference: 'PRESENT_AND_UNCHANGED',
    eyebrowBefore: b.eyebrowCount,
    eyebrowAfter: a.eyebrowCount,
    paragraphsBefore: b.paragraphCount,
    paragraphsAfter: a.paragraphCount,
    referenceFontBefore: b.styles.reference.fontSize,
    referenceFontAfter: a.styles.reference.fontSize,
    referenceColorBefore: b.styles.reference.color,
    referenceColorAfter: a.styles.reference.color,
    targetsBefore: b.smallTargets.length,
    targetsAfter: a.smallTargets.length,
    textUnder12After: a.smallText.length,
    overflowAfter: a.overflow,
    axeAfter: a.axe.length,
  });
}

// 3. The only intended visual/copy delta: the duplicated eyebrow is gone, so the
// surface carries one heading and one consolidated message, with the same single
// recovery action and the same request reference.
for (const row of rows) {
  assert.equal(row.eyebrowBefore, 1, 'baseline carried the duplicated eyebrow');
  assert.equal(row.eyebrowAfter, 0, 'eyebrow still duplicated');
  assert.equal(row.paragraphsBefore, 3);
  assert.equal(row.paragraphsAfter, 2);
}

// 4. Measured contrast on the final version.
for (const pair of after.contrast) {
  assert.equal(pair.missing, undefined, `missing contrast target ${pair.selector}`);
  assert.ok(pair.ratio >= 4.5, `contrast below 4.5:1 for ${pair.selector}`);
}

assert.equal(after.leakMarkers, false, 'raw technical detail leaked');
assert.equal(after.noInlineScript, 0, 'unexpected inline script on the error surface');
assert.equal(after.noJS.actionLinks, 1, 'no-JS recovery action missing');
assert.equal(after.noJS.overflow, 0, 'no-JS overflow');
for (const entry of after.zoom) {
  assert.equal(entry.overflow, 0, `zoom ${entry.label} overflow`);
  assert.equal(entry.smallTargets, 0, `zoom ${entry.label} targets`);
}
for (const entry of after.media) {
  assert.equal(entry.overflow, 0, `media ${JSON.stringify(entry.media)} overflow`);
}
assert.equal(after.personas.employee.action.href, '/dashboard', 'authenticated recovery href');
assert.equal(after.personas.employee.recoveryTarget.path, '/dashboard', 'authenticated recovery target');
assert.equal(after.personas.least.recoveryTarget.path, '/dashboard', 'least recovery target');
assert.equal(after.personas.least.ownerOnlyRoute.status, 404, 'owner-only denial not observed');
assert.equal(after.anonymousAction.href, '/login?returnTo=%2F500', 'anonymous recovery href');
assert.equal(after.anonymousReturn.hiddenReturnTo, '/500', 'anonymous returnTo not preserved');
assert.equal(after.hostileReturnTo.hiddenReturnTo, '/dashboard', 'hostile returnTo not rejected');

const result = {
  task: 'CA-P-500',
  head: exec(['rev-parse', 'HEAD']),
  node: after.node,
  beforeRunnerStatus: before.status,
  afterRunnerStatus: after.status,
  unchangedSources,
  changedProductSources: changedProduct,
  intentionalDeltas: [
    'duplicated lead paragraph (.eyebrow) removed so the surface has one heading and one consolidated message',
    'the page type hierarchy now wins over the shared card default: message 14px/secondary, reference 13px/muted, request id wraps',
  ],
  invariants: [
    'single <h1> and single recovery <a> in every viewport, before and after',
    'recovery href and label unchanged for the anonymous branch; request reference still rendered',
    'no Sidebar on the error surface; one canonical state card region',
  ],
  checks: rows,
  contrast: after.contrast,
  zoom: after.zoom,
  media: after.media,
  noJS: after.noJS,
  keyboard: after.keyboard,
  personas: after.personas,
  anonymous: {
    action: after.anonymousAction,
    return: after.anonymousReturn,
    hostileReturnTo: after.hostileReturnTo,
  },
  consoleErrors: after.consoleErrors,
};
writeFileSync('audit/CA-P-500/comparison.json', JSON.stringify(result, null, 2));
writeFileSync(
  'audit/CA-P-500/source-hashes.json',
  JSON.stringify(
    {
      head: exec(['rev-parse', 'HEAD']),
      sidebarSHA256: createHash('sha256').update(read(sidebar)).digest('hex'),
      baseLayoutSHA256: createHash('sha256').update(read(baseLayout)).digest('hex'),
      pageSHA256: createHash('sha256').update(read('src/pages/500.astro')).digest('hex'),
    },
    null,
    2,
  ),
);
console.log(JSON.stringify({ status: 'PASS', widths: rows.length, zoom: after.zoom.length }));
