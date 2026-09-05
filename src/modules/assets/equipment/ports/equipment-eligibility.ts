import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { ControlledContext, EquipmentContext } from '../../../laboratory/domain/lab-test.js';
export interface EquipmentEligibility {
  verify(input: { actor: ActorContext; equipment: readonly EquipmentContext[]; context: ControlledContext }): Promise<void>;
}
