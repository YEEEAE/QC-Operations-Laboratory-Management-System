import type { User } from '../domain/user.js';
export interface UserRepository {
  findByLoginIdentity(loginIdentity: string): Promise<User | undefined>;
  findById(id: string): Promise<User | undefined>;
  recordSuccessfulLogin(id: string, at: Date): Promise<void>;
}
