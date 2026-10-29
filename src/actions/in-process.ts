import { defineAction, ActionError, ActionInputError } from 'astro:actions';
import { z } from 'astro:schema';
import { toActionError } from '../shared/errors/action-error.js';
import { AppError } from '../shared/errors/app-error.js';
import { getDatabase } from '../shared/database/database.js';
import { PostgresIdempotencyRepository } from '../shared/idempotency/postgres-idempotency-repository.js';
import { executeIdempotently } from '../shared/idempotency/idempotency-service.js';
import { inProcessActionDependencies } from '../modules/in-process/application/dependencies.js';

type ActionContext = { locals: App.Locals };
const repository = () => inProcessActionDependencies();
const actor = (context: ActionContext) => {
  if (!context.locals.actor) throw new AppError('AUTH_REQUIRED', { userSafe: true });
  return context.locals.actor;
};
const requestId = (context: ActionContext) =>
  context.locals.requestContext?.requestId ?? 'in-process-unknown-request';

const run = async <T>(work: () => Promise<T>, context: ActionContext): Promise<T> => {
  try {
    return await work();
  } catch (error) {
    const mapped = toActionError(error, requestId(context));
    if (mapped.error.fieldErrors) {
      const issues: z.ZodIssue[] = Object.entries(mapped.error.fieldErrors).flatMap(
        ([fieldName, messages]) =>
          messages.map((message) => ({
            code: 'custom' as const,
            message,
            path: fieldName.split('.'),
          })),
      );
      throw new ActionInputError(issues);
    }
    if (mapped.error.code === 'AUTHZ_DENIED')
      throw new ActionError({ code: 'FORBIDDEN', message: mapped.error.messageKey });
    if (
      mapped.error.code === 'AUTHZ_SCOPE_DENIED' ||
      mapped.error.code === 'AUTHZ_SOD_VIOLATION' ||
      mapped.error.code === 'AUTHZ_PERMISSION_MISSING'
    )
      throw new ActionError({ code: 'FORBIDDEN', message: mapped.error.messageKey });
    if (mapped.error.code === 'AUTH_REQUIRED')
      throw new ActionError({ code: 'UNAUTHORIZED', message: mapped.error.messageKey });
    if (mapped.error.code === 'RESOURCE_NOT_FOUND')
      throw new ActionError({ code: 'NOT_FOUND', message: mapped.error.messageKey });
    if (mapped.error.code.startsWith('CONFLICT_'))
      throw new ActionError({ code: 'CONFLICT', message: mapped.error.messageKey });
    throw new ActionError({ code: 'BAD_REQUEST', message: mapped.error.messageKey });
  }
};

/**
 * Replay protection for controlled in-process writes. The browser sends one
 * durable command key per form render; an identical replay returns the stored
 * result and a different command with the same key is refused.
 */
const once = async <T extends Record<string, unknown>>(
  commandKey: string,
  command: unknown,
  work: () => Promise<T>,
): Promise<T> =>
  executeIdempotently(
    new PostgresIdempotencyRepository(getDatabase()),
    commandKey,
    command,
    work,
  );

const commandKey = (scope: string, value: string) => `in-process:${scope}:${value}`;
const uuid = z.string().uuid();
const expectedVersion = z.coerce.bigint();

const startRun = defineAction({
  accept: 'json',
  input: z.object({
    requestId: uuid,
    itemCode: z.string().min(1).max(100),
    itemName: z.string().min(1).max(500),
    lotNo: z.string().min(1).max(100),
    workOrderNo: z.string().max(100).optional(),
    batchNo: z.string().max(100).optional(),
    productionLine: z.string().min(1).max(200),
    station: z.string().max(200).optional(),
    machine: z.string().max(200).optional(),
    shiftCode: z.string().min(1).max(50),
    wiDocumentVersionId: uuid,
    formDocumentVersionId: uuid.optional(),
  }),
  handler: (input, context) =>
    run(
      () =>
        once(commandKey('start-run', input.requestId), input, async () => {
          const created = await repository().startRun.execute({
            ...input,
            actor: actor(context),
            requestId: commandKey('start-run', input.requestId),
          });
          return { runId: created.id, runNo: created.runNo };
        }),
      context,
    ),
});

