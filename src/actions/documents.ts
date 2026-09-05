import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import { documentsActionDependencies } from '../modules/documents/application/dependencies.js';
import { toActionError } from '../shared/errors/action-error.js';
import { AppError } from '../shared/errors/app-error.js';

type ActionContext = { locals: App.Locals };
const actor = (context: ActionContext) => { if (!context.locals.actor) throw new AppError('AUTH_REQUIRED', { userSafe: true }); return context.locals.actor; };
const requestId = (context: ActionContext) => context.locals.requestContext?.requestId ?? 'unknown';
const run = async <T>(work: () => Promise<T>, context: ActionContext): Promise<T> => { try { return await work(); } catch (error) { const mapped = toActionError(error, requestId(context)); throw new ActionError({ code: 'BAD_REQUEST', message: mapped.error.messageKey }); } };
const id = z.string().uuid();
const version = z.coerce.bigint();

const create = defineAction({ accept: 'json', input: z.object({ documentNo: z.string().trim().min(1), documentType: z.string().trim().min(1), title: z.string().trim().min(1), ownerId: id.optional() }), handler: (input, context) => run(() => documentsActionDependencies().create.execute({ ...input, actor: actor(context), requestId: requestId(context) }), context) });
const createVersion = defineAction({ accept: 'json', input: z.object({ documentId: id, revision: z.string().trim().min(1), changeSummary: z.string().optional(), contentHash: z.string().optional(), files: z.array(z.object({ fileId: id, fileRole: z.string().trim().min(1) })).max(20).optional() }), handler: (input, context) => run(() => documentsActionDependencies().createVersion.execute({ ...input, actor: actor(context), requestId: requestId(context) }), context) });
const updateDraft = defineAction({ accept: 'json', input: z.object({ versionId: id, expectedVersion: version, revision: z.string().trim().min(1), changeSummary: z.string().optional(), contentHash: z.string().optional() }), handler: (input, context) => run(() => documentsActionDependencies().updateDraft.execute({ ...input, actor: actor(context), requestId: requestId(context) }), context) });
const submit = defineAction({ accept: 'json', input: z.object({ versionId: id, expectedVersion: version }), handler: (input, context) => run(() => documentsActionDependencies().submit.execute({ ...input, actor: actor(context), requestId: requestId(context) }), context) });
const review = defineAction({ accept: 'json', input: z.object({ versionId: id, expectedVersion: version }), handler: (input, context) => run(() => documentsActionDependencies().review.execute({ ...input, actor: actor(context), requestId: requestId(context) }), context) });
const approve = defineAction({ accept: 'json', input: z.object({ versionId: id, expectedVersion: version }), handler: (input, context) => run(() => documentsActionDependencies().approve.execute({ ...input, actor: actor(context), requestId: requestId(context) }), context) });
const supersede = defineAction({ accept: 'json', input: z.object({ currentVersionId: id, currentExpectedVersion: version, replacementVersionId: id, replacementExpectedVersion: version, effectiveAt: z.coerce.date() }), handler: (input, context) => run(() => documentsActionDependencies().supersede.execute({ ...input, actor: actor(context), requestId: requestId(context) }), context) });

export const documents = { create, createVersion, updateDraft, submit, review, approve, supersede };
