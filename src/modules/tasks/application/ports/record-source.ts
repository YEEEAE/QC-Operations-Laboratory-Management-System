import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { TaskRecordReference } from '../../domain/model.js';

/** Owning applications remain responsible for existence and scoped view decisions. */
export interface TaskRecordSource {
  assertVisible(input: { actor: ActorContext; reference: TaskRecordReference }): Promise<void>;
}
