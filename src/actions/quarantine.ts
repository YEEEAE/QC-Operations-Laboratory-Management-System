import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { AppError } from '../shared/errors/app-error.js';
import { quarantineActionDependencies } from '../modules/quarantine/application/dependencies.js';
import { RECEIVING_QUANTITY_UNITS } from '../modules/quarantine/receiving/application/presentation.js';

const requestId = (context: { locals: App.Locals }) =>
  context.locals.requestContext?.requestId ?? 'unknown';
const requireActor = (context: { locals: App.Locals }) => {
  if (!context.locals.actor) throw new AppError('AUTH_REQUIRED', { userSafe: true });
  return context.locals.actor;
};
const run = async <T>(work: () => Promise<T>) => {
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
      message: appError.userSafe ? appError.message : 'Unable to complete the controlled action.',
    });
  }
};

const receivingInput = z.object({
  receivingNo: z.string().trim().min(1),
  supplier: z.string().trim().min(1),
  docNo: z.string().trim().min(1),
  itemCode: z.string().trim().min(1),
  description: z.string().trim().min(1),
  lot: z.string().trim().min(1),
  // Quantity and unit are two facts; the unit must come from the controlled
  // vocabulary and the quantity is validated as a positive decimal server-side.
  qty: z.coerce.string().min(1),
  quantityUnit: z.enum(RECEIVING_QUANTITY_UNITS),
  purchaseOrderNo: z.string().trim().max(120).optional(),
  receivingDate: z.coerce.date(),
  expiryDate: z.coerce.date().optional(),
});
const idVersion = z.object({ id: z.string().uuid(), expectedVersion: z.coerce.bigint() });
const transitionInput = idVersion.extend({
  action: z.enum([
    'MARK_READY',
    'START_INSPECTION',
    'COMPLETE_INSPECTION',
    'MOVE_TO_RELEASE_PENDING',
    'MARK_EXPIRED',
    'CANCEL',
  ]),
});
const correctionInput = idVersion.merge(receivingInput).extend({
  reason: z.string().trim().min(1),
});
const createInspectionFromReceiving = defineAction({
  accept: 'json',
  input: z.object({
    receivingId: z.string().uuid(),
    templateVersionId: z.string().uuid(),
    inspectionNo: z.string().trim().min(1).max(80),
    assignedTo: z.string().uuid().optional(),
  }),
  handler: (input, context) =>
    run(() =>
      quarantineActionDependencies().receiving.createInspection.execute({
        ...input,
        actor: requireActor(context),
        requestId: requestId(context),
      }),
    ),
});
const correctReceiving = defineAction({
  accept: 'json',
  input: correctionInput,
  handler: (input, context) =>
    run(() =>
      quarantineActionDependencies().receiving.correct.execute({
        ...input,
        actor: requireActor(context),
        requestId: requestId(context),
      }),
    ),
});

const createReceiving = defineAction({
  accept: 'json',
  input: receivingInput,
  handler: (input, context) =>
    run(() =>
      quarantineActionDependencies().receiving.create.execute({
        ...input,
        actor: requireActor(context),
        requestId: requestId(context),
      }),
    ),
});
const updateReceivingDraft = defineAction({
  accept: 'json',
  input: idVersion.merge(receivingInput),
  handler: (input, context) =>
    run(() =>
      quarantineActionDependencies().receiving.updateDraft.execute({
        ...input,
        actor: requireActor(context),
        requestId: requestId(context),
      }),
    ),
});
const transitionReceiving = defineAction({
  accept: 'json',
  input: transitionInput,
  handler: (input, context) =>
    run(() =>
      quarantineActionDependencies().receiving.transition.execute({
        ...input,
        actor: requireActor(context),
        requestId: requestId(context),
      }),
    ),
});
const holdReceiving = defineAction({
  accept: 'json',
  input: idVersion.extend({ reason: z.string().trim().min(1) }),
  handler: (input, context) =>
    run(() =>
      quarantineActionDependencies().receiving.hold.execute({
        ...input,
        actor: requireActor(context),
        requestId: requestId(context),
      }),
    ),
});
const releaseReceiving = defineAction({
  accept: 'json',
  input: idVersion,
  handler: (input, context) =>
    run(() =>
      quarantineActionDependencies().receiving.release.execute({
        ...input,
        actor: requireActor(context),
        requestId: requestId(context),
      }),
    ),
});

