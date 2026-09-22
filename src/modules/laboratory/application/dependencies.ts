import { getDatabase } from '../../../shared/database/database.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import { PostgresOutboxRepository } from '../../../shared/outbox/postgres-outbox-repository.js';
import { createFinalApprovalCeremony } from '../../e-signatures/application/final-approval-ceremony.js';
import { FinalApproveLabTestUseCase } from './final-approve-lab-test.js';
import { ReopenLabTestUseCase } from './reopen-lab-test.js';
import { PostgresLabRepository } from '../infrastructure/postgres-repository.js';
import { PostgresControlledLabSources } from '../infrastructure/postgres-controlled-sources.js';
import { assetsEligibilityDependencies } from '../../assets/application/dependencies.js';
import { CreateLabTestUseCase } from './create-lab-test.js';
import { GetLabTestUseCase } from './get-lab-test.js';
import { GetLabWorkloadUseCase } from './get-lab-workload.js';
import { ListApprovedLabTemplatesUseCase } from './list-approved-templates.js';
import { ListLabTestsUseCase } from './list-lab-tests.js';
import { RecordLabRunUseCase } from './record-lab-run.js';
import { RecordRunEquipmentUseCase } from './record-run-equipment.js';
import { SaveMeasurementsUseCase } from './save-measurements.js';
import { SubmitLabTestUseCase } from './submit-lab-test.js';
import { ReviewLabTestUseCase } from './review-lab-test.js';
import { ReturnLabTestUseCase } from './return-lab-test.js';
import { ResumeLabTestUseCase } from './resume-lab-test.js';
import { ApproveLabTestUseCase } from './approve-lab-test.js';
import { RejectLabTestUseCase } from './reject-lab-test.js';
import { CreateRetestUseCase } from './create-retest.js';
import { createPasswordReauthenticationVerifier } from '../../e-signatures/application/reauthentication-verifier.js';
export function laboratoryReadDependencies() {
  const repository = new PostgresLabRepository(getDatabase());
  const sources = new PostgresControlledLabSources(getDatabase());
  return {
    get: new GetLabTestUseCase(repository),
    list: new ListLabTestsUseCase(repository),
    workload: new GetLabWorkloadUseCase(repository),
    listApprovedTemplates: new ListApprovedLabTemplatesUseCase(sources),
  };
}
export function laboratoryActionDependencies() {
  const db = getDatabase();
  const repository = new PostgresLabRepository(
    db,
    new PostgresAuditRepository(db),
    new PostgresOutboxRepository(db),
  );
  const sources = new PostgresControlledLabSources(db);
  // QC-100-FINAL-004: the final (QCM) lab approval carries the binding
  // e-signature; the Supervisor stage approval above it does not.
  const finalApprovalCeremony = createFinalApprovalCeremony(
    createPasswordReauthenticationVerifier(db),
  );
  return {
    create: new CreateLabTestUseCase(repository, sources),
    saveMeasurements: new SaveMeasurementsUseCase(repository),
    // QC-DATA-003: run/batch, replicated readings, approved calculations and
    // derived sample results.
    recordRun: new RecordLabRunUseCase(repository),
    // Run-level equipment evidence, verified by the approved Assets policy.
    recordRunEquipment: new RecordRunEquipmentUseCase(
      repository,
      assetsEligibilityDependencies(),
    ),
    submit: new SubmitLabTestUseCase(repository, sources, assetsEligibilityDependencies()),
    review: new ReviewLabTestUseCase(repository),
    return: new ReturnLabTestUseCase(repository),
    resume: new ResumeLabTestUseCase(repository),
    // Stage-1 (Supervisor): validates the evaluated scientific result.
    approve: new ApproveLabTestUseCase(repository, sources),
    // Stage-2 (QCM / named owner): final approval + binding e-signature.
    finalApprove: new FinalApproveLabTestUseCase(repository, finalApprovalCeremony),
    reopen: new ReopenLabTestUseCase(repository),
    // TR-LAB-007 reject decision authority is POLICY SOURCE REQUIRED:
    // the use case is wired with the default fail-closed policy.
    reject: new RejectLabTestUseCase(repository),
    retest: new CreateRetestUseCase(repository, sources),
  };
}
