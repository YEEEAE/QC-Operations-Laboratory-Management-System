import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { toActionError } from '../shared/errors/action-error.js';
import { AppError } from '../shared/errors/app-error.js';
import { reportingDependencies } from '../modules/reporting/application/dependencies.js';

const input = z.object({
  reportCode: z.string(),
  format: z.enum(['CSV', 'XLSX']),
  from: z.string().optional(),
  to: z.string().optional(),
});
const exportReport = defineAction({
  accept: 'json',
  input,
  handler: async (value, context) => {
    try {
      const actor = context.locals.actor;
      if (!actor) throw new AppError('AUTH_REQUIRED', { userSafe: true });
      const result = await reportingDependencies().exportReport.execute(
        actor,
        value.reportCode,
        value.format,
        { from: value.from, to: value.to },
      );
      return {
        ok: true,
        filename: result.filename,
        mimeType: result.mimeType,
        rowCount: result.rowCount,
        contentBase64: result.bytes.toString('base64'),
      };
    } catch (error) {
      const mapped = toActionError(error, context.locals.requestContext?.requestId);
      throw new ActionError({ code: 'BAD_REQUEST', message: mapped.error.messageKey });
    }
  },
});
export const reports = { exportReport };