const transcribeCheckpoint = defineAction({
  accept: 'json',
  input: z.object({
    requestId: uuid,
    runId: uuid,
    expectedVersion,
    stepReference: z.string().min(1).max(200),
    parameterName: z.string().min(1).max(200),
    unit: z.string().max(50).optional(),
    frequencyText: z.string().min(1).max(500),
    samplingText: z.string().max(500).optional(),
    acceptanceCriteriaText: z.string().min(1).max(2000),
    lowerLimitText: z.string().max(50).optional(),
    upperLimitText: z.string().max(50).optional(),
  }),
  handler: (input, context) =>
    run(
      () =>
        once(commandKey('transcribe-checkpoint', input.requestId), input, async () => {
          const checkpoint = await repository().transcribeCheckpoint.execute({
            ...input,
            actor: actor(context),
            requestId: commandKey('transcribe-checkpoint', input.requestId),
          });
          return { checkpointId: checkpoint.id };
        }),
      context,
    ),
});

const verifyCheckpoint = defineAction({
  accept: 'json',
  input: z.object({
    requestId: uuid,
    runId: uuid,
    expectedVersion,
    checkpointId: uuid,
    checkpointVersion: expectedVersion,
  }),
  handler: (input, context) =>
    run(
      () =>
        once(commandKey('verify-checkpoint', input.requestId), input, async () => {
          const checkpoint = await repository().verifyCheckpoint.execute({
            ...input,
            actor: actor(context),
            requestId: commandKey('verify-checkpoint', input.requestId),
          });
          return { checkpointId: checkpoint.id, verificationState: checkpoint.verificationState };
        }),
      context,
    ),
});

const recordReading = defineAction({
  accept: 'json',
  input: z.object({
    requestId: uuid,
    runId: uuid,
    expectedVersion,
    checkpointId: uuid,
    entryState: z.enum(['DRAFT', 'RECORDED']),
    valueText: z.string().min(1).max(200),
    unit: z.string().max(50).optional(),
    observedAt: z.coerce.date(),
    sampleReference: z.string().max(100).optional(),
  }),
  handler: (input, context) =>
    run(
      () =>
        once(commandKey('record-reading', input.requestId), input, async () => {
          const reading = await repository().recordReading.execute({
            ...input,
            actor: actor(context),
            requestId: commandKey('record-reading', input.requestId),
          });
          return { readingId: reading.id, comparisonState: reading.comparisonState };
        }),
      context,
    ),
});

const flagDeviation = defineAction({
  accept: 'json',
  input: z.object({
    requestId: uuid,
    runId: uuid,
    expectedVersion,
    category: z.enum(['PROCESS_PARAMETER', 'MATERIAL', 'EQUIPMENT', 'DOCUMENT', 'OTHER']),
    description: z.string().min(1).max(4000),
    containmentState: z.enum(['DEFINED', 'NOT_YET_DEFINED']),
    immediateContainment: z.string().max(4000).optional(),
    checkpointId: uuid.optional(),
    readingId: uuid.optional(),
  }),
  handler: (input, context) =>
    run(
      () =>
        once(commandKey('flag-deviation', input.requestId), input, async () => {
          const deviation = await repository().flagDeviation.execute({
            ...input,
            actor: actor(context),
            requestId: commandKey('flag-deviation', input.requestId),
          });
          return { deviationId: deviation.id, deviationNo: deviation.deviationNo };
        }),
      context,
    ),
});

const disposeDeviation = defineAction({
  accept: 'json',
  input: z.object({
    requestId: uuid,
    runId: uuid,
    expectedVersion,
    deviationId: uuid,
    severity: z.enum(['MINOR', 'MAJOR', 'CRITICAL']),
    status: z.enum(['ACCEPTED_FOR_CONTINUATION', 'ESCALATED', 'CLOSED']),
    dispositionNote: z.string().min(1).max(4000),
  }),
  handler: (input, context) =>
    run(
      () =>
        once(commandKey('dispose-deviation', input.requestId), input, async () => {
          const deviation = await repository().disposeDeviation.execute({
            ...input,
            actor: actor(context),
            requestId: commandKey('dispose-deviation', input.requestId),
          });
          return { deviationId: deviation.id, status: deviation.status };
        }),
      context,
    ),
});

