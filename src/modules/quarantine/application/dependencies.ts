import { getDatabase } from '../../../shared/database/database.js';
import { PostgresQuarantineReadModel } from '../infrastructure/postgres-quarantine-read-model.js';
import { PostgresReceivingRepository } from '../receiving/infrastructure/postgres-repository.js';
import { PostgresInspectionRepository } from '../inspection/infrastructure/postgres-repository.js';
import { GetQuarantineOverviewUseCase } from './get-quarantine-overview.js';
import { GetQuarantineAdminUseCase } from './get-quarantine-admin.js';
import { GetReceivingTrendUseCase } from './get-receiving-trend.js';
import { GetReceivingUseCase } from '../receiving/application/get-receiving.js';
import { ListReceivingUseCase } from '../receiving/application/list-receiving.js';
import { GetInspectionUseCase } from '../inspection/application/get-inspection.js';
import { ListInspectionsUseCase } from '../inspection/application/list-inspections.js';
import { CreateReceivingUseCase } from '../receiving/application/create-receiving.js';
import { UpdateReceivingDraftUseCase } from '../receiving/application/update-receiving-draft.js';
import { TransitionReceivingUseCase } from '../receiving/application/transition-receiving.js';
import { HoldReceivingUseCase } from '../receiving/application/hold-receiving.js';
import { ReleaseReceivingUseCase } from '../receiving/application/release-receiving.js';
import { CorrectReceivingUseCase } from '../receiving/application/correct-receiving.js';
import { CreateInspectionFromReceivingUseCase } from '../receiving/application/create-inspection-from-receiving.js';
import { PostgresTemplateRepository } from '../templates/infrastructure/postgres-repository.js';
import { SaveInspectionDraftUseCase } from '../inspection/application/save-inspection-draft.js';
import { SubmitInspectionUseCase } from '../inspection/application/submit-inspection.js';
import { ReviewInspectionUseCase } from '../inspection/application/review-inspection.js';
import { ApproveInspectionUseCase } from '../inspection/application/approve-inspection.js';
import { FinalApproveInspectionUseCase } from '../inspection/application/final-approve-inspection.js';
import { ReopenInspectionUseCase } from '../inspection/application/reopen-inspection.js';
import { ReturnInspectionUseCase } from '../inspection/application/return-inspection.js';
import { RejectInspectionUseCase } from '../inspection/application/reject-inspection.js';
import { ResumeInspectionUseCase } from '../inspection/application/resume-inspection.js';
import { VoidInspectionUseCase } from '../inspection/application/void-inspection.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import { PostgresOutboxRepository } from '../../../shared/outbox/postgres-outbox-repository.js';
import { createFinalApprovalCeremony } from '../../e-signatures/application/final-approval-ceremony.js';
import { createPasswordReauthenticationVerifier } from '../../e-signatures/application/reauthentication-verifier.js';
import { RecordInspectionResultsUseCase } from '../inspection/application/record-inspection-results.js';
import {
  LinkInspectionEquipmentUseCase,
  RecordInspectionAqlUseCase,
} from '../inspection/application/inspection-aql-equipment.js';
import { assetsEligibilityDependencies } from '../../assets/application/dependencies.js';
import {
  ManageItemTemplateMappingUseCase,
  PostgresItemMappingReader,
  ResolveInspectionTemplateUseCase,
} from '../inspection/application/resolve-inspection-template.js';

export function quarantineReadDependencies() {
  const database = getDatabase();
  const readModel = new PostgresQuarantineReadModel(database);
  const receiving = new ListReceivingUseCase(new PostgresReceivingRepository(database));
  return {
    // The overview projects the same register the drill-downs open, so every
    // counter and its link stay in agreement by construction.
    overview: new GetQuarantineOverviewUseCase({ list: (input) => receiving.execute(input) }),
    receivingTrend: new GetReceivingTrendUseCase(readModel),
    admin: new GetQuarantineAdminUseCase(readModel),
  };
}
export function receivingReadDependencies() {
  const repository = new PostgresReceivingRepository(getDatabase());
  return { get: new GetReceivingUseCase(repository), list: new ListReceivingUseCase(repository) };
}
export function inspectionReadDependencies() {
  const repository = new PostgresInspectionRepository(getDatabase());
  return {
    get: new GetInspectionUseCase(repository),
    list: new ListInspectionsUseCase(repository),
  };
}

export function quarantineActionDependencies() {
  const database = getDatabase();
  const audit = new PostgresAuditRepository(database);
  const outbox = new PostgresOutboxRepository(database);
  const receivingRepository = new PostgresReceivingRepository(database, audit, outbox);
  const inspectionRepository = new PostgresInspectionRepository(database, audit, outbox);
  const templateRepository = new PostgresTemplateRepository(database);
  // Final-approval evidence is persisted by the owning domain transaction.
  const finalApprovalCeremony = createFinalApprovalCeremony(
    createPasswordReauthenticationVerifier(database),
  );
  return {
    receiving: {
      create: new CreateReceivingUseCase(receivingRepository),
      updateDraft: new UpdateReceivingDraftUseCase(receivingRepository),
      transition: new TransitionReceivingUseCase(receivingRepository),
      hold: new HoldReceivingUseCase(receivingRepository),
      release: new ReleaseReceivingUseCase(receivingRepository),
      // QC-DATA-001: controlled correction and the receiving-origin inspection.
      correct: new CorrectReceivingUseCase(receivingRepository),
      createInspection: new CreateInspectionFromReceivingUseCase({
        receiving: receivingRepository,
        inspection: inspectionRepository,
        template: templateRepository,
      }),
    },
    inspection: {
      saveDraft: new SaveInspectionDraftUseCase(inspectionRepository),
      // QC-DATA-002: server-side evaluation of approved acceptance rules.
      recordResults: new RecordInspectionResultsUseCase(inspectionRepository, inspectionRepository),
      recordAql: new RecordInspectionAqlUseCase(inspectionRepository),
      linkEquipment: new LinkInspectionEquipmentUseCase(
        inspectionRepository,
        inspectionRepository.equipmentUsage,
        assetsEligibilityDependencies(),
      ),
      submit: new SubmitInspectionUseCase(inspectionRepository),
      review: new ReviewInspectionUseCase(inspectionRepository),
      // Stage-1 (Supervisor) approval: workflow event, no e-signature.
      approve: new ApproveInspectionUseCase(inspectionRepository),
      // Stage-2 (QCM / named owner) approval: the binding e-signature.
      finalApprove: new FinalApproveInspectionUseCase(inspectionRepository, finalApprovalCeremony),
      reopen: new ReopenInspectionUseCase(inspectionRepository),
      return: new ReturnInspectionUseCase(inspectionRepository),
      reject: new RejectInspectionUseCase(inspectionRepository),
      resume: new ResumeInspectionUseCase(inspectionRepository),
      void: new VoidInspectionUseCase(inspectionRepository),
    },
  };
}

export function inspectionMappingDependencies() {
  const database = getDatabase();
  return {
    resolve: new ResolveInspectionTemplateUseCase(new PostgresItemMappingReader(database)),
    manageMapping: new ManageItemTemplateMappingUseCase(database),
  };
}
