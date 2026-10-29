import { getDatabase } from '../../../shared/database/database.js';
import { PostgresInProcessRepository } from '../infrastructure/postgres-repository.js';
import { GetInProcessWorkspaceUseCase } from './get-in-process-workspace.js';
import { GetInProcessSourceCatalogueUseCase, ListInProcessRunsUseCase } from './list-in-process-runs.js';
import { StartInProcessRunUseCase } from './start-run.js';
import { TranscribeInProcessCheckpointUseCase } from './transcribe-checkpoint.js';
import { VerifyInProcessCheckpointUseCase } from './verify-checkpoint.js';
import { RecordInProcessReadingUseCase } from './record-reading.js';
import { FlagInProcessDeviationUseCase } from './flag-deviation.js';
import { DisposeInProcessDeviationUseCase } from './dispose-deviation.js';
import {
  DecideInProcessHoldUseCase,
  RequestInProcessHoldUseCase,
} from './hold-requests.js';
import {
  AcceptInProcessHandoverUseCase,
  RecordInProcessHandoverUseCase,
} from './handovers.js';
import {
  CloseInProcessRunUseCase,
  ReviewInProcessRunUseCase,
  SubmitInProcessRunUseCase,
} from './run-lifecycle.js';

export function inProcessReadDependencies() {
  const repository = new PostgresInProcessRepository(getDatabase());
  return {
    listRuns: new ListInProcessRunsUseCase(repository),
    sources: new GetInProcessSourceCatalogueUseCase(repository),
    workspace: new GetInProcessWorkspaceUseCase(repository),
  };
}

export function inProcessActionDependencies() {
  const repository = new PostgresInProcessRepository(getDatabase());
  return {
    startRun: new StartInProcessRunUseCase(repository),
    transcribeCheckpoint: new TranscribeInProcessCheckpointUseCase(repository),
    verifyCheckpoint: new VerifyInProcessCheckpointUseCase(repository),
    recordReading: new RecordInProcessReadingUseCase(repository),
    flagDeviation: new FlagInProcessDeviationUseCase(repository),
    disposeDeviation: new DisposeInProcessDeviationUseCase(repository),
    requestHold: new RequestInProcessHoldUseCase(repository),
    decideHold: new DecideInProcessHoldUseCase(repository),
    recordHandover: new RecordInProcessHandoverUseCase(repository),
    acceptHandover: new AcceptInProcessHandoverUseCase(repository),
    submitRun: new SubmitInProcessRunUseCase(repository),
    reviewRun: new ReviewInProcessRunUseCase(repository),
    closeRun: new CloseInProcessRunUseCase(repository),
  };
}
