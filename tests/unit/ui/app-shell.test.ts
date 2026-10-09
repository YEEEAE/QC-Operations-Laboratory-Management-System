import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readUi = (path: string) =>
  readFileSync(new URL(`../../../src/ui/${path}`, import.meta.url), 'utf8');

describe('enterprise application shell contracts', () => {
  it('uses the approved opaque surface hierarchy without hardcoded shell colours', () => {
    const layout = readUi('layouts/AppLayout.astro');
    const styles = layout.split('<style>')[1]?.split('</style>')[0] ?? '';
    expect(styles).toContain('background: var(--surface-page)');
    expect(styles).toContain('background: var(--color-sidebar)');
    expect(styles).toContain('background: var(--surface-panel)');
    expect(styles).not.toMatch(/(?:rgba?|hsla?)\(/);
  });

  it('reserves space for navigation controls in expanded, collapsed and mobile branding', () => {
    const sidebar = readUi('shell/Sidebar.astro');
    expect(sidebar).toContain('padding-inline-end: var(--space-12)');
    expect(sidebar).toContain(
      ".sidebar[data-collapsed='true'] .brand { padding-block-start: var(--space-12); }",
    );
    expect(sidebar).toContain(
      ".sidebar[data-collapsed='true'] .brand { padding-block-start: 0; padding-inline-end: var(--space-12); }",
    );
  });

  it('derives context from the current route and passes the server actor to navigation', () => {
    const layout = readUi('layouts/AppLayout.astro');
    expect(layout).toContain('routeBreadcrumbs(Astro.url.pathname)');
    expect(layout).toContain('<Sidebar actor={actor} />');
  });

  it('provides an operable mobile navigation control and keeps collapsed state on the workspace', () => {
    const layout = readUi('layouts/AppLayout.astro');
    const topbar = readUi('shell/Topbar.astro');
    const sidebar = readUi('shell/Sidebar.astro');
    expect(layout).toContain('data-app-shell');
    expect(layout).toContain('data-sidebar-panel');
    expect(layout).toContain('preferences.write({ ...preferences.read(), collapsed })');
    expect(topbar).toContain('data-navigation-toggle');
    expect(topbar).toContain('aria-controls="primary-navigation"');
    expect(topbar).toContain('min-inline-size:44px');
    expect(topbar).toContain('@media(max-width:760px)');
    expect(sidebar).toContain('data-nav-section-toggle');
    expect(sidebar).toContain('aria-expanded={expanded}');
    expect(sidebar).toContain('aria-controls={listId}');
    expect(sidebar).toContain('<ul class="nav-items"');
    expect(layout).toContain(
      "sidebarPanel.setAttribute('aria-hidden', String(isMobileDrawer() && !open))",
    );
    expect(layout).toContain("event.key !== 'Escape'");
  });

  it('keeps the drawer operable when browser preference storage is blocked', () => {
    const layout = readUi('layouts/AppLayout.astro');
    expect(layout).toContain('navigationPreferences(shell?.dataset.preferenceAccount');
    expect(layout).toContain('try { preferenceStorage = window.localStorage; } catch');
    expect(readUi('client/navigation-preferences.ts')).toContain('catch');
  });

  it('gives operational states short readable labels instead of internal state keys', () => {
    const state = readUi('components/feedback/OperationalState.astro');
    expect(state).toContain("'filtered-empty': 'No matches'");
    expect(state).toContain("denied: 'Access denied'");
    expect(state).toContain('{stateLabels[state]}');
    expect(state).not.toContain('state.replace');
  });

  it('supports a keyboard search shortcut without exposing unauthorized results in the shell', () => {
    const layout = readUi('layouts/AppLayout.astro');
    const topbar = readUi('shell/Topbar.astro');
    const sidebar = readUi('shell/Sidebar.astro');
    expect(layout).toContain("event.key.toLowerCase() === 'k'");
    expect(layout).toContain("window.location.assign('/search')");
    expect(sidebar).toContain('href={item.href}');
    expect(topbar).not.toContain('All pending approvals');
  });

  it('moves dialog focus to its first usable control and restores it to the opener', () => {
    const dialogClient = readUi('client/dialog.ts');
    expect(dialogClient).toContain("dialog.querySelector<HTMLElement>('[autofocus]");
    expect(dialogClient).toContain("'button:not([disabled]), [href], input:not([disabled])");
    expect(dialogClient).toContain("dialog.addEventListener('cancel'");
    expect(dialogClient).toContain('previousOpener?.isConnected');
    expect(dialogClient).toContain("dialog.dataset.dialogEnhanced === 'true'");
  });

  it('keeps shared confirmation and pagination controls keyboard-safe', () => {
    const confirm = readUi('components/feedback/ConfirmDialog.astro');
    const pagination = readUi('components/data/Pagination.astro');
    const sortHeader = readUi('components/data/SortHeader.astro');
    expect(confirm).toContain('data-dialog-close');
    expect(confirm).toContain('data-dialog-title');
    expect(confirm).toContain('for={`${id}-reason`}');
    expect(pagination).toContain('aria-label={`Go to page ${page - 1}`}');
    expect(pagination).toContain('<span class="page-link disabled"');
    expect(sortHeader).toContain('aria-label={`Sort by ${label}');
  });

  it('keeps anchored focus visible below persistent UI', () => {
    const global = readUi('styles/global.css');
    expect(global).toContain('scroll-padding-top');
    expect(global).toContain('scroll-margin-top');
  });

  it('focuses the validation summary with script enhancement while keeping no-JS anchor links', () => {
    const summary = readUi('components/FormErrorSummary.astro');
    expect(summary).toContain('data-error-summary');
    expect(summary).toContain('tabindex="-1"');
    expect(summary).toContain('role="alert"');
    // The invalid `autofocus` section attribute was replaced by a progressive
    // script; the word may remain in comments but must not remain as markup.
    expect(summary).not.toContain('\n  autofocus');
    expect(summary).toContain("querySelector<HTMLElement>('[data-error-summary]')");
    expect(summary).toContain('.focus(');
  });
});
