import { describe, expect, it } from 'vitest';

import {
  formatBootstrapAdminCheck,
  redactBootstrapErrorMessage,
  type BootstrapAdminCheckReport,
} from '../../../src/modules/identity/application/bootstrap-admin-check.js';

describe('initial-admin bootstrap check output', () => {
  it('reports only the six safe bootstrap facts', () => {
    const report: BootstrapAdminCheckReport = {
      userExists: true,
      accountActive: true,
      adminRole: true,
      globalScope: true,
      effectiveAdminAuthorization: true,
      bootstrapAuditPresence: true,
    };

    expect(formatBootstrapAdminCheck(report)).toBe(
      [
        'User exists: YES',
        'Account active: YES',
        'ADMIN role: YES',
        'GLOBAL scope: YES',
        'Effective ADMIN authorization: PASS',
        'Bootstrap audit presence: YES',
      ].join('\n'),
    );
  });

  it('redacts password and database URL from operator errors', () => {
    const environment = {
      DATABASE_URL: 'postgres://user:db-secret@example.test/qc',
      BOOTSTRAP_ADMIN_PASSWORD: 'bootstrap-secret',
    };
    const message = redactBootstrapErrorMessage(
      new Error(
        `failed for ${environment.DATABASE_URL} with ${environment.BOOTSTRAP_ADMIN_PASSWORD}`,
      ),
      environment,
    );

    expect(message).not.toContain(environment.DATABASE_URL);
    expect(message).not.toContain(environment.BOOTSTRAP_ADMIN_PASSWORD);
    expect(message).toContain('[REDACTED]');
  });
});
