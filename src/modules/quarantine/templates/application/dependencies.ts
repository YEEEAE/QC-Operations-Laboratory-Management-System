import { getDatabase } from '../../../../shared/database/database.js';
import { PostgresAuditRepository } from '../../../../shared/audit/postgres-audit-repository.js';
import { PostgresOutboxRepository } from '../../../../shared/outbox/postgres-outbox-repository.js';
import { PostgresSignatureEvidenceRepository } from '../../../e-signatures/infrastructure/postgres-repository.js';
import { Argon2idPasswordHasher } from '../../../identity/security/argon2-password-hasher.js';
import { PostgresUserRepository } from '../../../identity/infrastructure/postgres-user-repository.js';
import { PostgresTemplateRepository } from '../infrastructure/postgres-repository.js';
import { createTemplateCeremony } from './template-ceremony.js';
import { CreateTemplateUseCase } from './create-template.js';
import {
  ApproveTemplateUseCase,
  ReviewTemplateUseCase,
  StopTemplateUseCase,
  SupersedeTemplateUseCase,
  VoidTemplateUseCase,
} from './lifecycle.js';
import {
  GetTemplateUseCase,
  ListTemplatesUseCase,
  ReviseTemplateUseCase,
} from './revise-and-read.js';

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

export function templateActionDependencies() {
  const database = getDatabase();
  const repository = new PostgresTemplateRepository(
    database,
    new PostgresAuditRepository(database),
    new PostgresOutboxRepository(database),
  );
  const signatures = new PostgresSignatureEvidenceRepository(database);
  const ceremony = createTemplateCeremony(signatures, verifier(database));
  return {
    create: new CreateTemplateUseCase(repository, ceremony),
    review: new ReviewTemplateUseCase(repository),
    approve: new ApproveTemplateUseCase(repository, ceremony),
    stop: new StopTemplateUseCase(repository, ceremony),
    void: new VoidTemplateUseCase(repository, ceremony),
    supersede: new SupersedeTemplateUseCase(repository, ceremony),
    revise: new ReviseTemplateUseCase(repository),
    get: new GetTemplateUseCase(repository),
    list: new ListTemplatesUseCase(repository),
  };
}

export function templateReadDependencies() {
  const repository = new PostgresTemplateRepository(getDatabase());
  return {
    get: new GetTemplateUseCase(repository),
    list: new ListTemplatesUseCase(repository),
  };
}
