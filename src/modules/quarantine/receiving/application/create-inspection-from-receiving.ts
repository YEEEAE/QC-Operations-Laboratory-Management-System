import { authorize } from '../../../../shared/authorization/authorize.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { uuidv7 } from '../../../../shared/id/uuid.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { ReceivingContext, TemplateContext } from '../../inspection/domain/inspection.js';
import { createInspection } from '../../inspection/domain/inspection.js';
import type { InspectionRepository } from '../../inspection/ports/repository.js';
import type { TemplateRepository } from '../../templates/ports/repository.js';
import type { ReceivingRepository } from '../ports/repository.js';

/**
 * QC-DATA-001 — Create an inspection report from its receiving record.
 *
 * The receiving record is the preferred origin of an inspection: item code,
 * description, supplier, purchase order, lot, received quantity and dates are
 * prefilled server-side from the receiving row, and the link
 * (`inspection_reports.receiving_item_id`) is preserved. The inspector never
 * re-types received data.
 *
 * Fail-closed gates (no invented criteria):
 *  - the receiving record must be in READY_FOR_INSPECTION or UNDER_INSPECTION;
 *  - the inspection template version must be APPROVED, read server-side;
 *  - one in-flight report at a time — RETURNED/REJECTED/VOID reports allow a
 *    new report, an open one does not;
 *  - the business inspection number stays operator-supplied (no invented
 *    numbering policy), the technical id is minted server-side.
 */
export interface InspectionOriginDependencies {
  receiving: Pick<ReceivingRepository, 'get'>;
  inspection: Pick<InspectionRepository, 'create'>;
  template: Pick<TemplateRepository, 'get'>;
}

const IN_FLIGHT_REPORT_STATES = [
  'DRAFT',
  'SUBMITTED',
  'UNDER_REVIEW',
  'PENDING_QCM_APPROVAL',
] as const;

export class CreateInspectionFromReceivingUseCase {
  constructor(
    private readonly deps: InspectionOriginDependencies,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(i: {
    actor: ActorContext;
    receivingId: string;
    templateVersionId: string;
    inspectionNo: string;
    assignedTo?: string;
    requestId: string;
  }) {
    authorize(
      {
        actor: i.actor,
        permission: 'PERM-INSP-CREATE',
        action: 'CREATE',
        entity: {
          type: 'INSPECTION_REPORT',
          id: 'new',
          state: 'DRAFT',
          ownerId: i.actor.id,
          authorId: i.actor.id,
        },
        scope: { ownerId: i.actor.id },
        currentVersion: 1n,
        expectedVersion: 1n,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );

    const item = await this.deps.receiving.get(i.receivingId, i.actor);
    if (!item) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (
      item.workflowState !== 'READY_FOR_INSPECTION' &&
      item.workflowState !== 'UNDER_INSPECTION'
    ) {
      throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
    }
    const inFlight = item.linkedInspections?.some((report) =>
      (IN_FLIGHT_REPORT_STATES as readonly string[]).includes(report.state),
    );
    if (inFlight) throw new AppError('CONFLICT_DUPLICATE_COMMAND', { userSafe: true });

    const templateVersion = await this.deps.template.get(i.templateVersionId, i.actor);
    if (!templateVersion || templateVersion.state !== 'APPROVED') {
      // Fail-closed: an inspection can only be created from an approved
      // template version, read server-side — never from a browser claim.
      throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    }
    const template: TemplateContext = {
      templateId: templateVersion.templateId,
      templateVersionId: templateVersion.id,
      versionNo: templateVersion.versionNo,
      approved: true,
      templateSnapshot: {
        versionNo: templateVersion.versionNo,
        name: templateVersion.name,
        sourceDocument: templateVersion.sourceDocument ?? null,
      },
      sourceDocument: templateVersion.sourceDocument ?? undefined,
    };

    const receiving: ReceivingContext = {
      receivingId: item.id,
      receivingNo: item.receivingNo,
      supplier: item.supplier || undefined,
      docNo: item.docNo,
      itemCode: item.itemCode,
      description: item.description,
      lot: item.lot,
      qty: item.qty,
      quantityUnit: item.quantityUnit,
      purchaseOrderNo: item.purchaseOrderNo,
      receivingDate: item.receivingDate,
      expiryDate: item.expiryDate,
    };

    const inspection = createInspection({
      id: uuidv7(),
      inspectionNo: i.inspectionNo.trim(),
      receiving,
      template,
      authorId: i.actor.id,
      assignedTo: i.assignedTo,
      now: this.now(),
    });
    await this.deps.inspection.create({
      inspection,
      actor: i.actor,
      requestId: i.requestId,
      originAudit: { receivingItemId: item.id },
    });
    return inspection;
  }
}
