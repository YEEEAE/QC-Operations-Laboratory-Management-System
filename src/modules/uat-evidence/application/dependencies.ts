/**
 * QC-100-FINAL-004 Task 5 — Composition root for the UAT evidence module.
 * Delivery surfaces (CLI/scripts) resolve dependencies only through this
 * factory, keeping the Delivery → infrastructure boundary intact.
 */
import { getDatabase } from '../../../shared/database/database.js';
import { Argon2idPasswordHasher } from '../../identity/security/argon2-password-hasher.js';
import { PostgresUserRepository } from '../../identity/infrastructure/postgres-user-repository.js';
import type { ReauthenticationVerifier } from '../../e-signatures/ports/repository.js';
import { PostgresUatEvidenceRepository, executeUatAcceptance } from '../infrastructure/postgres-repository.js';
import {
  AcceptUatCycleUseCase,
  CreateUatCycleUseCase,
  GetUatCycleEvidenceUseCase,
  RecordUatDefectUseCase,
  RecordUatSessionUseCase,
  type UatAcceptanceSignatureService,
} from './use-cases.js';
import { uuidv7 } from '../../../shared/id/uuid.js';

export function uatEvidenceActionDependencies() {
  const database = getDatabase();
  const repository = new PostgresUatEvidenceRepository(database);
  const users = new PostgresUserRepository(database);
  const passwords = new Argon2idPasswordHasher();
  const verifier: ReauthenticationVerifier = {
    verify: async (input: { actorId: string; secret: string }): Promise<boolean> => {
      const user = await users.findById(input.actorId);
      return Boolean(
        user &&
          user.accountState === 'ACTIVE' &&
          (await passwords.verify(input.secret, user.passwordHash)),
      );
    },
  };
  const signatureService: UatAcceptanceSignatureService = {
    create: (input) => ({ id: uuidv7(), ...input }),
  };
  return {
    repository,
    createCycle: new CreateUatCycleUseCase(repository),
    recordSession: new RecordUatSessionUseCase(repository),
    recordDefect: new RecordUatDefectUseCase(repository),
    acceptCycle: new AcceptUatCycleUseCase(
      repository,
      (acceptanceInput) => executeUatAcceptance(database, acceptanceInput),
      verifier,
      signatureService,
    ),
    getEvidence: new GetUatCycleEvidenceUseCase(repository),
  };
}
