import type { User } from '../domain/user.js';
export interface UserRepository {
  createProvisioned?(input: {
    id: string;
    loginIdentity: string;
    email?: string;
    displayName: string;
    passwordHash: string;
    actorId: string;
    at: Date;
    roleCodes: readonly string[];
    scopes: readonly { kind: string; value?: string }[];
    requestId: string;
  }): Promise<User>;
  findByLoginIdentity(loginIdentity: string): Promise<User | undefined>;
  findById(id: string): Promise<User | undefined>;
  listUsers(): Promise<readonly User[]>;
  listUserDisplayNames?(
    ids: readonly string[],
  ): Promise<readonly { id: string; displayName: string }[]>;
  listUsersPage?(filter: UserListFilter): Promise<UserListPage>;
  recordSuccessfulLogin(id: string, at: Date): Promise<void>;
  create(input: {
    id: string;
    loginIdentity: string;
    email?: string;
    displayName: string;
    passwordHash: string;
    accountState: User['accountState'];
    mustChangePassword: boolean;
    actorId: string;
    at: Date;
  }): Promise<User>;
  updateProfile(
    id: string,
    input: {
      displayName: string;
      email?: string;
      expectedVersion: bigint;
      actorId: string;
      at: Date;
    },
  ): Promise<User>;
  changePassword(
    id: string,
    passwordHash: string,
    expectedVersion: bigint,
    actorId: string,
    at: Date,
    mustChangePassword?: boolean,
  ): Promise<void>;
  setAccountState(
    id: string,
    state: User['accountState'],
    expectedVersion: bigint,
    actorId: string,
    at: Date,
  ): Promise<void>;
}

export interface UserListFilter {
  query?: string;
  accountState?: User['accountState'];
  page: number;
  pageSize: number;
  sortBy?: 'loginIdentity' | 'displayName' | 'state' | 'lastLogin';
  sortDirection?: 'asc' | 'desc';
}

export interface UserListPage {
  items: readonly UserListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export type UserListItem = Omit<User, 'passwordHash'>;
