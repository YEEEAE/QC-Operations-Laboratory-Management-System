import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync('src/pages/account.astro', 'utf8');
const readModel = readFileSync('src/modules/identity/application/get-account.ts', 'utf8');
const passwordUseCase = readFileSync('src/modules/identity/application/change-password.ts', 'utf8');

describe('account overview presentation contract', () => {
  it('keeps the existing overview order and sources with no extra data or operations', () => {
    expect(page.indexOf('class="account-information"')).toBeLessThan(
      page.indexOf('aria-labelledby="security"'),
    );
    expect(page.indexOf('aria-labelledby="security"')).toBeLessThan(
      page.indexOf('aria-labelledby="session"'),
    );
    for (const label of ['Login identity', 'Display name', 'Email', 'State'])
      expect(page).toContain(label);
    expect(page).toContain('actions.account.changePassword');
    expect(page).toContain('actions.logout');
    expect(page).not.toMatch(/data-(?:filter|export)/i);
    expect(page).toContain('Astro.getActionResult(actions.logout)');
    expect(page).toContain('logoutResult.data.redirectTo');
    expect(page).toContain('We could not confirm that you were signed out.');
    expect(page).toContain('data-logout-pending');
    expect(readModel).toContain("permission: 'PERM-IDN-VIEW-SELF'");
    expect(readModel).toContain('businessCondition: user.id === actor.id');
  });

  it('keeps password inputs labelled, secret, field-linked and non-persistent', () => {
    expect(page).toContain('name="currentPassword"');
    expect(page).toContain('type="password"');
    expect(page).toContain('autocomplete="current-password"');
    expect(page).toContain('name="newPassword"');
    expect(page).toContain('autocomplete="new-password"');
    expect(page).toContain("'currentPassword-error'");
    expect(page).toContain("'newPassword-error'");
    expect(page).toContain('role="status" aria-live="polite" data-result');
    expect(page).not.toMatch(/localStorage|sessionStorage|name="(?:role|scope|permission)"/);
    expect(passwordUseCase).toContain("permission: 'PERM-IDN-CHANGE-OWN-PASSWORD'");
    expect(passwordUseCase).toContain('currentVersion: user.version');
    expect(passwordUseCase).toContain('expectedVersion: user.version');
  });

  it('reflows account facts and preserves a visible keyboard focus treatment', () => {
    expect(page).toContain('grid-template-columns:repeat(2,minmax(0,1fr))');
    expect(page).toContain('@media(max-width:520px)');
    expect(page).toContain('grid-template-columns:minmax(0,1fr)');
    expect(page).toContain(':focus-visible');
    expect(page).toContain('outline:2px solid var(--focus-ring)');
    expect(page).toContain('aria-label="Show current password"');
    expect(page).toContain('aria-label="Show new password"');
  });
});
