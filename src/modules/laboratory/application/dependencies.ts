import { getDatabase } from '../../../shared/database/database.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import { PostgresOutboxRepository } from '../../../shared/outbox/postgres-outbox-repository.js';
import { PostgresLabRepository } from '../infrastructure/postgres-repository.js';
import { PostgresControlledLabSources } from '../infrastructure/postgres-controlled-sources.js';
import type { AssetsEligibility,ControlledLabSources } from '../ports/controlled-sources.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { CreateLabTestUseCase } from './create-lab-test.js'; import { GetLabTestUseCase } from './get-lab-test.js'; import { ListLabTestsUseCase } from './list-lab-tests.js'; import { SaveMeasurementsUseCase } from './save-measurements.js'; import { SubmitLabTestUseCase } from './submit-lab-test.js';
import { ReviewLabTestUseCase } from './review-lab-test.js'; import { ReturnLabTestUseCase } from './return-lab-test.js'; import { ResumeLabTestUseCase } from './resume-lab-test.js'; import { ApproveLabTestUseCase } from './approve-lab-test.js'; import { CreateRetestUseCase } from './create-retest.js';
const blocked=()=>{throw new AppError('AUTHZ_DENIED',{userSafe:true});};
const blockedSources:ControlledLabSources={resolve:async()=>blocked(),validateExecution:async()=>blocked(),evaluate:async()=>blocked()}; const assets:AssetsEligibility={verify:async()=>blocked()};
export function laboratoryReadDependencies(){const repository=new PostgresLabRepository(getDatabase());return {get:new GetLabTestUseCase(repository),list:new ListLabTestsUseCase(repository)};}
export function laboratoryActionDependencies(){const db=getDatabase();const repository=new PostgresLabRepository(db,new PostgresAuditRepository(db),new PostgresOutboxRepository(db));const sources=new PostgresControlledLabSources(db);return {create:new CreateLabTestUseCase(repository,sources),saveMeasurements:new SaveMeasurementsUseCase(repository),submit:new SubmitLabTestUseCase(repository,sources,assets),review:new ReviewLabTestUseCase(repository),return:new ReturnLabTestUseCase(repository),resume:new ResumeLabTestUseCase(repository),approve:new ApproveLabTestUseCase(repository,sources),retest:new CreateRetestUseCase(repository,sources)};}
