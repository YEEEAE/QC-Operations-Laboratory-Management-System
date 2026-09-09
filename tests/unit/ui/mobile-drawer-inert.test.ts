import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * BI-01 guards: the open mobile navigation drawer must isolate the
 * background from keyboard and assistive-technology interaction.
 *
 * The drawer reuses the existing native `inert` approach: while open at the
 * mobile breakpoint the `.app-workspace` subtree is inert, background
 * scrolling is locked, Tab/Shift+Tab stays inside the drawer, Escape closes
 * it, and focus returns to the navigation toggle. Closing the drawer or
 * leaving the breakpoint must remove every temporary inert/scroll-lock
 * state. Browser behavior is proven separately in
 * `tests/e2e/mobile-drawer-inert.spec.ts`; these assertions run in unit CI
 * without a browser and fail fast on regression.
 *
 * Server authorization and navigation visibility are out of scope here: the
 * layout frontmatter must keep deriving capabilities from the actor and must
 * not gate routes client-side.
 */

const readRepo = (path: string) =>
  readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

const layout = () => readRepo('src/ui/layouts/AppLayout.astro');

describe('BI-01 mobile drawer background isolation', () => {
  it('exposes the workspace as a separate inert-able subtree', () => {
    const source = layout();
    expect(source).toContain('data-app-workspace');
    expect(source).toContain("querySelector<HTMLElement>('[data-app-workspace]')");
  });

  it('makes the workspace inert and locks background scroll while open at the mobile breakpoint', () => {
    const source = layout();
    expect(source).toContain("workspace?.setAttribute('inert', '')");
    expect(source).toContain("document.body.style.overflow = 'hidden'");
    // The open branch must remove the drawer's own parked inert state first.
    expect(source).toContain("sidebarPanel.removeAttribute('inert')");
  });

  it('keeps focus inside the drawer on Tab and Shift+Tab', () => {
    const source = layout();
    expect(source).toContain("event.key === 'Tab'");
    expect(source).toContain('event.shiftKey');
    expect(source).toContain('drawerFocusables()');
    expect(source).toContain('last.focus()');
    expect(source).toContain('first.focus()');
    expect(source).toContain('getClientRects().length > 0');
  });

  it('closes on Escape and returns focus to the navigation toggle', () => {
    const source = layout();
    expect(source).toContain("event.key === 'Escape'");
    expect(source).toContain('returnFocus');
    expect(source).toContain('setMobileNav(false, { returnFocus: true })');
    expect(source).toContain('navigationToggle?.focus()');
  });

  it('moves focus to the first drawer destination on open', () => {
    const source = layout();
    expect(source).toContain('focusPanel');
    expect(source).toContain("querySelector<HTMLElement>('a[href]')");
    expect(source).toContain('aria-expanded');
  });

  it('removes every temporary inert/scroll-lock state when closed or leaving the breakpoint', () => {
    const source = layout();
    expect(source).toContain("workspace?.removeAttribute('inert')");
    expect(source).toContain("document.body.style.overflow = ''");
    expect(source).toContain("sidebarPanel.setAttribute('inert', '')");
    // Breakpoint listener must handle both entering and leaving mobile.
    expect(source).toContain("mobileQuery.addEventListener?.('change'");
    expect(source).toContain('Leaving the mobile breakpoint');
  });

  it('honors reduced motion instead of animating focus or scroll', () => {
    const source = layout();
    expect(source).toContain('@media (prefers-reduced-motion: reduce)');
    expect(source).toContain('transition:none');
    expect(source).not.toContain('smooth');
  });

  it('does not alter server authorization or navigation visibility', () => {
    const source = layout();
    expect(source).toContain('Astro.locals.actor');
    expect(source).toContain('activeCapabilities');
    expect(source).toContain('routeBreadcrumbs(Astro.url.pathname)');
    expect(source).not.toContain('PERM-');
  });
});
