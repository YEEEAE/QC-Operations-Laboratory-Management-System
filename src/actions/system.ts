import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import {
  backupRestoreActionDependencies,
  recoveryGovernanceActionDependencies,
} from '../modules/backup-recovery/application/dependencies.js';
import { AppError } from '../shared/errors/app-error.js';

const requireActor = (context: { locals: App.Locals }) => {
  if (!context.locals.actor) throw new AppError('AUTH_REQUIRED', { userSafe: true });
  return context.locals.actor;
};
const requestId = (context: { locals: App.Locals }) =>
  context.locals.requestContext?.requestId ?? 'unknown';
const run = async <T>(
  work: () => Promise<T>,
  fallbackMessage = 'Unable to complete the recovery governance action.',
): Promise<T> => {
  try {
    return await work();
  } catch (error) {
    const appError =
      error instanceof AppError
        ? error
        : new AppError('SYSTEM_INTERNAL', { userSafe: false, cause: error });
    throw new ActionError({
      code:
        appError.category === 'AUTHENTICATION'
          ? 'UNAUTHORIZED'
          : appError.category === 'AUTHORIZATION'
            ? 'FORBIDDEN'
            : 'BAD_REQUEST',
      message: appError.userSafe ? appError.message : fallbackMessage,
    });
  }
};

/**
 * Controlled restore intent boundary. This action only records a restore
 * request after server-side validation and authorization; it never executes
 * a restore, never calls a recovery provider, and never reports a restore as
 * executed or verified. GET paths never reach this action.
 */
const requestRestore = defineAction({
  accept: 'json',
  input: z.object({
    backupId: z.string().uuid(),
    restoreType: z.enum(['DRILL', 'PRODUCTION']),
    targetEnvironment: z.enum(['local', 'test', 'staging', 'production']),
    reason: z.string().trim().min(1).max(2000),
    expectedVersion: z.string().regex(/^[a-f0-9]{64}$/i),
    idempotencyKey: z.string().uuid(),
    confirmRestore: z.literal(true),
  }),
  handler: (input, context) =>
    run(async () => {
      const { restore, orchestration } =
        await backupRestoreActionDependencies().requestRestore.execute({
          actor: requireActor(context),
          backupId: input.backupId,
          restoreType: input.restoreType,
          targetEnvironment: input.targetEnvironment,
          reason: input.reason,
          confirmation: input.confirmRestore,
          expectedVersion: input.expectedVersion,
          idempotencyKey: input.idempotencyKey,
          requestId: requestId(context),
        });
      return {
        restore: {
          id: restore.id,
          backupRunId: restore.backupRunId,
          restoreType: restore.restoreType,
          state: restore.state,
          targetEnvironment: restore.targetEnvironment,
          requestedAt: restore.requestedAt,
        },
        orchestration,
      };
    }, 'Unable to record the controlled restore request.'),
});

/**
 * Drafts a recovery policy version from an approved source. The draft is
 * PENDING_APPROVAL and carries no approval fields; no objective is defaulted.
 */
const draftRecoveryPolicy = defineAction({
  accept: 'json',
  input: z.object({
    rpoSeconds: z.number().int().positive().nullable(),
    rtoSeconds: z.number().int().positive().nullable(),
    retentionDays: z.number().int().positive().nullable(),
    immutableBackupCopies: z.number().int().positive().nullable(),
    responsiblePerson: z.string().trim().max(200).nullable(),
    sourceKind: z.enum(['CONTROLLED_DOCUMENT', 'QMS_DECISION', 'OWNER_DECISION']),
    policyReference: z.string().trim().max(200).nullable(),
    policyRevision: z.string().trim().max(100).nullable(),
    policySourceSha256: z.string().trim().regex(/^[a-f0-9]{64}$/i).nullable(),
    effectiveFrom: z.string().datetime({ offset: true }).nullable(),
    effectiveTo: z.string().datetime({ offset: true }).nullable(),
    expectedLatestRevision: z.number().int().nonnegative().nullable(),
  }),
  handler: (input, context) =>
    run(async () => {
      const policy = await recoveryGovernanceActionDependencies().createPolicyDraft.execute({
        actor: requireActor(context),
        expectedLatestRevision: input.expectedLatestRevision,
        requestId: requestId(context),
        draft: {
          rpoSeconds: input.rpoSeconds,
          rtoSeconds: input.rtoSeconds,
          retentionDays: input.retentionDays,
          immutableBackupCopies: input.immutableBackupCopies,
          responsiblePerson: input.responsiblePerson,
          sourceKind: input.sourceKind,
          policyReference: input.policyReference,
          policyRevision: input.policyRevision,
          policySourceSha256: input.policySourceSha256,
          effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : null,
          effectiveTo: input.effectiveTo ? new Date(input.effectiveTo) : null,
        },
      });
      return {
        policy: {
          id: policy.id,
          revision: policy.revision,
          status: policy.status,
          version: policy.version.toString(),
        },
      };
    }, 'Unable to record the recovery policy draft.'),
});

