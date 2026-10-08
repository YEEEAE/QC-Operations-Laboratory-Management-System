import { actorHasScope } from '../../../shared/authorization/scope-evaluator.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { laboratoryReadDependencies } from '../../laboratory/application/dependencies.js';
import { documentsReadDependencies } from '../../documents/application/dependencies.js';
import { changeRequestsReadDependencies } from '../../change-requests/application/dependencies.js';
import { findingsReadDependencies } from '../../quality/findings/application/dependencies.js';
import { ncrReadDependencies } from '../../quality/ncr/application/dependencies.js';
import { rcaReadDependencies } from '../../quality/rca/application/dependencies.js';
import { capaReadDependencies } from '../../quality/capa/application/dependencies.js';
import type { TaskRecordReference, TaskRecordType } from '../domain/model.js';
import type { TaskRecordSource } from './ports/record-source.js';

const permissions: Record<TaskRecordType, string> = {
  DOCUMENT: 'PERM-DOC-VIEW',
  LAB_TEST: 'PERM-LAB-VIEW',
  CHANGE_REQUEST: 'PERM-CHG-VIEW',
  FINDING: 'PERM-FIND-VIEW',
  NCR: 'PERM-NCR-VIEW',
  RCA: 'PERM-RCA-VIEW',
  CAPA: 'PERM-CAPA-VIEW',
};
const routes: Record<TaskRecordType, string> = {
  DOCUMENT: '/documents',
  LAB_TEST: '/laboratory/tests',
  CHANGE_REQUEST: '/change-requests',
  FINDING: '/quality/findings',
  NCR: '/quality/ncr',
  RCA: '/quality/rca',
  CAPA: '/quality/capa',
};
export function taskRecordHref(reference: TaskRecordReference): string {
  return `${routes[reference.type]}/${encodeURIComponent(reference.id)}`;
}
export function taskRecordSource(): TaskRecordSource {
  return {
    async assertVisible({ actor, reference }) {
      if (
        actor.accountState !== 'ACTIVE' ||
        !actor.permissions.some(
          (grant) => grant.code === permissions[reference.type] && grant.active !== false,
        )
      )
        throw new AppError('AUTHZ_DENIED', { userSafe: true });
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(reference.id))
        throw new AppError('VALIDATION_FAILED', { userSafe: true });
      const assertQualityScope = (record: {
        id: string;
        state: string;
        createdBy: string;
        ownerId?: string;
      }) => {
        const grant = actor.permissions.find(
          (item) => item.code === permissions[reference.type] && item.active !== false,
        );
        if (
          !actorHasScope(
            actor,
            {
              type: reference.type,
              id: record.id,
              state: record.state,
              ownerId: record.ownerId ?? record.createdBy,
              authorId: record.createdBy,
            },
            { ownerId: record.ownerId ?? record.createdBy },
            grant,
          )
        )
          throw new AppError('AUTHZ_SCOPE_DENIED', { userSafe: true });
      };
      const input: { actor: ActorContext; id: string } = { actor, id: reference.id };
      // Read facades enforce each application's current view scope; no foreign mutation port exists here.
      switch (reference.type) {
        case 'DOCUMENT':
          await documentsReadDependencies().get.execute({ actor, documentId: reference.id });
          break;
        case 'LAB_TEST':
          await laboratoryReadDependencies().get.execute(input);
          break;
        case 'CHANGE_REQUEST':
          await changeRequestsReadDependencies().get.execute(input);
          break;
        case 'FINDING':
          assertQualityScope(await findingsReadDependencies().get.execute(input));
          break;
        case 'NCR':
          assertQualityScope(await ncrReadDependencies().get.execute(input));
          break;
        case 'RCA':
          assertQualityScope(await rcaReadDependencies().get.execute(input));
          break;
        case 'CAPA':
          assertQualityScope(await capaReadDependencies().get.execute(input));
          break;
        default:
          throw new AppError('VALIDATION_FAILED', { userSafe: true });
      }
    },
  };
}
