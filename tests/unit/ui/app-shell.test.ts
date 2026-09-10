import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readUi = (path: string) =>
  readFileSync(new URL(`../../../src/ui/${path}`, import.meta.url), 'utf8');

describe('enterprise application shell contracts', () => {
  it('derives context from the current route and passes only active capabilities to navigation', () => {
    const layout = readUi('layouts/AppLayout.astro');
    expect(layout).toContain('routeBreadcrumbs(Astro.url.pathname)');
    expect(layout).toContain('actor?.permissions');
    expect(layout).toContain('activeCapabilities');
  });

  it('provides an operable mobile navigation control and keeps collapsed state on the workspace', () => {
    const layout = readUi('layouts/AppLayout.astro');
    const topbar = readUi('shell/Topbar.astro');
    expect(layout).toContain('data-app-shell');
    expect(layout).toContain('data-sidebar-panel');
    expect(layout).toContain("localStorage.setItem('qc-sidebar-collapsed'");
    expect(topbar).toContain('data-navigation-toggle');
    expect(topbar).toContain('aria-controls="primary-navigation"');
    expect(topbar).toContain('min-inline-size:40px');
    expect(topbar).toContain('@media(max-width:760px)');
  });

  it('supports a keyboard search shortcut without exposing unauthorized results in the shell', () => {
    const layout = readUi('layouts/AppLayout.astro');
    const topbar = readUi('shell/Topbar.astro');
    expect(layout).toContain("event.key.toLowerCase() === 'k'");
    expect(layout).toContain("window.location.assign('/search')");
    expect(topbar).toContain('Search authorized records');
    expect(topbar).not.toContain('All pending approvals');
  });

  it('moves dialog focus to its first usable control and restores it to the opener', () => {
    const dialogClient = readUi('client/dialog.ts');
    expect(dialogClient).toContain("dialog.querySelector<HTMLElement>('[autofocus]");
    expect(dialogClient).toContain("'button:not([disabled]), [href], input:not([disabled])");
    expect(dialogClient).toContain("dialog.addEventListener('close', () => opener?.focus())");
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
