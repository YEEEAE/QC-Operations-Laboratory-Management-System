import { getDatabase } from '../../../shared/database/database.js';
import { PostgresAuditRepository } from '../../../shared/audit/postgres-audit-repository.js';
import { PostgresOutboxRepository } from '../../../shared/outbox/postgres-outbox-repository.js';
import { Argon2idPasswordHasher } from '../../identity/security/argon2-password-hasher.js';
import { PostgresUserRepository } from '../../identity/infrastructure/postgres-user-repository.js';
import { PostgresApprovalRepository } from '../infrastructure/postgres-repository.js';
import { PostgresSignatureEvidenceRepository } from '../../e-signatures/infrastructure/postgres-repository.js';
import { SignControlledActionUseCase } from '../../e-signatures/application/sign-controlled-action.js';
import { ListMyApprovalsUseCase } from './list-my-approvals.js';
import { GetApprovalUseCase } from './get-approval.js';
import {
  DecideApprovalUseCase,
  type SubjectTransition,
  type SignaturePolicy,
} from './decide-approval.js';
import { ResolveApprovalDecisionCapabilitiesUseCase } from './decision-capabilities.js';
import { documentsActionDependencies } from '../../documents/application/dependencies.js';
import { laboratoryActionDependencies } from '../../laboratory/application/dependencies.js';
import { quarantineActionDependencies } from '../../quarantine/application/dependencies.js';
import { changeRequestsActionDependencies } from '../../change-requests/application/dependencies.js';
import { AppError } from '../../../shared/errors/app-error.js';

const blocked = async (): Promise<never> => {
  throw new AppError('AUTHZ_DENIED', { userSafe: true });
};

function transitionDependencies() {
  const documents = documentsActionDependencies();
  const laboratory = laboratoryActionDependencies();
  const quarantine = quarantineActionDependencies();
  const changeRequests = changeRequestsActionDependencies();
  const documentsTransition: SubjectTransition = {
    decisions: ['APPROVE'],
    execute: async (input) => {
      if (input.action !== 'APPROVE') return blocked();
      const result = await documents.approve.execute({
        actor: input.actor,
        versionId: input.subjectId,
        expectedVersion: input.expectedVersion,
        requestId: input.requestId,
        transaction: input.transaction,
      });
      return { subjectId: result.id, version: result.version, state: result.state };
    },
  };
  const labTransition: SubjectTransition = {
    decisions: ['APPROVE'],
    execute: async (input) => {
      if (input.action !== 'APPROVE') return blocked();
      const result = await laboratory.approve.execute({
        actor: input.actor,
        id: input.subjectId,
        expectedVersion: input.expectedVersion,
        requestId: input.requestId,
        transaction: input.transaction,
      });
      return { subjectId: result.id, version: result.version, state: result.state };
    },
  };
  const inspectionTransition: SubjectTransition = {
    decisions: ['APPROVE', 'RETURN'],
    execute: async (input) => {
      if (input.action === 'RETURN') {
        const result = await quarantine.inspection.return.execute({
          actor: input.actor,
          id: input.subjectId,
          expectedVersion: input.expectedVersion,
          reason: input.reason ?? '',
          requestId: input.requestId,
          transaction: input.transaction,
        });
        return { subjectId: result.id, version: result.version, state: result.state };
      }
      if (input.action === 'APPROVE') {
        const result = await quarantine.inspection.approve.execute({
          actor: input.actor,
          id: input.subjectId,
          expectedVersion: input.expectedVersion,
          requestId: input.requestId,
          transaction: input.transaction,
        });
        return { subjectId: result.id, version: result.version, state: result.state };
      }
      return blocked();
    },
  };
  const changeRequestTransition: SubjectTransition = {
    decisions: ['APPROVE', 'REJECT', 'RETURN'],
    execute: async (input) => {
      if (!['APPROVE', 'REJECT', 'RETURN'].includes(input.action)) return blocked();
      const result = await changeRequests.transition.execute({
        actor: input.actor,
        id: input.subjectId,
        expectedVersion: input.expectedVersion,
        action: input.action,
        reason: input.reason,
        requestId: input.requestId,
        transaction: input.transaction,
      });
      return {
        subjectId: result.changeRequest.id,
        version: result.changeRequest.version,
        state: result.changeRequest.state,
      };
    },
  };
  return {
    DOCUMENT_VERSION: documentsTransition,
    LAB_TEST: labTransition,
    INSPECTION_REPORT: inspectionTransition,
    CHANGE_REQUEST: changeRequestTransition,
  };
}

function verifier(database: ReturnType<typeof getDatabase>) {
  const users = new PostgresUserRepository(database);
  const passwords = new Argon2idPasswordHasher();
  return {
    verify: async (input: { actorId: string; secret: string }): Promise<boolean> => {
      const user = await users.findById(input.actorId);
      return Boolean(
        user &&
        user.accountState === 'ACTIVE' &&
        (await passwords.verify(input.secret, user.passwordHash)),
      );
    },
  };
}

export function approvalsReadDependencies() {
  const database = getDatabase();
  const repository = new PostgresApprovalRepository(database);
  const transitions = transitionDependencies();
  // PD-32 is still open. Keep decision signing unresolved until QMS supplies
  // the approved action-to-signature map; capabilities expose that block.
  const signaturePolicy: SignaturePolicy = {
    requirement: () => ({ status: 'UNRESOLVED' }),
  };
  const capabilities = new ResolveApprovalDecisionCapabilitiesUseCase({
    subjectTransitions: transitions,
    signaturePolicy,
    signerAvailable: true,
  });
  return {
    list: new ListMyApprovalsUseCase(repository, capabilities),
    get: new GetApprovalUseCase(repository, capabilities),
    decisionPolicyStatus: 'UNRESOLVED' as const,
  };
}

export function approvalsActionDependencies() {
  const database = getDatabase();
  const repository = new PostgresApprovalRepository(
    database,
    new PostgresAuditRepository(database),
    new PostgresOutboxRepository(database),
  );
  const signatures = new PostgresSignatureEvidenceRepository(database);
  const signer = new SignControlledActionUseCase(signatures, verifier(database));
  return {
    decide: new DecideApprovalUseCase(repository, {
      subjectTransitions: transitionDependencies(),
      signaturePolicy: { requirement: () => ({ status: 'UNRESOLVED' }) },
      signer,
    }),
  };
}
