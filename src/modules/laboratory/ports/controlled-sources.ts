import type { ActorContext } from '../../../shared/authorization/types.js';
import type { ControlledContext, EquipmentContext, LabTest } from '../domain/lab-test.js';
/** Owning Assets capability must resolve and verify historical eligibility; no Assets table mutations. */
export interface AssetsEligibility {
  verify(input: {
    actor: ActorContext;
    equipment: readonly EquipmentContext[];
    context: ControlledContext;
  }): Promise<void>;
}
/**
 * Selector-facing projection of an approved lab template version. Only the
 * display fields needed to choose a template are exposed; acceptance
 * criteria stay behind `resolve()` and are never listed here.
 */
export interface ApprovedLabTemplateOption {
  id: string;
  versionNo: string;
  methodReference: string;
}
/** An approved provider validates exact documents, criteria, evidence, environment and sample requirements. */
export interface ControlledLabSources {
  resolve(templateVersionId: string, actor: ActorContext): Promise<ControlledContext>;
  /**
   * Read-only selector source: approved template versions only. The label
   * carries the human-readable method reference + version number; the value
   * stays the technical version id. Never exposes drafts or retired
   * versions, and never invents scientific content.
   */
  listApprovedTemplates(): Promise<readonly ApprovedLabTemplateOption[]>;
  validateExecution(test: LabTest, actor: ActorContext): Promise<void>;
  evaluate(
    test: LabTest,
  ): Promise<{ result: 'PASS' | 'FAIL' | 'HOLD'; sourceReference: string; contentHash: string }>;
}
export interface LabApprovalPolicy {
  authorize(input: { test: LabTest; actor: ActorContext; expectedVersion: bigint }): Promise<void>;
}
/** No default count, authority, or final-result replacement rule. */
export interface RetestPolicy {
  authorize(input: {
    original: LabTest;
    actor: ActorContext;
    reason: string;
  }): Promise<{ sequence: number; labTestNo: string; templateVersionId: string }>;
}
