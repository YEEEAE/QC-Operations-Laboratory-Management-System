import { sql, type Kysely } from 'kysely';
import { z } from 'zod';

import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import { uuidv7 } from '../../../shared/id/uuid.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import type { PasswordHasher } from '../security/password-hasher.js';

const bootstrapEnvSchema = z.object({
  DATABASE_URL: z.string().trim().url(),
  BOOTSTRAP_ADMIN_IDENTITY: z.string().trim().min(1),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().refine((value) => value.trim().length > 0),
  BOOTSTRAP_ADMIN_DISPLAY_NAME: z.string().trim().min(1),
  BOOTSTRAP_ADMIN_EMAIL: z.string().trim().email().optional(),
});

export interface BootstrapAdminConfig {
  databaseUrl: string;
  identity: string;
  password: string;
  displayName: string;
  email?: string;
}

export class BootstrapConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BootstrapConfigurationError';
  }
}

export function parseBootstrapAdminConfig(
  environment: Record<string, string | undefined>,
): BootstrapAdminConfig {
  const parsed = bootstrapEnvSchema.safeParse(environment);
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))]
      .filter((field) => field !== 'BOOTSTRAP_ADMIN_PASSWORD')
      .join(', ');
    throw new BootstrapConfigurationError(
      `Bootstrap configuration is invalid${fields ? `: ${fields}` : ''}.`,
    );
  }

  return {
    databaseUrl: parsed.data.DATABASE_URL,
    identity: parsed.data.BOOTSTRAP_ADMIN_IDENTITY,
    password: parsed.data.BOOTSTRAP_ADMIN_PASSWORD,
    displayName: parsed.data.BOOTSTRAP_ADMIN_DISPLAY_NAME,
    ...(parsed.data.BOOTSTRAP_ADMIN_EMAIL ? { email: parsed.data.BOOTSTRAP_ADMIN_EMAIL } : {}),
  };
}

export type BootstrapInitialAdminResult =
  { status: 'CREATED'; authorizationGrantsConfigured: boolean } | { status: 'ALREADY_EXISTS' };

export class BootstrapInitialAdminUseCase {
  constructor(
    private readonly database: Kysely<DatabaseSchema>,
    private readonly passwords: PasswordHasher,
  ) {}

  async execute(config: BootstrapAdminConfig): Promise<BootstrapInitialAdminResult> {
    return this.database.transaction().execute(async (transaction) => {
      // Serializes same-identity attempts without creating a persistent lock or bootstrap marker.
      await sql`select pg_advisory_xact_lock(hashtextextended(${`qc-bootstrap:${config.identity}`}, 0))`.execute(
        transaction,
      );

      const existing = await transaction
        .selectFrom('users')
        .select('id')
        .where('login_identity', '=', config.identity)
        .executeTakeFirst();
      if (existing) return { status: 'ALREADY_EXISTS' };

      const adminRole = await transaction
        .selectFrom('roles')
        .select(['id', 'active'])
        .where('code', '=', 'ADMIN')
        .executeTakeFirst();
      if (!adminRole?.active) {
        throw new BootstrapConfigurationError(
          'BOOTSTRAP BLOCKED: canonical ADMIN role is missing or inactive. Run the approved Foundation seed.',
        );
      }

      const passwordHash = await this.passwords.hash(config.password);
      const userId = uuidv7();
      const audit = new PostgresAuditRepository(transaction);

      await transaction
        .insertInto('users')
        .values({
          id: userId,
          login_identity: config.identity,
          email: config.email ?? null,
          display_name: config.displayName,
          password_hash: passwordHash,
          account_state: 'ACTIVE',
          must_change_password: false,
          created_by: null,
          updated_by: null,
        })
        .execute();
      await transaction
        .insertInto('user_roles')
        .values({
          id: uuidv7(),
          user_id: userId,
          role_id: adminRole.id,
          valid_from: null,
          valid_until: null,
          assigned_by: userId,
          revoked_at: null,
          revoked_by: null,
          reason: 'INITIAL_SYSTEM_BOOTSTRAP',
        })
        .execute();
      await transaction
        .insertInto('user_scopes')
        .values({
          id: uuidv7(),
          user_id: userId,
          scope_kind: 'GLOBAL',
          scope_value: null,
          assigned_by: userId,
          revoked_at: null,
          revoked_by: null,
          reason: 'INITIAL_SYSTEM_BOOTSTRAP',
        })
        .execute();

      await audit.append({
        actorType: 'SYSTEM',
        subjectType: 'USER',
        subjectId: userId,
        action: 'BOOTSTRAP_CREATE_INITIAL_ADMIN',
        requestId: 'bootstrap-initial-admin',
      });
      await audit.append({
        actorType: 'SYSTEM',
        subjectType: 'USER_ROLE',
        subjectId: userId,
        action: 'BOOTSTRAP_ASSIGN_ADMIN_ROLE',
        requestId: 'bootstrap-initial-admin',
      });
      await audit.append({
        actorType: 'SYSTEM',
        subjectType: 'USER_SCOPE',
        subjectId: userId,
        action: 'BOOTSTRAP_ASSIGN_GLOBAL_SCOPE',
        requestId: 'bootstrap-initial-admin',
      });

      const grants = await transaction
        .selectFrom('role_permissions')
        .select('permission_id')
        .where('role_id', '=', adminRole.id)
        .execute();
      return { status: 'CREATED', authorizationGrantsConfigured: grants.length > 0 };
    });
  }
}
