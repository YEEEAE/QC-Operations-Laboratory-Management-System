import { authorize } from '../../../../shared/authorization/authorize.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { ReceivingItem } from '../domain/receiving-item.js';
import type { ReceivingRepository } from '../ports/repository.js';
import { isP05Authority } from '../../../../shared/authorization/p05-authority.js';
import { getPilotScope, isPilotShadowMode } from '../../../../config/pilot.js';
import { getServerEnv } from '../../../../config/env.js';

export type ReleaseGateStatus = 'PASS' | 'BLOCKED' | 'UNAVAILABLE';
export interface ReleaseGateEvaluation {
  decisionSource: string;
  releaseAuthorityId?: string;
  linkedInspectionReportId?: string;
  scientificPass: ReleaseGateStatus;
  effectiveDocuments: ReleaseGateStatus;
  noOpenHold: ReleaseGateStatus;
  notExpired: ReleaseGateStatus;
  noOpenReject: ReleaseGateStatus;
  freshEvidence: ReleaseGateStatus;
  approvedReleaseAuthority: ReleaseGateStatus;
}

export interface ReleasePolicy {
  evaluate(input: { item: ReceivingItem; actor: ActorContext }): Promise<ReleaseGateEvaluation>;
}

// Production release stays disabled until an approved source adapter is wired
// to this boundary. A provider failure never becomes an implicit approval.
const unavailableReleasePolicy: ReleasePolicy = {
  evaluate: async () => ({
    decisionSource: 'NO_APPROVED_RELEASE_AUTHORITY_SOURCE',
    scientificPass: 'UNAVAILABLE',
    effectiveDocuments: 'UNAVAILABLE',
    noOpenHold: 'UNAVAILABLE',
    notExpired: 'UNAVAILABLE',
    noOpenReject: 'UNAVAILABLE',
    freshEvidence: 'UNAVAILABLE',
    approvedReleaseAuthority: 'UNAVAILABLE',
  }),
};

export class ReleaseReceivingUseCase {
  constructor(
    private readonly repository: ReceivingRepository,
    private readonly policy: ReleasePolicy = unavailableReleasePolicy,
  ) {}

  async execute(input: {
    actor: ActorContext;
    id: string;
    expectedVersion: bigint;
    requestId: string;
    reason: string;
  }) {
    if (!input.reason.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    const env = getServerEnv();
    const pilotProfile = env.APP_ENVIRONMENT_PROFILE === 'pilot';
    const item = await this.repository.get(input.id, input.actor);
    if (!item) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (!isP05Authority(input.actor)) throw new AppError('AUTHZ_DENIED', { userSafe: true });

    const gate = pilotProfile
      ? undefined
      : await this.policy.evaluate({ item, actor: input.actor }).catch(() => undefined);
    const gatesPass = Boolean(
      gate &&
      gate.scientificPass === 'PASS' &&
      gate.effectiveDocuments === 'PASS' &&
      gate.noOpenHold === 'PASS' &&
      gate.notExpired === 'PASS' &&
      gate.noOpenReject === 'PASS' &&
      gate.freshEvidence === 'PASS' &&
      gate.approvedReleaseAuthority === 'PASS' &&
      gate.releaseAuthorityId?.trim() &&
      gate.linkedInspectionReportId &&
      gate.linkedInspectionReportId === item.approvedInspectionReportId
    );
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-QUAR-RELEASE',
        action: 'RELEASE',
        entity: {
          type: 'RECEIVING_ITEM',
          id: item.id,
          state: item.workflowState,
          ownerId: item.createdBy,
        },
        scope: { ownerId: item.createdBy },
        sod: {
          actorId: input.actor.id,
          authorId: item.inspectionAuthorId,
          executorId: item.inspectionAuthorId,
        },
        currentVersion: item.version,
        expectedVersion: input.expectedVersion,
        businessCondition:
          item.workflowState === 'RELEASE_PENDING' &&
          !item.releaseSystem &&
          (pilotProfile
            ? item.inspectionResult === 'PASS' &&
              Boolean(item.approvedInspectionReportId) &&
              item.latestInspectionReportState === 'APPROVED' &&
              item.linkedInspections?.[0]?.id === item.approvedInspectionReportId &&
              item.linkedInspections[0]?.finalResult === 'PASS'
            : true),
      },
      { throwOnDeny: true },
    );

    if (pilotProfile) {
      if (!isPilotShadowMode()) throw new AppError('POLICY_SOURCE_REQUIRED', { userSafe: true });
      if (!this.repository.recordReleaseIntent) {
        throw new AppError('POLICY_SOURCE_REQUIRED', { userSafe: true });
      }
      const decision = await this.repository.recordReleaseIntent({
        ...input,
        profile: 'pilot',
        decisionSource: 'PILOT_SHADOW_ACTION',
        linkedInspectionReportId: item.approvedInspectionReportId,
        scope: getPilotScope(),
      });
      return { disposition: decision.decisionState, decisionId: decision.decisionId };
    }

    if (!this.repository.recordReleaseIntent) {
      throw new AppError('POLICY_SOURCE_REQUIRED', { userSafe: true });
    }
    const intent = await this.repository.recordReleaseIntent({
      ...input,
      profile: env.APP_ENVIRONMENT_PROFILE,
      decisionSource: env.APP_ENVIRONMENT_PROFILE === 'production'
        ? 'PRODUCTION_AUTHORITY_UNAVAILABLE'
        : 'NONPRODUCTION_AUTHORITY_UNAVAILABLE',
      linkedInspectionReportId: item.approvedInspectionReportId,
      scope: {},
      gateSnapshot: {
        ...(gate ?? {
          decisionSource: 'PRODUCTION_RELEASE_GATE_PROVIDER_UNAVAILABLE',
          scientificPass: 'UNAVAILABLE',
          effectiveDocuments: 'UNAVAILABLE',
          noOpenHold: 'UNAVAILABLE',
          notExpired: 'UNAVAILABLE',
          noOpenReject: 'UNAVAILABLE',
          freshEvidence: 'UNAVAILABLE',
          approvedReleaseAuthority: 'UNAVAILABLE',
        }),
        decisionResult: gatesPass ? 'GATES_PASS_AUTHORITY_NOT_PERSISTED' : 'PENDING_GATE_EVIDENCE',
      },
    });
    return { disposition: intent.decisionState, decisionId: intent.decisionId };
  }
}
