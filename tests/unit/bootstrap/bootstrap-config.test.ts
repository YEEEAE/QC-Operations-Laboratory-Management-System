import { describe, expect, it } from 'vitest';

import {
  BootstrapConfigurationError,
  parseBootstrapAdminConfig,
} from '../../../src/modules/identity/application/bootstrap-initial-admin.js';

const valid = {
  DATABASE_URL: 'postgres://bootstrap:secret@localhost:5432/qc',
  BOOTSTRAP_ADMIN_IDENTITY: 'yazeed',
  BOOTSTRAP_ADMIN_PASSWORD: 'not-a-production-password',
  BOOTSTRAP_ADMIN_DISPLAY_NAME: 'Yazeed',
};

describe('initial-admin bootstrap configuration', () => {
  it.each([
    'DATABASE_URL',
    'BOOTSTRAP_ADMIN_IDENTITY',
    'BOOTSTRAP_ADMIN_PASSWORD',
    'BOOTSTRAP_ADMIN_DISPLAY_NAME',
  ])('fails closed when %s is missing', (key) => {
    const environment = { ...valid, [key]: undefined };
    expect(() => parseBootstrapAdminConfig(environment)).toThrow(BootstrapConfigurationError);
  });

  it('never reflects the supplied password in configuration errors', () => {
    const secret = 'do-not-leak-this-bootstrap-secret';
    expect(() =>
      parseBootstrapAdminConfig({
        ...valid,
        DATABASE_URL: 'bad-url',
        BOOTSTRAP_ADMIN_PASSWORD: secret,
      }),
    ).toThrowError(
      new BootstrapConfigurationError('Bootstrap configuration is invalid: DATABASE_URL.'),
    );
  });

  it('keeps email optional and returns only validated values', () => {
    expect(parseBootstrapAdminConfig(valid)).toMatchObject({
      identity: 'yazeed',
      displayName: 'Yazeed',
    });
    expect(
      parseBootstrapAdminConfig({ ...valid, BOOTSTRAP_ADMIN_EMAIL: 'yazeed@example.test' }).email,
    ).toBe('yazeed@example.test');
  });
});
