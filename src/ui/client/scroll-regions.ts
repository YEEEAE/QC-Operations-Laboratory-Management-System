/**
 * Keyboard access for horizontally scrollable table regions.
 *
 * A scroll container that only responds to the mouse is a WCAG 2.1.1 failure
 * (axe rule `scrollable-region-focusable`). Registers render `.table-wrap` /
 * `.table-scroll` containers whose width depends on the viewport, so the fix
 * belongs here rather than in thirty page templates:
 *
 *  - only a region that actually overflows at the current viewport is marked;
 *  - the accessible name comes from the table's own `<caption>`, so nothing is
 *    invented and no page-specific copy is duplicated;
 *  - attributes are only ever added for this enhancement, never removed, so a
 *    page that already declares its own region (e.g. the report grid) keeps its
 *    authored contract at every viewport.
 */
const REGION_SELECTOR = '.table-wrap, .table-scroll';

function syncRegion(region: HTMLElement): void {
  const overflowsInline = region.scrollWidth - region.clientWidth > 1;
  const overflowsBlock = region.scrollHeight - region.clientHeight > 1;
  if (!overflowsInline && !overflowsBlock) return;
  if (region.dataset.scrollRegion === 'true') return;
  region.dataset.scrollRegion = 'true';
  if (!region.hasAttribute('tabindex')) region.setAttribute('tabindex', '0');
  if (!region.hasAttribute('role')) region.setAttribute('role', 'region');
  if (!region.hasAttribute('aria-label') && !region.hasAttribute('aria-labelledby')) {
    const caption = region.querySelector('caption')?.textContent?.trim();
    region.setAttribute('aria-label', caption ? `${caption} — scrollable` : 'Scrollable table');
  }
}

/** Marks every overflowing table region in the document as keyboard reachable. */
export function initScrollRegions(root: ParentNode = document): void {
  for (const region of root.querySelectorAll<HTMLElement>(REGION_SELECTOR)) syncRegion(region);
}

/** Re-evaluates regions when the viewport changes (cheap, debounced by rAF). */
export function watchScrollRegions(): void {
  let scheduled = false;
  const run = () => {
    scheduled = false;
    initScrollRegions();
  };
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(run);
  };
  window.addEventListener('resize', schedule, { passive: true });
}
