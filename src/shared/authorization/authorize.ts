import { AppError } from '../errors/app-error';
import { isPermissionCode } from './permissions';
import { deny, allow } from './decision';
import { actorHasScope } from './scope-evaluator';
import { evaluateSeparationOfDuties } from './sod';
import { getAuthorizationPolicy } from './policy-registry';
import type { AuthorizationDecision, AuthorizationInput } from './types';
export function authorize(
  input: AuthorizationInput,
  options: { throwOnDeny?: boolean } = {},
): AuthorizationDecision {
  const fail = (decision: AuthorizationDecision): AuthorizationDecision => {
    if (options.throwOnDeny) throw new AppError(decision.code ?? 'AUTHZ_DENIED');
    return decision;
  };
  if (input.actor.accountState !== 'ACTIVE')
    return fail(deny('AUTHZ_DENIED', 'Actor account is not active.'));
  if (!isPermissionCode(input.permission))
    return fail(deny('AUTHZ_PERMISSION_MISSING', 'Permission is not canonical.'));
  const grant = input.actor.permissions.find(
    (p) => p.code === input.permission && p.active !== false,
  );
  if (!grant) return fail(deny('AUTHZ_PERMISSION_MISSING', 'Explicit permission is required.'));
  const policy = getAuthorizationPolicy(input.permission, input.action, input.entity.type);
  if (!policy || !policy.states.includes(input.entity.state))
    return fail(deny('AUTHZ_DENIED', 'Undefined or invalid policy.'));
  if (!actorHasScope(input.actor, input.entity, input.scope, grant))
    return fail(deny('AUTHZ_SCOPE_DENIED', 'Entity is outside the authorized scope.'));
  if (input.expectedVersion !== input.currentVersion)
    return fail(deny('CONFLICT_STALE_VERSION', 'Record version is stale.'));
  if (input.businessCondition !== true)
    return fail(deny('AUTHZ_DENIED', 'Business condition is not satisfied.'));
  if (input.sod) {
    const sod = evaluateSeparationOfDuties({
      ...input.sod,
      action: input.action,
      entityType: input.entity.type,
    });
    if (!sod.allowed) return fail(sod);
  }
  return allow();
}