/** Releases or rejects one pending recovery policy version. */
const decideRecoveryPolicy = defineAction({
  accept: 'json',
  input: z.object({
    policyId: z.string().uuid(),
    decision: z.enum(['APPROVE', 'REJECT']),
    reason: z.string().trim().min(1).max(2000),
    approvalReference: z.string().trim().max(200).optional(),
    expectedVersion: z.string().regex(/^[0-9]+$/),
  }),
  handler: (input, context) =>
    run(async () => {
      const policy = await recoveryGovernanceActionDependencies().decidePolicy.execute({
        actor: requireActor(context),
        policyId: input.policyId,
        decision: input.decision,
        reason: input.reason,
        ...(input.approvalReference ? { approvalReference: input.approvalReference } : {}),
        expectedVersion: BigInt(input.expectedVersion),
        requestId: requestId(context),
      });
      return {
        policy: {
          id: policy.id,
          revision: policy.revision,
          status: policy.status,
          version: policy.version.toString(),
        },
      };
    }, 'Unable to record the recovery policy decision.'),
});

const recoveryIncidentDates = {
  detectedAt: z.string().datetime({ offset: true }),
  recoveredDataAsOf: z.string().datetime({ offset: true }).optional(),
  recoveryStartedAt: z.string().datetime({ offset: true }).optional(),
  recoveryValidatedAt: z.string().datetime({ offset: true }).optional(),
};

/** Records an append-only recovery incident observation. */
const recordRecoveryIncident = defineAction({
  accept: 'json',
  input: z.object({
    reference: z.string().trim().min(1).max(120),
    kind: z.enum([
      'BACKUP_FAILURE',
      'RESTORE_FAILURE',
      'POLICY_GAP',
      'PROVIDER_OUTAGE',
      'DATA_LOSS',
      'OBJECT_STORE_GAP',
    ]),
    environment: z.enum(['local', 'test', 'staging', 'production']),
    summary: z.string().trim().min(1).max(2000),
    ...recoveryIncidentDates,
  }),
  handler: (input, context) =>
    run(async () => {
      const incident = await recoveryGovernanceActionDependencies().recordIncident.execute({
        actor: requireActor(context),
        reference: input.reference,
        kind: input.kind,
        environment: input.environment,
        detectedAt: new Date(input.detectedAt),
        summary: input.summary,
        ...(input.recoveredDataAsOf ? { recoveredDataAsOf: new Date(input.recoveredDataAsOf) } : {}),
        ...(input.recoveryStartedAt ? { recoveryStartedAt: new Date(input.recoveryStartedAt) } : {}),
        ...(input.recoveryValidatedAt
          ? { recoveryValidatedAt: new Date(input.recoveryValidatedAt) }
          : {}),
        requestId: requestId(context),
      });
      return { incident: { id: incident.id, reference: incident.reference, state: incident.state } };
    }, 'Unable to record the recovery incident.'),
});

/** Closes an open incident with a new append-only closure row. */
const resolveRecoveryIncident = defineAction({
  accept: 'json',
  input: z.object({
    incidentId: z.string().uuid(),
    resolutionSummary: z.string().trim().min(1).max(2000),
    recoveredDataAsOf: z.string().datetime({ offset: true }).optional(),
    recoveryStartedAt: z.string().datetime({ offset: true }).optional(),
    recoveryValidatedAt: z.string().datetime({ offset: true }).optional(),
  }),
  handler: (input, context) =>
    run(async () => {
      const incident = await recoveryGovernanceActionDependencies().resolveIncident.execute({
        actor: requireActor(context),
        incidentId: input.incidentId,
        resolutionSummary: input.resolutionSummary,
        ...(input.recoveredDataAsOf ? { recoveredDataAsOf: new Date(input.recoveredDataAsOf) } : {}),
        ...(input.recoveryStartedAt ? { recoveryStartedAt: new Date(input.recoveryStartedAt) } : {}),
        ...(input.recoveryValidatedAt
          ? { recoveryValidatedAt: new Date(input.recoveryValidatedAt) }
          : {}),
        requestId: requestId(context),
      });
      return { incident: { id: incident.id, reference: incident.reference, state: incident.state } };
    }, 'Unable to resolve the recovery incident.'),
});

export const system = {
  requestRestore,
  draftRecoveryPolicy,
  decideRecoveryPolicy,
  recordRecoveryIncident,
  resolveRecoveryIncident,
};
