import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';

export interface QuarantineAdminReadModel { generatedAt: Date; templates: Array<{ id: string; code: string; name: string; active: boolean; currentVersion: string | null }>; receivingByState: Array<{ state: string; value: number }>; }
export interface QuarantineAdminReader { getAdmin(input: { actor: ActorContext }): Promise<QuarantineAdminReadModel>; }

export class GetQuarantineAdminUseCase {
  constructor(private readonly reader: QuarantineAdminReader) {}
  execute(input: { actor: ActorContext }) {
    authorize({ actor: input.actor, permission: 'PERM-ADM-TEMPLATES', action: 'VIEW', entity: { type: 'QUARANTINE_ADMIN', id: 'admin', state: 'ACTIVE' }, scope: {}, currentVersion: 1, expectedVersion: 1, businessCondition: true }, { throwOnDeny: true });
    return this.reader.getAdmin(input);
  }
}