const inspectionVersion = idVersion;
const saveInspectionDraft = defineAction({
  accept: 'json',
  input: inspectionVersion.extend({
    results: z.array(
      z.object({
        id: z.string().uuid(),
        pointId: z.string().uuid(),
        value: z.union([z.string(), z.number(), z.boolean()]),
        unit: z.string().optional(),
        result: z.string().optional(),
        remarks: z.string().optional(),
        version: z.coerce.bigint(),
      }),
    ),
  }),
  handler: (input, context) =>
    run(() =>
      quarantineActionDependencies().inspection.saveDraft.execute({
        ...input,
        actor: requireActor(context),
        requestId: requestId(context),
      }),
    ),
});
const submitInspection = defineAction({
  accept: 'json',
  input: inspectionVersion,
  handler: (input, context) =>
    run(() =>
      quarantineActionDependencies().inspection.submit.execute({
        ...input,
        actor: requireActor(context),
        requestId: requestId(context),
      }),
    ),
});
// QC-DATA-002: record observed point values. PASS/FAIL is computed
// server-side from the approved acceptance rules; the client can only ever
// declare REMARK/NA (enforced again inside the use case).
const recordInspectionResults = defineAction({
  accept: 'json',
  input: inspectionVersion.extend({
    results: z.array(
      z.object({
        id: z.string().uuid(),
        pointId: z.string().uuid(),
        value: z.union([z.string(), z.number(), z.boolean()]),
        unit: z.string().optional(),
        result: z.enum(['REMARK', 'NA']).optional(),
        remarks: z.string().optional(),
        version: z.coerce.bigint(),
      }),
    ),
  }),
  handler: (input, context) =>
    run(() =>
      quarantineActionDependencies().inspection.recordResults.execute({
        ...input,
        actor: requireActor(context),
        requestId: requestId(context),
      }),
    ),
});
// QC-DATA-002 §8: structured AQL / sampling facts (never free text).
const recordInspectionAql = defineAction({
  accept: 'json',
  input: inspectionVersion.extend({
    aql: z.object({
      aql: z.string().trim().min(1).max(40),
      codeLetter: z.string().trim().max(20).optional(),
      inspectionLevel: z.string().trim().max(40).optional(),
      sampleSize: z.string().trim().min(1).max(40),
      acceptNumber: z.string().trim().min(1).max(40),
      rejectNumber: z.string().trim().min(1).max(40),
      observedDefects: z.string().trim().max(40).optional(),
      samplingResult: z.enum(['ACCEPT', 'REJECT', 'NOT_APPLICABLE']),
      sourceReference: z.string().trim().min(1).max(200),
    }),
  }),
  handler: (input, context) =>
    run(() =>
      quarantineActionDependencies().inspection.recordAql.execute({
        ...input,
        actor: requireActor(context),
        requestId: requestId(context),
      }),
    ),
});
// QC-DATA-002 §10/§11: link calibrated equipment with its calibration
// snapshot; eligibility is re-verified server-side through the assets policy.
const linkInspectionEquipment = defineAction({
  accept: 'json',
  input: inspectionVersion.extend({
    usage: z.object({
      equipmentId: z.string().uuid(),
      calibrationRecordId: z.string().uuid(),
      usedAt: z.string().min(4).max(64),
      equipmentSnapshot: z.record(z.unknown()),
      calibrationSnapshot: z.record(z.unknown()),
      usageRole: z.string().trim().max(80).optional(),
    }),
  }),
  handler: (input, context) =>
    run(() =>
      quarantineActionDependencies().inspection.linkEquipment.execute({
        ...input,
        actor: requireActor(context),
        requestId: requestId(context),
      }),
    ),
});
const reviewInspection = defineAction({
  accept: 'json',
  input: inspectionVersion,
  handler: (input, context) =>
    run(() =>
      quarantineActionDependencies().inspection.review.execute({
        ...input,
        actor: requireActor(context),
        requestId: requestId(context),
      }),
    ),
});
const approveInspection = defineAction({
  accept: 'json',
  input: inspectionVersion,
  handler: (input, context) =>
    run(() =>
      quarantineActionDependencies().inspection.approve.execute({
        ...input,
        actor: requireActor(context),
        requestId: requestId(context),
      }),
    ),
});
/**
 * QC-100-FINAL-004: the final (QCM) approval is a controlled signature event,
 * so the action requires the reauthentication secret. Without it the ceremony
 * fails closed with AUTH_REAUTH_REQUIRED, and the record can never reach
 * APPROVED.
 */
const finalApproveInspection = defineAction({
  accept: 'json',
  input: inspectionVersion.extend({ reauthenticationSecret: z.string().min(1) }),
  handler: (input, context) =>
    run(() =>
      quarantineActionDependencies().inspection.finalApprove.execute({
        ...input,
        actor: requireActor(context),
        requestId: requestId(context),
      }),
    ),
});
const reopenInspection = defineAction({
  accept: 'json',
  input: inspectionVersion.extend({ reason: z.string().trim().min(1) }),
  handler: (input, context) =>
    run(() =>
      quarantineActionDependencies().inspection.reopen.execute({
        ...input,
        actor: requireActor(context),
        requestId: requestId(context),
      }),
    ),
});
const returnInspection = defineAction({
  accept: 'json',
  input: inspectionVersion.extend({ reason: z.string().trim().min(1) }),
  handler: (input, context) =>
    run(() =>
      quarantineActionDependencies().inspection.return.execute({
        ...input,
        actor: requireActor(context),
        requestId: requestId(context),
      }),
    ),
});
const rejectInspection = defineAction({
  accept: 'json',
  input: inspectionVersion.extend({ reason: z.string().trim().min(1) }),
  handler: (input, context) =>
    run(() =>
      quarantineActionDependencies().inspection.reject.execute({
        ...input,
        actor: requireActor(context),
        requestId: requestId(context),
      }),
    ),
});
const resumeInspection = defineAction({
  accept: 'json',
  input: inspectionVersion,
  handler: (input, context) =>
    run(() =>
      quarantineActionDependencies().inspection.resume.execute({
        ...input,
        actor: requireActor(context),
        requestId: requestId(context),
      }),
    ),
});

export const quarantine = {
  createReceiving,
  updateReceivingDraft,
  transitionReceiving,
  holdReceiving,
  releaseReceiving,
  correctReceiving,
  createInspectionFromReceiving,
  saveInspectionDraft,
  submitInspection,
  recordInspectionResults,
  recordInspectionAql,
  linkInspectionEquipment,
  reviewInspection,
  approveInspection,
  finalApproveInspection,
  reopenInspection,
  returnInspection,
  rejectInspection,
  resumeInspection,
};
