import { createHash } from 'node:crypto';
import { authorize } from '../../../../shared/authorization/authorize.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { stableJson } from '../../../../shared/json/stable-stringify.js';
import { createSignatureEvidence, type SignatureEvidence } from '../../../e-signatures/domain/signature-evidence.js';
import type { ReauthenticationVerifier } from '../../../e-signatures/ports/repository.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import { CAPA_CLOSE_ELIGIBLE_STATES, transitionCapa } from '../domain/capa.js';
import type { CapaRepository } from '../ports/repository.js';

export interface CloseCapaSignatureService {
  create(input: Omit<SignatureEvidence, 'id' | 'signedAt'>): SignatureEvidence;
}

export class CloseCapaUseCase {
  constructor(
    private readonly repository: CapaRepository,
    private readonly verifier: ReauthenticationVerifier,
    private readonly now = () => new Date(),
    private readonly signatureService: CloseCapaSignatureService = {
      create: (input) => createSignatureEvidence({ ...input, signedAt: new Date() }),
    },
  ) {}

  async execute(input: {
    actor: ActorContext;
    id: string;
    expectedVersion: bigint;
    reason: string;
    reauthenticationSecret: string;
    requestId: string;
  }) {
    if (!input.reason?.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    if (!input.requestId?.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    if (!input.actor.roles.includes('SUPERVISOR')) throw new AppError('AUTHZ_DENIED', { userSafe: true });
    const capa = await this.repository.get(input.id, input.actor);
    if (!capa) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-CAPA-CLOSE',
        action: 'CLOSE',
        entity: { type: 'CAPA', id: capa.id, state: capa.state, ownerId: capa.ownerId ?? capa.createdBy },
        scope: { ownerId: capa.ownerId ?? capa.createdBy },
        currentVersion: capa.version,
        expectedVersion: input.expectedVersion,
        businessCondition: CAPA_CLOSE_ELIGIBLE_STATES.includes(capa.state),
      },
      { throwOnDeny: true },
    );
    transitionCapa(capa, 'CLOSE', this.now(), input.reason);
    if (!input.reauthenticationSecret?.trim()) throw new AppError('AUTH_REAUTH_REQUIRED', { userSafe: true });
    const valid = await this.verifier.verify({ actorId: input.actor.id, secret: input.reauthenticationSecret, requestId: input.requestId });
    if (!valid) throw new AppError('AUTH_REAUTH_REQUIRED', { userSafe: true });
    const snapshot = { capa, actions: capa.actions };
    const snapshotHash = createHash('sha256').update(stableJson(snapshot)).digest('hex');
    const signature = this.signatureService.create({
      actorId: input.actor.id,
      subjectType: 'CAPA',
      subjectId: capa.id,
      subjectVersion: capa.version,
      action: 'CLOSE',
      meaning: `Close CAPA ${capa.capaNo}, version ${capa.version}`,
      snapshotHash,
      reason: input.reason,
      reauthMethod: 'PASSWORD',
      requestId: input.requestId,
    });
    return this.repository.close({ ...input, reason: input.reason.trim(), signature });
  }
}
