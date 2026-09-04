import { createRequire } from 'node:module';
import { AppError } from '../../../shared/errors/app-error.js';
import type { PasswordHasher } from './password-hasher.js';

type Argon2Module = { hash(password: string, options: Record<string, unknown>): Promise<string>; verify(hash: string, password: string): Promise<boolean> };
const require = createRequire(import.meta.url);

function implementation(): Argon2Module {
  try { return require('argon2') as Argon2Module; }
  catch (cause) { throw new AppError('SYSTEM_CONFIGURATION_INVALID', { cause, userSafe: false }); }
}

export class Argon2idPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    if (typeof password !== 'string') throw new AppError('VALIDATION_FAILED');
    return implementation().hash(password, { type: 2, memoryCost: 19456, timeCost: 2, parallelism: 1 });
  }
  async verify(password: string, encodedHash: string): Promise<boolean> {
    if (typeof password !== 'string' || typeof encodedHash !== 'string') return false;
    try { return await implementation().verify(encodedHash, password); } catch { return false; }
  }
}
