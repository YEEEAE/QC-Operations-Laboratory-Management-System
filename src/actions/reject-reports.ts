import { defineAction, ActionError } from 'astro:actions';
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
    throw new ActionError({ code: 'BAD_REQUEST', message: mapped.error.messageKey });
  }
};

const issueSlipFields = z.object({
  goodsDescription: z.string().max(2000).optional(),
  itemCode: z.string().max(100),
  itemName: z.string().max(500),
  lotNo: z.string().max(100).optional(),
  unit: z.string().max(50),
  rejectedQty: z.string().max(50),
  unitCost: z.string().max(50).optional(),
  totalValue: z.string().max(50).optional(),
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
  pumpOutQty: z.string().max(50).optional(),
  rejectQty: z.string().max(50),
  goodQty: z.string().max(50),
  rejectLimit: z.string().max(50).optional(),
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

const updateDailyRejectDraft = defineAction({
  accept: 'json',
  input: z.object({
    reportId: z.string().uuid(),
    expectedVersion: z.coerce.bigint(),
    reportDate: z.coerce.date(),
    department: z.string().max(200),
    shift: z.string().max(50).optional(),
    entries: z.array(dailyRejectEntry).max(200),
  }),
  handler: (input, context) =>
    run(
      () =>
        repo().updateDailyRejectDraft.execute({
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
  updateDailyRejectDraft,
  finalizeDailyReject,
  voidReport,
};
