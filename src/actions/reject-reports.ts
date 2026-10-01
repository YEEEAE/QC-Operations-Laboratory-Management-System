import { defineAction, ActionError, ActionInputError } from 'astro:actions';
import { z } from 'astro:schema';
import { toActionError } from '../shared/errors/action-error.js';
import { AppError } from '../shared/errors/app-error.js';
import { rejectReportActionDependencies } from '../modules/reject-reports/application/dependencies.js';
const ISSUE_SLIP_APPROVAL_ROLES = ['SUPERVISOR', 'QC_MANAGER', 'FACTORY_DIRECTOR'] as const;

const repo = () => rejectReportActionDependencies();
type ActionContext = { locals: App.Locals };
const requestId = (context: ActionContext) => context.locals.requestContext?.requestId ?? 'unknown';
const actor = (context: ActionContext) => {
  if (!context.locals.actor) throw new AppError('AUTH_REQUIRED', { userSafe: true });
  return context.locals.actor;
};
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
    if (mapped.error.code === 'AUTH_REQUIRED')
      throw new ActionError({ code: 'UNAUTHORIZED', message: mapped.error.messageKey });
    if (mapped.error.code === 'RESOURCE_NOT_FOUND')
      throw new ActionError({ code: 'NOT_FOUND', message: mapped.error.messageKey });
    if (mapped.error.code.startsWith('CONFLICT_'))
      throw new ActionError({ code: 'CONFLICT', message: mapped.error.messageKey });
    throw new ActionError({ code: 'BAD_REQUEST', message: mapped.error.messageKey });
  }
};

const decimalString = z
  .string()
  .max(50)
  .regex(
    /^\d+(?:\.\d+)?$/,
    'Enter a non-negative decimal using digits and an optional decimal point.',
  );

const issueSlipFields = z.object({
  goodsDescription: z.string().max(2000).optional(),
  itemCode: z.string().max(100),
  itemName: z.string().max(500),
  lotNo: z.string().max(100).optional(),
  unit: z.string().max(50),
  rejectedQty: decimalString,
  unitCost: decimalString.optional(),
  totalValue: decimalString.optional(),
  rejectReason: z.string().max(2000),
  remarks: z.string().max(4000).optional(),
});

const dailyRejectEntry = z.object({
  machineName: z.string().max(200).optional(),
  itemCode: z.string().max(100).optional(),
  itemDescription: z.string().max(1000),
  lotNo: z.string().max(100).optional(),
  buRmProductName: z.string().max(500).optional(),
  rmDescription: z.string().max(1000).optional(),
  rmUnit: z.string().max(50).optional(),
  rmLotNo: z.string().max(100).optional(),
  rmType: z.string().max(100).optional(),
  pumpOutQty: decimalString.optional(),
  rejectQty: decimalString,
  goodQty: decimalString,
  rejectLimit: decimalString.optional(),
  productionFormula: z.string().max(500).optional(),
  rejectReason: z.string().max(2000),
  analysis: z.string().max(4000).optional(),
});

const createIssueSlip = defineAction({
  accept: 'json',
  input: z.object({
    reportDate: z.coerce.date(),
    department: z.string().max(200),
    shift: z.string().max(50).optional(),
    fields: issueSlipFields,
  }),
  handler: (input, context) =>
    run(
      () =>
        repo().createIssueSlip.execute({
          ...input,
          actor: actor(context),
          requestId: requestId(context),
        }),
      context,
    ),
});

const updateIssueSlipDraft = defineAction({
  accept: 'json',
  input: z.object({
    reportId: z.string().uuid(),
    expectedVersion: z.coerce.bigint(),
    reportDate: z.coerce.date(),
    department: z.string().max(200),
    shift: z.string().max(50).optional(),
    fields: issueSlipFields,
  }),
  handler: (input, context) =>
    run(
      () =>
        repo().updateIssueSlipDraft.execute({
          ...input,
          actor: actor(context),
          requestId: requestId(context),
        }),
      context,
    ),
});

const issueIssueSlip = defineAction({
  accept: 'json',
  input: z.object({
    reportId: z.string().uuid(),
    expectedVersion: z.coerce.bigint(),
  }),
  handler: (input, context) =>
    run(
      () =>
        repo().issueIssueSlip.execute({
          ...input,
          actor: actor(context),
          requestId: requestId(context),
        }),
      context,
    ),
});

const confirmApproval = defineAction({
  accept: 'json',
  input: z.object({
    reportId: z.string().uuid(),
    expectedVersion: z.coerce.bigint(),
    role: z.enum(ISSUE_SLIP_APPROVAL_ROLES),
    approverName: z.string().max(200).optional(),
    note: z.string().max(2000).optional(),
    evidenceFileId: z.string().uuid().optional(),
  }),
  handler: (input, context) =>
    run(
      () =>
        repo().confirmApproval.execute({
          ...input,
          actor: actor(context),
          requestId: requestId(context),
        }),
      context,
    ),
});

const reverseApproval = defineAction({
  accept: 'json',
  input: z.object({
    reportId: z.string().uuid(),
    expectedVersion: z.coerce.bigint(),
    role: z.enum(ISSUE_SLIP_APPROVAL_ROLES),
    reason: z.string().min(1).max(2000),
  }),
  handler: (input, context) =>
    run(
      () =>
        repo().reverseApproval.execute({
          ...input,
          actor: actor(context),
          requestId: requestId(context),
        }),
      context,
    ),
});

const createDailyReject = defineAction({
  accept: 'json',
  input: z.object({
    reportDate: z.coerce.date(),
    department: z.string().max(200),
    shift: z.string().max(50).optional(),
    entries: z.array(dailyRejectEntry).max(200),
  }),
  handler: (input, context) =>
    run(
      () =>
        repo().createDailyReject.execute({
          ...input,
          actor: actor(context),
          requestId: requestId(context),
        }),
      context,
    ),
});

const appendDailyRejectEntry = defineAction({
  accept: 'json',
  input: z.object({
    reportId: z.string().uuid(),
    expectedVersion: z.coerce.bigint(),
    entry: dailyRejectEntry,
  }),
  handler: (input, context) =>
    run(
      () =>
        repo().appendDailyRejectEntry.execute({
          ...input,
          actor: actor(context),
          requestId: requestId(context),
        }),
      context,
    ),
});

const finalizeDailyReject = defineAction({
  accept: 'json',
  input: z.object({
    reportId: z.string().uuid(),
    expectedVersion: z.coerce.bigint(),
  }),
  handler: (input, context) =>
    run(
      () =>
        repo().finalizeDailyReject.execute({
          ...input,
          actor: actor(context),
          requestId: requestId(context),
        }),
      context,
    ),
});

const voidReport = defineAction({
  accept: 'json',
  input: z.object({
    reportId: z.string().uuid(),
    expectedVersion: z.coerce.bigint(),
    reason: z.string().min(1).max(2000),
  }),
  handler: (input, context) =>
    run(
      () =>
        repo().voidReport.execute({
          ...input,
          actor: actor(context),
          requestId: requestId(context),
        }),
      context,
    ),
});

export const rejectReports = {
  createIssueSlip,
  updateIssueSlipDraft,
  issueIssueSlip,
  confirmApproval,
  reverseApproval,
  createDailyReject,
  appendDailyRejectEntry,
  finalizeDailyReject,
  voidReport,
};
