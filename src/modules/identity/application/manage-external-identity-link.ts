import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { isCanonicalSystemOwnerId } from '../../../shared/authorization/p05-authority.js';
import type { ServerEnv } from '../../../config/env.js';
import type { PasswordHasher } from '../security/password-hasher.js';
import type { UserRepository } from '../ports/user-repository.js';
import type { ExternalIdentityLinkRepository } from '../ports/external-identity-link-repository.js';
import type { ExternalIdentityDeactivationReason } from '../domain/external-identity-link.js';

function assertManagePermission(actor: ActorContext, target: NonNullable<Awaited<ReturnType<UserRepository['findById']>>>) {
  authorize(
    {
      actor,
      permission: 'PERM-IDN-MANAGE-USERS',
      action: 'MANAGE',
      entity: { type: 'USER', id: target.id, state: target.accountState },
      scope: {},
      businessCondition: true,
    },
    { throwOnDeny: true },
  );
}

async function assertReauthenticated(
  actor: ActorContext,
  currentPassword: string,
  users: UserRepository,
  passwords: PasswordHasher,
) {
  const operator = await users.findById(actor.id);
  if (!operator || operator.accountState !== 'ACTIVE' || operator.mustChangePassword || !currentPassword ||
      !(await passwords.verify(currentPassword, operator.passwordHash))) {
    throw new AppError('AUTH_REAUTH_REQUIRED', { userSafe: true });
  }
}

export class GetExternalIdentityLinkUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly links: ExternalIdentityLinkRepository,
    private readonly env: ServerEnv,
  ) {}

  async execute(input: { actor: ActorContext; userId: string }) {
    const target = await this.users.findById(input.userId);
    if (!target) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    assertManagePermission(input.actor, target);
    if (this.env.NEON_AUTH_ENABLED !== 'true' || !this.env.NEON_AUTH_ISSUER)
      return undefined;
    return this.links.findForUser(target.id, this.env.NEON_AUTH_ISSUER);
  }
}

export class LinkExternalIdentityUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly links: ExternalIdentityLinkRepository,
    private readonly passwords: PasswordHasher,
    private readonly env: ServerEnv,
    private readonly resolveLocalActor: (userId: string) => Promise<ActorContext | undefined>,
  ) {}

  async execute(input: {
    actor: ActorContext;
    userId: string;
    subject: string;
    currentPassword: string;
    note: string;
    requestId: string;
  }) {
    const target = await this.users.findById(input.userId);
    if (!target) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    assertManagePermission(input.actor, target);
    if (target.accountState !== 'ACTIVE' || target.id === input.actor.id || isCanonicalSystemOwnerId(target.id))
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    const localAccess = await this.resolveLocalActor(target.id);
    if (
      !localAccess || localAccess.accountState !== 'ACTIVE' || localAccess.roles.length === 0 ||
      !localAccess.permissions.some((grant) => grant.active !== false && grant.scopes.length > 0)
    ) {
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    }
    await assertReauthenticated(input.actor, input.currentPassword, this.users, this.passwords);
    if (this.env.NEON_AUTH_ENABLED !== 'true' || !this.env.NEON_AUTH_ISSUER)
      throw new AppError('POLICY_SOURCE_REQUIRED', { userSafe: true });

    const subject = input.subject.trim();
    const note = input.note.trim();
    if (
      subject.length < 1 || subject.length > 512 || /[\u0000-\u001f\u007f]/.test(subject) ||
      /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(subject) ||
      note.length < 8 || note.length > 500
    )
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    try {
      return await this.links.createApproved({
        userId: target.id,
        issuer: this.env.NEON_AUTH_ISSUER,
        subject,
        actorId: input.actor.id,
        requestId: input.requestId,
        note,
      });
    } catch (error) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505')
        throw new AppError('CONFLICT_DUPLICATE_COMMAND', { userSafe: true });
      throw error;
    }
  }
}

export class DeactivateExternalIdentityLinkUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly links: ExternalIdentityLinkRepository,
    private readonly passwords: PasswordHasher,
  ) {}

  async execute(input: {
    actor: ActorContext;
    linkId: string;
    currentPassword: string;
    reason: ExternalIdentityDeactivationReason;
    note: string;
    requestId: string;
  }) {
    const link = await this.links.findById(input.linkId);
    if (!link) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    const target = await this.users.findById(link.userId);
    if (!target) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    assertManagePermission(input.actor, target);
    if (target.id === input.actor.id || (target.accountState === 'ACTIVE' && isCanonicalSystemOwnerId(target.id)))
      throw new AppError('AUTHZ_DENIED', { userSafe: true });
    await assertReauthenticated(input.actor, input.currentPassword, this.users, this.passwords);
    const note = input.note.trim();
    if (note.length < 8 || note.length > 500)
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    await this.links.deactivate({
      id: link.id,
      actorId: input.actor.id,
      requestId: input.requestId,
      reason: input.reason,
      note,
    });
    return { ok: true };
  }
}
