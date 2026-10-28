import { AuditService } from '../../../shared/audit/audit-service.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import { AdminResetPasswordUseCase } from './admin-reset-password.js';
import { CreateUserUseCase } from './create-user.js';
import { DisableUserUseCase } from './disable-user.js';
import { GetUserUseCase } from './get-user.js';
import { identityDependencies, resolveActor } from './identity-dependencies.js';
import { ListUsersUseCase } from './list-users.js';
import { UpdateUserUseCase } from './update-user.js';
import { ActivateUserUseCase } from './activate-user.js';
import { RevokeUserSessionsUseCase } from './revoke-user-sessions.js';
import { PostgresExternalIdentityLinkRepository } from '../infrastructure/postgres-external-identity-link-repository.js';
import {
  DeactivateExternalIdentityLinkUseCase,
  GetExternalIdentityLinkUseCase,
  LinkExternalIdentityUseCase,
} from './manage-external-identity-link.js';
import { getServerEnv } from '../../../config/env.js';

/**
 * Controlled Administration (F-02) identity wiring. Pages call the read
 * factory; Astro Actions call the mutation factory. Both reuse the same
 * Domain/Application use cases — no SQL or business rules in Delivery.
 */
export function identityAdminReadDependencies() {
  const base = identityDependencies();
  const externalIdentityLinks = new PostgresExternalIdentityLinkRepository(base.database);
  return {
    listUsers: new ListUsersUseCase(base.users),
    getUser: new GetUserUseCase(base.users),
    getExternalIdentityLink: new GetExternalIdentityLinkUseCase(
      base.users,
      externalIdentityLinks,
      getServerEnv(),
    ),
  };
}

export function identityAdminActionDependencies() {
  const base = identityDependencies();
  const audit = new AuditService(new PostgresAuditRepository(base.database));
  const externalIdentityLinks = new PostgresExternalIdentityLinkRepository(base.database);
  const env = getServerEnv();
  return {
    createUser: new CreateUserUseCase(base.users, base.passwords, audit),
    updateUser: new UpdateUserUseCase(base.users, audit),
    disableUser: new DisableUserUseCase(base.users, base.sessionService, audit),
    resetPassword: new AdminResetPasswordUseCase(
      base.users,
      base.passwords,
      base.credentialMutation,
    ),
    activateUser: new ActivateUserUseCase(base.users, audit),
    revokeUserSessions: new RevokeUserSessionsUseCase(base.users, base.sessionService, audit),
    linkExternalIdentity: new LinkExternalIdentityUseCase(
      base.users,
      externalIdentityLinks,
      base.passwords,
      env,
      (userId) => resolveActor(base.database, userId),
    ),
    deactivateExternalIdentity: new DeactivateExternalIdentityLinkUseCase(
      base.users,
      externalIdentityLinks,
      base.passwords,
    ),
  };
}
