import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { AppError } from '../shared/errors/app-error.js';
import { quarantineActionDependencies } from '../modules/quarantine/application/dependencies.js';

const requestId = (context: { locals: App.Locals }) => context.locals.requestContext?.requestId ?? 'unknown';
const requireActor = (context: { locals: App.Locals }) => {
  if (!context.locals.actor) throw new AppError('AUTH_REQUIRED', { userSafe: true });
  return context.locals.actor;
};
const run = async <T>(work: () => Promise<T>, context: { locals: App.Locals }) => {
  try {
    return await work();
  } catch (error) {
    const appError = error instanceof AppError ? error : new AppError('SYSTEM_INTERNAL', { userSafe: false, cause: error });
    throw new ActionError({
      code: appError.category === 'AUTHENTICATION' ? 'UNAUTHORIZED' : appError.category === 'AUTHORIZATION' ? 'FORBIDDEN' : 'BAD_REQUEST',
      message: appError.userSafe ? appError.message : 'Unable to complete the controlled action.',
    });
  }
};

const receivingInput = z.object({
  receivingNo: z.string().trim().min(1),
  docNo: z.string().trim().min(1),
  itemCode: z.string().trim().min(1),
  description: z.string().trim().min(1),
  lot: z.string().trim().min(1),
  qty: z.coerce.string().min(1),
  receivingDate: z.coerce.date(),
  expiryDate: z.coerce.date().optional(),
});
const idVersion = z.object({ id: z.string().uuid(), expectedVersion: z.coerce.bigint() });
const transitionInput = idVersion.extend({ action: z.enum(['MARK_READY', 'START_INSPECTION', 'COMPLETE_INSPECTION', 'MOVE_TO_RELEASE_PENDING', 'MARK_EXPIRED', 'CANCEL']) });

const createReceiving = defineAction({ accept: 'json', input: receivingInput, handler: (input, context) => run(() => quarantineActionDependencies().receiving.create.execute({ ...input, actor: requireActor(context), requestId: requestId(context) }), context) });
const updateReceivingDraft = defineAction({ accept: 'json', input: idVersion.merge(receivingInput), handler: (input, context) => run(() => quarantineActionDependencies().receiving.updateDraft.execute({ ...input, actor: requireActor(context), requestId: requestId(context) }), context) });
const transitionReceiving = defineAction({ accept: 'json', input: transitionInput, handler: (input, context) => run(() => quarantineActionDependencies().receiving.transition.execute({ ...input, actor: requireActor(context), requestId: requestId(context) }), context) });
const holdReceiving = defineAction({ accept: 'json', input: idVersion.extend({ reason: z.string().trim().min(1) }), handler: (input, context) => run(() => quarantineActionDependencies().receiving.hold.execute({ ...input, actor: requireActor(context), requestId: requestId(context) }), context) });
const releaseReceiving = defineAction({ accept: 'json', input: idVersion, handler: (input, context) => run(() => quarantineActionDependencies().receiving.release.execute({ ...input, actor: requireActor(context), requestId: requestId(context) }), context) });

const inspectionVersion = idVersion;
const saveInspectionDraft = defineAction({ accept: 'json', input: inspectionVersion.extend({ results: z.array(z.object({ id: z.string().uuid(), pointId: z.string().uuid(), value: z.union([z.string(), z.number(), z.boolean()]), unit: z.string().optional(), result: z.string().optional(), remarks: z.string().optional(), version: z.coerce.bigint() })) }), handler: (input, context) => run(() => quarantineActionDependencies().inspection.saveDraft.execute({ ...input, actor: requireActor(context), requestId: requestId(context) }), context) });
const submitInspection = defineAction({ accept: 'json', input: inspectionVersion, handler: (input, context) => run(() => quarantineActionDependencies().inspection.submit.execute({ ...input, actor: requireActor(context), requestId: requestId(context) }), context) });
const reviewInspection = defineAction({ accept: 'json', input: inspectionVersion, handler: (input, context) => run(() => quarantineActionDependencies().inspection.review.execute({ ...input, actor: requireActor(context), requestId: requestId(context) }), context) });
const approveInspection = defineAction({ accept: 'json', input: inspectionVersion, handler: (input, context) => run(() => quarantineActionDependencies().inspection.approve.execute({ ...input, actor: requireActor(context), requestId: requestId(context) }), context) });
const returnInspection = defineAction({ accept: 'json', input: inspectionVersion.extend({ reason: z.string().trim().min(1) }), handler: (input, context) => run(() => quarantineActionDependencies().inspection.return.execute({ ...input, actor: requireActor(context), requestId: requestId(context) }), context) });
const resumeInspection = defineAction({ accept: 'json', input: inspectionVersion, handler: (input, context) => run(() => quarantineActionDependencies().inspection.resume.execute({ ...input, actor: requireActor(context), requestId: requestId(context) }), context) });

export const quarantine = { createReceiving, updateReceivingDraft, transitionReceiving, holdReceiving, releaseReceiving, saveInspectionDraft, submitInspection, reviewInspection, approveInspection, returnInspection, resumeInspection };
