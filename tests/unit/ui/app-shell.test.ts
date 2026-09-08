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
  });

  it('supports a keyboard search shortcut without exposing unauthorized results in the shell', () => {
    const layout = readUi('layouts/AppLayout.astro');
    const topbar = readUi('shell/Topbar.astro');
    expect(layout).toContain("event.key.toLowerCase() === 'k'");
    expect(layout).toContain("window.location.assign('/search')");
    expect(topbar).toContain('Search authorized records');
    expect(topbar).not.toContain('All pending approvals');
  });
});
