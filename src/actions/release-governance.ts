import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { releaseGovernanceActionDependencies } from '../modules/release-governance/application/dependencies.js';
import { AppError } from '../shared/errors/app-error.js';

const actor = (context: { locals: App.Locals }) => {
  if (!context.locals.actor) throw new AppError('AUTH_REQUIRED', { userSafe: true });
  return context.locals.actor;
};
const requestId = (context: { locals: App.Locals }) =>
  context.locals.requestContext?.requestId ?? 'unknown';
const run = async <T>(work: () => Promise<T>): Promise<T> => {
  try {
    return await work();
  } catch (error) {
    const appError =
      error instanceof AppError ? error : new AppError('SYSTEM_INTERNAL', { userSafe: false, cause: error });
    throw new ActionError({
      code:
        appError.category === 'AUTHENTICATION'
          ? 'UNAUTHORIZED'
          : appError.category === 'AUTHORIZATION'
            ? 'FORBIDDEN'
            : 'BAD_REQUEST',
      message: appError.userSafe ? appError.message : 'Unable to complete the release approval.',
    });
  }
};

const gate = z.enum(['PASS', 'PARTIAL', 'FAIL', 'UNVERIFIED', 'NOT_APPLICABLE']);
const risk = z.object({
  riskId: z.string().trim().min(1).max(64),
  severity: z.enum(['LOW', 'MEDIUM', 'MODERATE', 'HIGH', 'VERY_HIGH', 'CRITICAL']),
  status: z.enum(['OPEN', 'MITIGATED', 'ACCEPTED', 'CLOSED', 'BLOCKED']),
  acceptance: z
    .object({
      acceptedBy: z.string().trim().min(1).max(128),
      authority: z.enum(['MANAGER', 'SYSTEM_OWNER']),
      evidenceRef: z.string().trim().min(1).max(256),
      acceptedAt: z.string().trim().min(1).max(64),
    })
    .optional(),
});

const approveRelease = defineAction({
  accept: 'json',
  input: z.object({
    releaseId: z.string().uuid(),
    expectedVersion: z.coerce.bigint(),
    gitSha: z.string().trim().min(40).max(40),
    buildId: z.string().trim().min(1).max(128),
    applicationVersion: z.string().trim().min(1).max(128),
    migrationHead: z.string().trim().min(1).max(128),
    uatCycleId: z.string().trim().min(1).max(128),
    uatStatus: z.string().trim().min(1).max(64),
    residualRiskStatus: z.string().trim().min(1).max(64),
    gates: z.object({
      ci: gate,
      security: gate,
      database: gate,
      e2e: gate,
      uat: gate,
      signatures: gate,
      criticalRisks: gate,
      residualRisk: gate,
    }),
    risks: z.array(risk).max(200),
    reauthenticationSecret: z.string().min(1),
  }),
  handler: (input, context) =>
    run(() =>
      releaseGovernanceActionDependencies().approve.execute({
        ...input,
        actor: actor(context),
        requestId: requestId(context),
      }),
    ),
});

export const releaseGovernance = { approveRelease };
