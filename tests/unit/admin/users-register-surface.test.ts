import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  new URL('../../../src/pages/admin/users/index.astro', import.meta.url),
  'utf8',
);

describe('users register presentation contract', () => {
  it('keeps read and filter operations native, scoped, and server-paginated', () => {
    expect(source).toContain('executePage({');
    expect(source).toContain('method="get"');
    expect(source).toContain('role="search"');
    expect(source).toContain('name="q"');
    expect(source).toContain('name="state"');
    expect(source).toContain('aria-label="Applied user filters"');
    expect(source).toContain('aria-label="User account pages"');
    expect(source).toContain("search.set('page', String(updates.page))");
    expect(source).toContain('pageSize = 25');
    expect(source).not.toContain('fetch(');
  });

  it('shows the same core record fields in desktop rows and mobile cards', () => {
    for (const field of [
      'user.loginIdentity',
      'user.displayName',
      'user.accountState',
      'roleSummary.get(user.id)',
      'scopeSummary.get(user.id)',
    ]) {
      expect(source).toContain(field);
    }
    expect(source).toContain('class="table-wrap" role="region"');
    expect(source).toContain('class="user-cards"');
    expect(source).toContain('@media (max-width:760px)');
    expect(source).toContain('.table-wrap { display:none; }');
    expect(source).toContain('.user-cards { display:block; }');
    expect(source).toContain('overflow-wrap:anywhere');
  });

  it('preserves only existing navigation affordances and does not expose sensitive values', () => {
    expect(source).toContain('href="/admin/users/new"');
    expect(source).toContain('href="/admin"');
    expect(source).toContain('href={`/admin/users/${user.id}`}');
    expect(source).not.toMatch(/passwordHash|sessionToken|rawSession|secret/i);
    expect(source).not.toContain('identityAdminActionDependencies');
    expect(source).not.toContain('expectedVersion');
    expect(source).not.toContain('export');
  });

  it('keeps denied, provider, relationship, empty, and unsupported-filter outcomes distinct', () => {
    expect(source).toContain('ProviderUnavailableState');
    expect(source).toContain('User administration is not available');
    expect(source).toContain('Role and scope details could not be confirmed');
    expect(source).toContain('No member accounts match these filters.');
    expect(source).toContain('No member accounts are visible under your authorized scope.');
    expect(source).toContain('The account-state filter was not applied');
  });
});
