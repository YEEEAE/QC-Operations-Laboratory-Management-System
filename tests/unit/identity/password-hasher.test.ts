import { describe, expect, it } from 'vitest';
import { Argon2idPasswordHasher } from '../../../src/modules/identity/security/argon2-password-hasher.js';
describe('Argon2idPasswordHasher', () => {
  it('hashes and verifies passwords with the approved Argon2id parameters', async () => {
    const hasher = new Argon2idPasswordHasher();
    const password = 'test-only-password';
    const encodedHash = await hasher.hash(password);

    expect(encodedHash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
    await expect(hasher.verify(password, encodedHash)).resolves.toBe(true);
    await expect(hasher.verify('wrong-password', encodedHash)).resolves.toBe(false);
  });
});
