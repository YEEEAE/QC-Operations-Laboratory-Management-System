import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { AppError } from '../shared/errors/app-error.js';
import { laboratoryActionDependencies } from '../modules/laboratory/application/dependencies.js';
const actor = (context: { locals: App.Locals }) => {
  if (!context.locals.actor) throw new AppError('AUTH_REQUIRED', { userSafe: true });
  return context.locals.actor;
};
const requestId = (context: { locals: App.Locals }) =>
  context.locals.requestContext?.requestId ?? 'unknown';
const id = z.object({ id: z.string().uuid(), expectedVersion: z.coerce.bigint() });
async function run<T>(work: () => Promise<T>) {
  try {
    return await work();
  } catch (error) {
    throw new ActionError({
      code:
        error instanceof AppError && error.category === 'AUTHORIZATION'
          ? 'FORBIDDEN'
          : 'BAD_REQUEST',
      message: 'Unable to complete the controlled laboratory action.',
    });
  }
}
const create = defineAction({
  accept: 'json',
  input: z.object({ templateVersionId: z.string().uuid(), labTestNo: z.string().trim().min(1) }),
  handler: (input, context) =>
    run(() =>
      laboratoryActionDependencies().create.execute({
        ...input,
        actor: actor(context),
        requestId: requestId(context),
      }),
    ),
});
const saveMeasurements = defineAction({
  accept: 'json',
  input: id.extend({
    samples: z
      .array(z.object({ id: z.string().uuid(), identifier: z.string().trim().min(1) }))
      .min(1),
    measurements: z.array(
      z.object({
        sampleId: z.string().uuid(),
        parameterId: z.string().uuid(),
        raw: z.union([z.string(), z.boolean()]),
        unit: z.string().nullable(),
        remarks: z.string().optional(),
      }),
    ),
  }),
  handler: (input, context) =>
    run(() =>
      laboratoryActionDependencies().saveMeasurements.execute({
        ...input,
        actor: actor(context),
        requestId: requestId(context),
      }),
    ),
});
/**
 * QC-DATA-003: record one Test Batch / Run — its samples, every replicated
 * reading, the approved calculations over them and the derived sample results.
 * The browser never sends a calculated value, an acceptance outcome or a sample
 * result; the server derives all three from the approved template context.
 */
const recordRun = defineAction({
  accept: 'json',
  input: id.extend({
    run: z.object({
      batchId: z.string().uuid().optional(),
      batchNo: z.string().trim().min(1),
      label: z.string().trim().min(1).nullable().optional(),
      startedAt: z.string().datetime().optional(),
      completedAt: z.string().datetime().nullable().optional(),
    }),
    samples: z.array(z.object({ identifier: z.string().trim().min(1) })).min(1),
    readings: z.array(
      z.object({
        sampleIdentifier: z.string().trim().min(1),
        parameterId: z.string().uuid(),
        readingIndex: z.number().int().min(1),
        raw: z.union([z.string(), z.boolean()]),
        unit: z.string().nullable(),
        remarks: z.string().optional(),
      }),
    ),
  }),
  handler: (input, context) =>
    run(() =>
      laboratoryActionDependencies().recordRun.execute({
        ...input,
        actor: actor(context),
        requestId: requestId(context),
      }),
    ),
});
/**
 * QC-DATA-003: record which instrument and calibration produced a run's
 * readings. Eligibility is verified server-side by the approved Assets policy;
 * the snapshots are captured at usage time and never rebuilt later.
 */
const recordRunEquipment = defineAction({
  accept: 'json',
  input: id.extend({
    batchId: z.string().uuid(),
    usage: z.object({
      equipmentId: z.string().uuid(),
      calibrationRecordId: z.string().uuid(),
      usageRole: z.string().trim().min(1).optional(),
    }),
  }),
  handler: (input, context) =>
    run(() =>
      laboratoryActionDependencies().recordRunEquipment.execute({
        ...input,
        actor: actor(context),
        requestId: requestId(context),
      }),
    ),
});
const submit = defineAction({
  accept: 'json',
  input: id,
  handler: (input, context) =>
    run(() =>
      laboratoryActionDependencies().submit.execute({
        ...input,
        actor: actor(context),
        requestId: requestId(context),
      }),
    ),
});
const review = defineAction({
  accept: 'json',
  input: id,
  handler: (input, context) =>
    run(() =>
      laboratoryActionDependencies().review.execute({
        ...input,
        actor: actor(context),
        requestId: requestId(context),
      }),
    ),
});
const returnTest = defineAction({
  accept: 'json',
  input: id.extend({ reason: z.string().trim().min(1) }),
  handler: (input, context) =>
    run(() =>
      laboratoryActionDependencies().return.execute({
        ...input,
        actor: actor(context),
        requestId: requestId(context),
      }),
    ),
});
const resume = defineAction({
  accept: 'json',
  input: id,
  handler: (input, context) =>
    run(() =>
      laboratoryActionDependencies().resume.execute({
        ...input,
        actor: actor(context),
        requestId: requestId(context),
      }),
    ),
});
const approve = defineAction({
  accept: 'json',
  input: id,
  handler: (input, context) =>
    run(() =>
      laboratoryActionDependencies().approve.execute({
        ...input,
        actor: actor(context),
        requestId: requestId(context),
      }),
    ),
});
/**
 * QC-100-FINAL-004: the final (QCM) lab approval is a controlled signature
 * event and requires the reauthentication secret.
 */
const finalApprove = defineAction({
  accept: 'json',
  input: id.extend({ reauthenticationSecret: z.string().min(1) }),
  handler: (input, context) =>
    run(() =>
      laboratoryActionDependencies().finalApprove.execute({
        ...input,
        actor: actor(context),
        requestId: requestId(context),
      }),
    ),
});
const reopen = defineAction({
  accept: 'json',
  input: id.extend({ reason: z.string().trim().min(1) }),
  handler: (input, context) =>
    run(() =>
      laboratoryActionDependencies().reopen.execute({
        ...input,
        actor: actor(context),
        requestId: requestId(context),
      }),
    ),
});
const reject = defineAction({
  accept: 'json',
  input: id.extend({ reason: z.string().trim().min(1) }),
  handler: (input, context) =>
    run(() =>
      laboratoryActionDependencies().reject.execute({
        ...input,
        actor: actor(context),
        requestId: requestId(context),
      }),
    ),
});
const createRetest = defineAction({
  accept: 'json',
  input: z.object({ originalId: z.string().uuid(), reason: z.string().trim().min(1) }),
  handler: (input, context) =>
    run(() =>
      laboratoryActionDependencies().retest.execute({
        ...input,
        actor: actor(context),
        requestId: requestId(context),
      }),
    ),
});
export const laboratory = {
  create,
  saveMeasurements,
  recordRun,
  recordRunEquipment,
  submit,
  review,
  returnTest,
  resume,
  approve,
  finalApprove,
  reopen,
  reject,
  createRetest,
};
