import { createHash } from 'node:crypto';
import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../../shared/database/db-types.js';
import type { ActorContext } from '../../../../shared/authorization/types.js';
import { authorize } from '../../../../shared/authorization/authorize.js';
import { AppError } from '../../../../shared/errors/app-error.js';
import { PostgresAuditRepository } from '../../../../shared/audit/postgres-audit-repository.js';
import { stableJson } from '../../../../shared/json/stable-stringify.js';
import {
  controlledFormSchema,
  validateControlledFormValues,
} from '../../catalog/domain/controlled-form.js';
export {
  controlledFormSchema,
  validateControlledFormValues,
} from '../../catalog/domain/controlled-form.js';
export type { ControlledForm, ControlledFormValues } from '../../catalog/domain/controlled-form.js';

export class SaveControlledInspectionFormUseCase {
  constructor(private readonly db: Kysely<DatabaseSchema>) {}
  async execute(i: {
    actor: ActorContext;
    id: string;
    expectedVersion: bigint;
    values: unknown;
    requestId: string;
  }) {
    return this.db.transaction().execute(async (tx) => {
      const row = await tx
        .selectFrom('inspection_reports')
        .selectAll()
        .where('id', '=', i.id)
        .forUpdate()
        .executeTakeFirst();
      if (!row) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
      authorize(
        {
          actor: i.actor,
          permission: 'PERM-INSP-EDIT-DRAFT',
          action: 'EDIT',
          entity: {
            type: 'INSPECTION_REPORT',
            id: row.id,
            state: row.state,
            authorId: row.author_id,
            executorId: row.author_id,
          },
          scope: { ownerId: row.author_id, assigneeId: row.assigned_user_id ?? row.author_id },
          currentVersion: BigInt(row.version),
          expectedVersion: i.expectedVersion,
          businessCondition: row.state === 'DRAFT',
        },
        { throwOnDeny: true },
      );
      const snapshot = await tx
        .selectFrom('inspection_report_snapshots')
        .select('template_snapshot')
        .where('inspection_report_id', '=', row.id)
        .where('snapshot_stage', '=', 'CREATION')
        .executeTakeFirstOrThrow();
      const context = snapshot.template_snapshot as Record<string, unknown>;
      const form = controlledFormSchema.parse(context.digitalForm);
      const values = validateControlledFormValues(form, i.values);
      if (form.headerFields.some((f) => f.key === 'equipmentId')) {
        const links = await tx
          .selectFrom('inspection_equipment_usage')
          .selectAll()
          .where('inspection_report_id', '=', i.id)
          .orderBy('id')
          .execute();
        const selected = values.headers.equipmentId
          ? links.find(
              (u) =>
                u.equipment_id === values.headers.equipmentId &&
                (!values.headers.calibrationId ||
                  u.calibration_record_id === values.headers.calibrationId),
            )
          : links.length === 1
            ? links[0]
            : undefined;
        if (selected) {
          const calibration = selected.calibration_snapshot as Record<string, unknown>;
          if (
            values.headers.certificate &&
            values.headers.certificate !== calibration.certificateNo
          )
            throw new AppError('VALIDATION_FAILED', { userSafe: true });
          values.headers.equipmentId = selected.equipment_id;
          values.headers.calibrationId = selected.calibration_record_id ?? '';
          values.headers.certificate = String(calibration.certificateNo ?? '');
        }
      }

      // Equipment identifiers are authenticated links to eligible, captured equipment/calibration evidence.
      if (
        values.headers.equipmentId ||
        values.headers.calibrationId ||
        values.headers.certificate
      ) {
        const usage = await tx
          .selectFrom('inspection_equipment_usage')
          .selectAll()
          .where('inspection_report_id', '=', i.id)
          .where('equipment_id', '=', String(values.headers.equipmentId ?? ''))
          .where('calibration_record_id', '=', String(values.headers.calibrationId ?? ''))
          .executeTakeFirst();
        if (!usage) throw new AppError('VALIDATION_FAILED', { userSafe: true });
        const calibration = usage.calibration_snapshot as Record<string, unknown> | null;
        if (values.headers.certificate && values.headers.certificate !== calibration?.certificateNo)
          throw new AppError('VALIDATION_FAILED', { userSafe: true });
      }
      const updated = await tx
        .updateTable('inspection_reports')
        .set({
          form_values: JSON.stringify(values),
          updated_by: i.actor.id,
          updated_at: new Date(),
          version: i.expectedVersion + 1n,
        })
        .where('id', '=', i.id)
        .where('version', '=', i.expectedVersion)
        .returning('version')
        .executeTakeFirstOrThrow();
      await new PostgresAuditRepository(tx).append({
        actorType: 'USER',
        actorId: i.actor.id,
        subjectType: 'INSPECTION_REPORT',
        subjectId: i.id,
        action: 'MEASUREMENT_RECORDED',
        requestId: i.requestId,
        payload: {
          kind: 'CONTROLLED_INSPECTION_FORM',
          contentHash: createHash('sha256').update(stableJson(values)).digest('hex'),
          version: String(updated.version),
        },
      });
      return { id: i.id, version: String(updated.version) };
    });
  }
}
