import type { ActorContext } from '../../../shared/authorization/types.js';
import type { ControlledContext, EquipmentContext, LabTest } from '../domain/lab-test.js';
/** Owning Assets capability must resolve and verify historical eligibility; no Assets table mutations. */
export interface AssetsEligibility {
  verify(input:{actor:ActorContext; equipment:readonly EquipmentContext[]; context:ControlledContext}):Promise<void>;
}
/** An approved provider validates exact documents, criteria, evidence, environment and sample requirements. */
export interface ControlledLabSources {
  resolve(templateVersionId:string,actor:ActorContext):Promise<ControlledContext>;
  validateExecution(test:LabTest,actor:ActorContext):Promise<void>;
  evaluate(test:LabTest):Promise<{result:'PASS'|'FAIL'|'HOLD'; sourceReference:string; contentHash:string}>;
}
export interface LabApprovalPolicy {
  authorize(input:{test:LabTest;actor:ActorContext;expectedVersion:bigint}):Promise<void>;
}
/** No default count, authority, or final-result replacement rule. */
export interface RetestPolicy {
  authorize(input:{original:LabTest;actor:ActorContext;reason:string}):Promise<{sequence:number;labTestNo:string;templateVersionId:string}>;
}
