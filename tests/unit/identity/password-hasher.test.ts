import { describe, expect, it } from 'vitest';
import { Argon2idPasswordHasher } from '../../../src/modules/identity/security/argon2-password-hasher.js';
describe('Argon2idPasswordHasher', () => {
  it('requires the approved Argon2id runtime dependency', async () => {
    const hasher = new Argon2idPasswordHasher();
    await expect(hasher.hash('not-a-secret-for-production')).rejects.toMatchObject({ code: 'SYSTEM_CONFIGURATION_INVALID' });
  });
});
