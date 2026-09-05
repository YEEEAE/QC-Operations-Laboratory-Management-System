import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { PermissionCode } from '../../../shared/authorization/permissions.js';
import type { LabTest } from '../domain/lab-test.js';

export function authorizeLab(actor: ActorContext, test: LabTest, permission: PermissionCode, action: string, expectedVersion: bigint, sod = false) {
  authorize({ actor, permission, action, entity: { type: 'LAB_TEST', id: test.id, state: test.state, authorId: test.authorId, executorId: test.authorId }, scope: { ownerId: test.authorId }, currentVersion: test.version, expectedVersion, sod: sod ? { actorId: actor.id, authorId: test.authorId, executorId: test.authorId } : undefined, businessCondition: true }, { throwOnDeny: true });
}
