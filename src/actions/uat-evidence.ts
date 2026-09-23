import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import {
  UAT_ACCEPTANCE_OUTCOMES,
  UAT_ASSISTANCE,
  UAT_DEFECT_SEVERITIES,
  UAT_DEFECT_STATUSES,
  UAT_ENVIRONMENTS,
  UAT_PARTICIPANT_ROLES,
  UAT_SCENARIO_STATUSES,
  UAT_SEVERITIES,
  UAT_TASK_ACCEPT_REJECT,
} from '../modules/uat-evidence/application/input-vocabulary.js';
import { uatEvidenceActionDependencies } from '../modules/uat-evidence/application/dependencies.js';
import { isNamedSystemOwner } from '../shared/authorization/p05-authority.js';
import { AppError } from '../shared/errors/app-error.js';

const actor = (context: { locals: App.Locals }) => {
  if (!context.locals.actor) throw new AppError('AUTH_REQUIRED', { userSafe: true });
  return context.locals.actor;
};

const owner = (context: { locals: App.Locals }) => {
  const current = actor(context);
  if (!isNamedSystemOwner(current)) throw new AppError('AUTHZ_DENIED', { userSafe: true });
  return current;
};

const ingestionActor = (current: ReturnType<typeof actor>) => ({
  id: current.id,
  loginIdentity: current.loginIdentity ?? '',
  accountState: current.accountState,
  roles: current.roles,
});

const requestId = (context: { locals: App.Locals }) =>
  context.locals.requestContext?.requestId ?? 'unknown';

const run = async <T>(work: () => Promise<T>): Promise<T> => {
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
      message: appError.userSafe ? appError.message : 'Unable to complete the UAT evidence action.',
    });
  }
};

const cycleIdentity = z.object({
  cycleId: z.string().trim().min(3).max(128),
  releaseId: z.string().trim().min(1).max(128),
  gitSha: z.string().regex(/^[0-9a-f]{40}$/i),
  buildId: z.string().trim().min(1).max(128),
  applicationVersion: z.string().trim().min(1).max(128),
  migrationHead: z.string().trim().min(1).max(128),
  environment: z.enum(UAT_ENVIRONMENTS),
  planReference: z.string().trim().min(1).max(500),
});

const session = z.object({
  sessionId: z.string().trim().min(1).max(128),
  taskId: z.string().trim().min(1).max(128),
  participantRole: z.enum(UAT_PARTICIPANT_ROLES),
  participantCode: z.string().trim().min(1).max(128),
  startedAt: z.coerce.date(),
  endedAt: z.coerce.date(),
  timeOnTaskSeconds: z.number().int().nonnegative(),
  taskSuccess: z.boolean(),
  errorCount: z.number().int().nonnegative(),
  backtrackingCount: z.number().int().nonnegative(),
  failedNavigationCount: z.number().int().nonnegative(),
  formCorrectionCount: z.number().int().nonnegative(),
  assistance: z.enum(UAT_ASSISTANCE),
  wrongActionAttempts: z.number().int().nonnegative(),
  confidence1To5: z.number().int().min(1).max(5),
  seq1To7: z.number().int().min(1).max(7),
  observations: z.string(),
  severity: z.enum(UAT_SEVERITIES),
  participantComments: z.string(),
  scenarioStatus: z.enum(UAT_SCENARIO_STATUSES),
  taskAcceptReject: z.enum(UAT_TASK_ACCEPT_REJECT),
  evidenceReference: z.string().trim().min(1).max(2000),
});

const defect = z.object({
  defectId: z.string().trim().min(1).max(128),
  sessionId: z.string().trim().min(1).max(128),
  taskId: z.string().trim().min(1).max(128),
  severity: z.enum(UAT_DEFECT_SEVERITIES),
  title: z.string().trim().min(1).max(500),
  observedEvidence: z.string().trim().min(1),
  expectedBusinessOutcome: z.string(),
  actualBusinessOutcome: z.string(),
  requestIdOrRef: z.string().trim().min(1).max(500),
  status: z.enum(UAT_DEFECT_STATUSES),
});

const createCycle = defineAction({
  accept: 'json',
  input: z.object({ identity: cycleIdentity, inProgress: z.boolean().optional() }),
  handler: (input, context) =>
    run(() => {
      const current = owner(context);
      return uatEvidenceActionDependencies().createCycle.execute({
        identity: input.identity,
        requestId: requestId(context),
        ...(input.inProgress ? { status: 'IN_PROGRESS' as const } : {}),
        actor: ingestionActor(current),
      });
    }),
});

const recordSession = defineAction({
  accept: 'json',
  input: z.object({ cycleId: z.string().trim().min(1).max(128), session }),
  handler: (input, context) =>
    run(() => {
      const current = actor(context);
      return uatEvidenceActionDependencies().recordSession.execute({
        cycleId: input.cycleId,
        session: input.session,
        requestId: requestId(context),
        actor: ingestionActor(current),
      });
    }),
});

const recordDefect = defineAction({
  accept: 'json',
  input: z.object({ cycleId: z.string().trim().min(1).max(128), defect }),
  handler: (input, context) =>
    run(() => {
      const current = owner(context);
      return uatEvidenceActionDependencies().recordDefect.execute({
        cycleId: input.cycleId,
        defect: input.defect,
        requestId: requestId(context),
        actor: ingestionActor(current),
      });
    }),
});

const getEvidence = defineAction({
  accept: 'json',
  input: z.object({ cycleId: z.string().trim().min(1).max(128) }),
  handler: (input, context) =>
    run(() =>
      uatEvidenceActionDependencies().getEvidence.execute({
        actor: actor(context),
        cycleId: input.cycleId,
      }),
    ),
});

const acceptCycle = defineAction({
  accept: 'json',
  input: z.object({
    cycleId: z.string().trim().min(1).max(128),
    outcome: z.enum(UAT_ACCEPTANCE_OUTCOMES),
    releaseRowId: z.string().uuid(),
    releaseVersion: z.coerce.bigint(),
    evidenceVersion: z.coerce.bigint(),
    reauthenticationSecret: z.string().min(1),
  }),
  handler: (input, context) => {
    const current = actor(context);
    return run(() =>
      uatEvidenceActionDependencies().acceptCycle.execute({
        actor: current,
        signer: ingestionActor(current),
        cycleId: input.cycleId,
        outcome: input.outcome,
        releaseRowId: input.releaseRowId,
        releaseVersion: input.releaseVersion,
        evidenceVersion: input.evidenceVersion,
        reauthenticationSecret: input.reauthenticationSecret,
        requestId: requestId(context),
      }),
    );
  },
});

export const uatEvidence = { createCycle, recordSession, recordDefect, getEvidence, acceptCycle };