const requestHold = defineAction({
  accept: 'json',
  input: z.object({
    requestId: uuid,
    runId: uuid,
    expectedVersion,
    reason: z.string().min(1).max(2000),
    deviationId: uuid.optional(),
  }),
  handler: (input, context) =>
    run(
      () =>
        once(commandKey('request-hold', input.requestId), input, async () => {
          const hold = await repository().requestHold.execute({
            ...input,
            actor: actor(context),
            requestId: commandKey('request-hold', input.requestId),
          });
          return { holdRequestId: hold.id, status: hold.status };
        }),
      context,
    ),
});

const decideHold = defineAction({
  accept: 'json',
  input: z.object({
    requestId: uuid,
    runId: uuid,
    expectedVersion,
    holdRequestId: uuid,
    decision: z.enum(['ACKNOWLEDGED', 'DECLINED']),
    decisionNote: z.string().min(1).max(2000),
  }),
  handler: (input, context) =>
    run(
      () =>
        once(commandKey('decide-hold', input.requestId), input, async () => {
          const hold = await repository().decideHold.execute({
            ...input,
            actor: actor(context),
            requestId: commandKey('decide-hold', input.requestId),
          });
          return { holdRequestId: hold.id, status: hold.status };
        }),
      context,
    ),
});

const recordHandover = defineAction({
  accept: 'json',
  input: z.object({
    requestId: uuid,
    runId: uuid,
    expectedVersion,
    toShiftCode: z.string().min(1).max(50),
    handoverNote: z.string().min(1).max(2000),
  }),
  handler: (input, context) =>
    run(
      () =>
        once(commandKey('record-handover', input.requestId), input, async () => {
          const handover = await repository().recordHandover.execute({
            ...input,
            actor: actor(context),
            requestId: commandKey('record-handover', input.requestId),
          });
          return { handoverId: handover.id };
        }),
      context,
    ),
});

const acceptHandover = defineAction({
  accept: 'json',
  input: z.object({
    requestId: uuid,
    runId: uuid,
    expectedVersion,
    handoverId: uuid,
  }),
  handler: (input, context) =>
    run(
      () =>
        once(commandKey('accept-handover', input.requestId), input, async () => {
          const handover = await repository().acceptHandover.execute({
            ...input,
            actor: actor(context),
            requestId: commandKey('accept-handover', input.requestId),
          });
          return { handoverId: handover.id, status: handover.status };
        }),
      context,
    ),
});

const submitRun = defineAction({
  accept: 'json',
  input: z.object({ requestId: uuid, runId: uuid, expectedVersion }),
  handler: (input, context) =>
    run(
      () =>
        once(commandKey('submit-run', input.requestId), input, async () => {
          const submitted = await repository().submitRun.execute({
            ...input,
            actor: actor(context),
            requestId: commandKey('submit-run', input.requestId),
          });
          return { runId: submitted.id, state: submitted.state };
        }),
      context,
    ),
});

const reviewRun = defineAction({
  accept: 'json',
  input: z.object({
    requestId: uuid,
    runId: uuid,
    expectedVersion,
    action: z.enum(['RETURN', 'QC_REVIEW']),
    reason: z.string().max(2000).optional(),
  }),
  handler: (input, context) =>
    run(
      () =>
        once(commandKey('review-run', input.requestId), input, async () => {
          const reviewed = await repository().reviewRun.execute({
            ...input,
            actor: actor(context),
            requestId: commandKey('review-run', input.requestId),
          });
          return { runId: reviewed.id, state: reviewed.state };
        }),
      context,
    ),
});

const closeRun = defineAction({
  accept: 'json',
  input: z.object({
    requestId: uuid,
    runId: uuid,
    expectedVersion,
    disposition: z.enum(['ACCEPTED_FOR_CONTINUATION', 'QC_HOLD_REQUESTED', 'ESCALATED']),
    dispositionNote: z.string().min(1).max(4000),
  }),
  handler: (input, context) =>
    run(
      () =>
        once(commandKey('close-run', input.requestId), input, async () => {
          const closed = await repository().closeRun.execute({
            ...input,
            actor: actor(context),
            requestId: commandKey('close-run', input.requestId),
          });
          return { runId: closed.id, state: closed.state, disposition: closed.disposition };
        }),
      context,
    ),
});

export const inProcess = {
  startRun,
  transcribeCheckpoint,
  verifyCheckpoint,
  recordReading,
  flagDeviation,
  disposeDeviation,
  requestHold,
  decideHold,
  recordHandover,
  acceptHandover,
  submitRun,
  reviewRun,
  closeRun,
};
