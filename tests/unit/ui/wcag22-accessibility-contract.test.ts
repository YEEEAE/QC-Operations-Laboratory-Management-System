import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

describe('WCAG 2.2 AA accessibility contracts', () => {
  it('keeps the application shell navigable by landmarks and skip navigation', () => {
    const layout = read('src/ui/layouts/AppLayout.astro');
    const sidebar = read('src/ui/shell/Sidebar.astro');
    const topbar = read('src/ui/shell/Topbar.astro');

    expect(layout).toContain('href="#main-content"');
    expect(layout).toContain('<main id="main-content"');
    expect(layout).toContain('aria-label="Primary navigation"');
    expect(sidebar).toContain('<nav class="sidebar"');
    expect(topbar).toContain('aria-controls="primary-navigation"');
    expect(topbar).toContain('aria-expanded');
  });

  it('keeps keyboard focus visible and honors reduced motion', () => {
    const global = read('src/ui/styles/global.css');
    const layout = read('src/ui/layouts/AppLayout.astro');
    const sidebar = read('src/ui/shell/Sidebar.astro');

    expect(global).toMatch(/:where\(button, a, input, select, textarea, summary\):focus-visible/);
    expect(global).toContain('outline: 2px solid var(--focus-ring)');
    expect(global).toContain('scroll-padding-top');
    expect(layout).toContain('@media (prefers-reduced-motion: reduce)');
    expect(layout).toContain('transition:none');
    expect(sidebar).toContain('@media (forced-colors: active)');
  });

  it('keeps mobile drawer isolation and focus restoration explicit', () => {
    const layout = read('src/ui/layouts/AppLayout.astro');

    expect(layout).toContain("workspace?.setAttribute('inert', '')");
    expect(layout).toContain("skipLink?.setAttribute('inert', '')");
    expect(layout).toContain("event.key === 'Tab'");
    expect(layout).toContain("event.key === 'Escape'");
    expect(layout).toContain('setMobileNav(false, { returnFocus: true })');
    expect(layout).toContain("document.body.style.overflow = 'hidden'");
    expect(layout).toContain("document.body.style.overflow = ''");
  });

  it('requires accessible names and state for icon-only controls', () => {
    const iconButton = read('src/ui/components/IconButton.astro');
    const topbar = read('src/ui/shell/Topbar.astro');
    const sidebar = read('src/ui/shell/Sidebar.astro');

    expect(iconButton).toContain('aria-label={label}');
    expect(iconButton).toContain('title={label}');
    expect(topbar).toContain('aria-label="Search authorized records (Control K)"');
    expect(sidebar).toContain('aria-label="Collapse navigation"');
    expect(sidebar).toContain('aria-label="Close navigation"');
  });

  it('keeps validation errors linked, announced, and recoverable without JavaScript', () => {
    const summary = read('src/ui/components/FormErrorSummary.astro');
    const mutation = read('src/ui/forms/mutation-interaction.ts');

    expect(summary).toContain('role="alert"');
    expect(summary).toContain('tabindex="-1"');
    expect(summary).toContain('aria-labelledby="form-error-title"');
    expect(summary).toContain('href={`#${item.fieldId}`}');
    expect(summary).toContain('Back to {listLabel}');
    expect(mutation).toContain("form.setAttribute('aria-busy', 'true')");
    expect(mutation).toContain("output?.focus?.()");
  });

  it('provides a non-visual data alternative for charts and semantic table headers', () => {
    const chart = read('src/ui/charts/Chart.astro');
    const table = read('src/ui/components/data/DataTable.astro');

    expect(chart).toContain('role="img"');
    expect(chart).toContain('aria-label={`${title}: ${summary}`}');
    expect(chart).toContain('<table class="data-alt">');
    expect(chart).toContain('scope="col"');
    expect(chart).toContain('scope="row"');
    expect(table).toContain('<caption class="visually-hidden">{caption}</caption>');
    expect(table).toContain('class="table-scroll"');
  });

  it('keeps status meaning in text rather than color alone', () => {
    const badge = read('src/ui/components/StatusBadge.astro');
    const sidebar = read('src/ui/shell/Sidebar.astro');

    expect(badge).toContain('<span>{label}</span>');
    expect(badge).toContain('aria-hidden="true"');
    expect(sidebar).toContain('text-decoration:underline');
    expect(sidebar).toContain("aria-current={isActive ? 'page' : undefined}");
  });

  it('announces loading and notification severity without depending on color', () => {
    const loading = read('src/ui/components/feedback/LoadingState.astro');
    const notifications = read('src/pages/notifications.astro');

    expect(loading).toContain('role="status"');
    expect(loading).toContain('aria-live="polite"');
    expect(loading).toContain('aria-hidden="true"');
    expect(notifications).toContain('aria-hidden="true"');
    expect(notifications).toContain('class="sr-only">{notification.severity}</span>');
  });

  it('keeps authentication compatible with password managers and paste', () => {
    const login = read('src/pages/login.astro');

    expect(login).toContain('autocomplete="username"');
    expect(login).toContain('autocomplete="current-password"');
    expect(login).toContain('type="password"');
    expect(login).toContain('aria-label="Show password"');
    expect(login).toContain('role="alert"');
  });
});
