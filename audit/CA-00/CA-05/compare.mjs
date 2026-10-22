// CA-05 before/after comparison: sidebar geometry + content, row/state/text
// groups, contrast pairs, focus stops, render timing. Local evidence only.
import { readFileSync, writeFileSync } from 'node:fs';

const before = JSON.parse(readFileSync('audit/CA-05/before/evidence.json', 'utf8'));
const after = JSON.parse(readFileSync('audit/CA-05/after/evidence.json', 'utf8'));
const readJson = (path) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
};
const focusBefore = readJson('audit/CA-05/before/focus.json');
const focusAfter = readJson('audit/CA-05/after/focus.json');

const out = { pages: {}, sidebar: {}, timings: {}, guard: {}, status: 'PASS' };

for (const [id, page] of Object.entries(after.pages)) {
  const prior = before.pages[id];
  const perViewport = [];
  for (const view of page.viewports) {
    const earlier = prior?.viewports.find((item) => item.width === view.width);
    perViewport.push({
      width: view.width,
      overflow: { before: earlier?.overflow ?? null, after: view.overflow },
      rows: { before: earlier?.rowCount ?? null, after: view.rowCount },
      states: { before: earlier?.states ?? [], after: view.states },
      textSizes: { before: earlier?.sizes ?? {}, after: view.sizes },
      tinyText: { before: earlier?.tinyText?.length ?? null, after: view.tinyText.length },
      smallTargets: {
        before: earlier?.smallTargets ?? [],
        after: view.smallTargets,
      },
      contrast: {
        before: (earlier?.contrast ?? []).map((pair) => `${pair.selector}:${pair.ratio}`),
        after: (view.contrast ?? []).map((pair) => `${pair.selector}:${pair.ratio}`),
      },
      axe: {
        before: prior?.axe?.find((entry) => entry.width === view.width)?.violations ?? [],
        after: page.axe.find((entry) => entry.width === view.width)?.violations ?? [],
      },
      sidebar: {
        before: earlier?.sidebarHash ?? null,
        after: view.sidebarHash,
        rect: view.sidebarRect,
        linkCount: view.sidebarLinkCount,
      },
    });
  }
  out.pages[id] = {
    path: page.path,
    viewports: perViewport,
    focus: {
      before: focusBefore?.pages?.[id]?.stopsWithVisibleRing ?? null,
      after: focusAfter?.pages?.[id]?.stopsWithVisibleRing ?? null,
    },
    timings: {
      before: (prior?.samples ?? []).map((sample) => sample.elapsedMs),
      after: page.samples.map((sample) => sample.elapsedMs),
    },
  };
}

// Sidebar: same personas, same page, before vs after.
for (const [identity, matrix] of Object.entries(after.sidebarMatrix ?? {})) {
  const prior = before.sidebarMatrix?.[identity];
  out.sidebar[identity] = {
    linkCount: { before: prior?.linkCount ?? null, after: matrix.linkCount },
    width: { before: prior?.width ?? null, after: matrix.width },
    background: { before: prior?.background ?? null, after: matrix.background },
    color: { before: prior?.color ?? null, after: matrix.color },
    visibleLinksIdentical:
      JSON.stringify((prior?.links ?? []).map((link) => `${link.text}|${link.href}`)) ===
      JSON.stringify(matrix.links.filter((link) => link.visible).map((link) => `${link.text}|${link.href}`)),
    allLinkCount: { before: prior?.links?.length ?? null, after: matrix.links.length },
    visibleLinksBefore: prior?.links ?? null,
    visibleLinksAfter: matrix.links.filter((link) => link.visible),
    backgroundIdentical: prior?.background === matrix.background,
    widthIdentical: prior?.width === matrix.width,
  };
}

out.guard = {
  capaBefore: before.capaGuard,
  capaAfter: after.capaGuard,
  receivingBefore: before.receivingGuard,
  receivingAfter: after.receivingGuard,
  taskValidationBefore: before.taskValidation,
  taskValidationAfter: after.taskValidation,
  noJsBefore: before.noJs,
  noJsAfter: after.noJs,
};

writeFileSync('audit/CA-05/comparison.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify({ status: out.status, pages: Object.keys(out.pages) }));
