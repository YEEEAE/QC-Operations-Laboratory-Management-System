import { getDatabase } from '../../../shared/database/database.js';
import { PostgresQuarantineReadModel } from '../infrastructure/postgres-quarantine-read-model.js';
import { PostgresReceivingRepository } from '../receiving/infrastructure/postgres-repository.js';
import { PostgresInspectionRepository } from '../inspection/infrastructure/postgres-repository.js';
import { GetQuarantineOverviewUseCase } from './get-quarantine-overview.js';
import { GetQuarantineAdminUseCase } from './get-quarantine-admin.js';
import { GetReceivingUseCase } from '../receiving/application/get-receiving.js';
import { ListReceivingUseCase } from '../receiving/application/list-receiving.js';
import { GetInspectionUseCase } from '../inspection/application/get-inspection.js';
import { ListInspectionsUseCase } from '../inspection/application/list-inspections.js';
import { CreateReceivingUseCase } from '../receiving/application/create-receiving.js';
import { UpdateReceivingDraftUseCase } from '../receiving/application/update-receiving-draft.js';
import { TransitionReceivingUseCase } from '../receiving/application/transition-receiving.js';
import { HoldReceivingUseCase } from '../receiving/application/hold-receiving.js';
import { ReleaseReceivingUseCase } from '../receiving/application/release-receiving.js';
import { SaveInspectionDraftUseCase } from '../inspection/application/save-inspection-draft.js';
import { SubmitInspectionUseCase } from '../inspection/application/submit-inspection.js';
import { ReviewInspectionUseCase } from '../inspection/application/review-inspection.js';
import { ApproveInspectionUseCase } from '../inspection/application/approve-inspection.js';
import { ReturnInspectionUseCase } from '../inspection/application/return-inspection.js';
import { ResumeInspectionUseCase } from '../inspection/application/resume-inspection.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import { PostgresOutboxRepository } from '../../../shared/outbox/postgres-outbox-repository.js';

export function quarantineReadDependencies() {
  const reader = new PostgresQuarantineReadModel(getDatabase());
  return { overview: new GetQuarantineOverviewUseCase(reader), admin: new GetQuarantineAdminUseCase(reader) };
}
export function receivingReadDependencies() {
  const repository = new PostgresReceivingRepository(getDatabase());
  return { get: new GetReceivingUseCase(repository), list: new ListReceivingUseCase(repository) };
}
export function inspectionReadDependencies() {
  const repository = new PostgresInspectionRepository(getDatabase());
  return { get: new GetInspectionUseCase(repository), list: new ListInspectionsUseCase(repository) };
}

export function quarantineActionDependencies() {
  const database = getDatabase();
  const audit = new PostgresAuditRepository(database);
  const outbox = new PostgresOutboxRepository(database);
  const receivingRepository = new PostgresReceivingRepository(database, audit, outbox);
  const inspectionRepository = new PostgresInspectionRepository(database, audit, outbox);
  return {
    receiving: {
      create: new CreateReceivingUseCase(receivingRepository),
      updateDraft: new UpdateReceivingDraftUseCase(receivingRepository),
      transition: new TransitionReceivingUseCase(receivingRepository),
      hold: new HoldReceivingUseCase(receivingRepository),
      release: new ReleaseReceivingUseCase(receivingRepository),
    },
    inspection: {
      saveDraft: new SaveInspectionDraftUseCase(inspectionRepository),
      submit: new SubmitInspectionUseCase(inspectionRepository),
      review: new ReviewInspectionUseCase(inspectionRepository),
      approve: new ApproveInspectionUseCase(inspectionRepository),
      return: new ReturnInspectionUseCase(inspectionRepository),
      resume: new ResumeInspectionUseCase(inspectionRepository),
    },
  };
}
