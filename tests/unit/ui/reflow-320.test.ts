import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * F-03 reflow guards: static contracts that keep the 320px / 200% zoom fix
 * from regressing. Browser behavior is proven separately in
 * `tests/e2e/reflow-320.spec.ts`; these assertions run in unit CI without a
 * browser and fail fast when a fixed-width or physical-property regression
 * is reintroduced.
 */

const readRepo = (path: string) =>
  readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

describe('F-03 reflow guards at 320px', () => {
  it('does not force a global minimum width on the page', () => {
    const globalCss = readRepo('src/ui/styles/global.css');
    expect(globalCss).not.toMatch(/min-width:\s*320px/);
    expect(globalCss).toMatch(/min-inline-size:\s*0/);
  });

  it('keeps fieldsets and form controls shrinkable inside narrow grids', () => {
    const globalCss = readRepo('src/ui/styles/global.css');
    expect(globalCss).toContain('fieldset');
    expect(globalCss).toMatch(/\.table-wrap,\s*\.table-scroll/);
    expect(globalCss).toMatch(/overflow-x:\s*auto/);
  });

  it('parks the mobile drawer fully off-screen with logical properties', () => {
    const layout = readRepo('src/ui/layouts/AppLayout.astro');
    expect(layout).toContain('inset-inline-start');
    expect(layout).not.toMatch(/\.app-sidebar\s*\{[^}]*\binset:\s*0 auto 0 0/);
    expect(layout).toContain('visibility:hidden');
    expect(layout).toContain('visibility:visible');
    expect(layout).toContain("[dir='rtl'] .app-sidebar");
  });

  it('preserves accessible drawer behavior: inert parking, Escape, focus return', () => {
    const layout = readRepo('src/ui/layouts/AppLayout.astro');
    expect(layout).toContain("setAttribute('inert', '')");
    expect(layout).toContain("removeAttribute('inert')");
    expect(layout).toContain("event.key === 'Escape'");
    expect(layout).toContain('navigationToggle?.focus()');
    expect(layout).toContain('focusPanel');
    expect(layout).toContain('aria-expanded');
  });

  it('mirrors the sidebar active indicator for RTL and collapses the drawer grid', () => {
    const sidebar = readRepo('src/ui/shell/Sidebar.astro');
    expect(sidebar).toContain("[dir='rtl'] .nav-group a.active");
    expect(sidebar).toContain('grid-template-columns:minmax(0,1fr)');
    expect(sidebar).toContain('text-overflow:ellipsis');
  });

  it('uses fluid auto-fit tracks instead of fixed 320px minimums', () => {
    for (const page of [
      'src/pages/admin/scopes/index.astro',
      'src/pages/admin/users/[userId].astro',
      'src/pages/admin/index.astro',
    ]) {
      const source = readRepo(page);
      expect(source, `${page} must not pin a 320px track`).not.toContain('minmax(320px');
      expect(source, `${page} must stay fluid`).toContain('minmax(min(100%');
    }
  });

  it('gives System Health a small-viewport fallback for its header and facts', () => {
    const health = readRepo('src/pages/system/health.astro');
    expect(health).toContain('@media(max-width:650px)');
    expect(health).toContain('.page-head{display:grid}');
    expect(health).toContain('overflow-wrap:anywhere');
  });
});
