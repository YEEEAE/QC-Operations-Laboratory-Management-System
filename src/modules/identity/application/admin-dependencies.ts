import { AuditService } from '../../../shared/audit/audit-service.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import { AdminResetPasswordUseCase } from './admin-reset-password.js';
import { CreateUserUseCase } from './create-user.js';
import { DisableUserUseCase } from './disable-user.js';
import { GetUserUseCase } from './get-user.js';
import { identityDependencies } from './identity-dependencies.js';
import { ListUsersUseCase } from './list-users.js';
import { UpdateUserUseCase } from './update-user.js';

/**
 * Controlled Administration (F-02) identity wiring. Pages call the read
 * factory; Astro Actions call the mutation factory. Both reuse the same
 * Domain/Application use cases — no SQL or business rules in Delivery.
 */
export function identityAdminReadDependencies() {
  const base = identityDependencies();
  return {
    listUsers: new ListUsersUseCase(base.users),
    getUser: new GetUserUseCase(base.users),
  };
}

export function identityAdminActionDependencies() {
  const base = identityDependencies();
  const audit = new AuditService(new PostgresAuditRepository(base.database));
  return {
    createUser: new CreateUserUseCase(base.users, base.passwords, audit),
    updateUser: new UpdateUserUseCase(base.users, audit),
    disableUser: new DisableUserUseCase(base.users, base.sessionService, audit),
    resetPassword: new AdminResetPasswordUseCase(
      base.users,
      base.passwords,
      base.sessionService,
      audit,
    ),
  };
}
