import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Kysely, PostgresDialect } from 'kysely';
import { createPool } from '../../../src/shared/database/pool.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import { migrate } from '../../../scripts/db/migrate.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';
import { uuidv7 } from '../../../src/shared/id/uuid.js';
import { createDraftCalibration } from '../../../src/modules/assets/calibration/domain/calibration.js';
import { PostgresCalibrationRepository } from '../../../src/modules/assets/calibration/infrastructure/postgres-repository.js';
import { createDraftMaintenance } from '../../../src/modules/assets/maintenance/domain/maintenance.js';
import { PostgresMaintenanceRepository } from '../../../src/modules/assets/maintenance/infrastructure/postgres-repository.js';
import { PostgresEquipmentRepository } from '../../../src/modules/assets/equipment/infrastructure/postgres-repository.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const actor = (id: string): ActorContext => ({
  id,
  accountState: 'ACTIVE',
  roles: ['Supervisor'],
  permissions: [
    'PERM-EQP-VIEW',
    'PERM-EQP-CREATE',
    'PERM-EQP-CHANGE-STATUS',
    'PERM-CAL-VIEW',
    'PERM-CAL-CREATE',
    'PERM-CAL-SUBMIT',
    'PERM-CAL-REVIEW',
    'PERM-CAL-APPROVE',
    'PERM-MNT-VIEW',
    'PERM-MNT-CREATE',
    'PERM-MNT-EDIT',
    'PERM-MNT-COMPLETE',
  ].map((code) => ({ code: code as never, scopes: ['GLOBAL' as const] })),
});

describe('QC-CLOSURE-008 asset lifecycle persistence', () => {
  let pool: ReturnType<typeof createPool>;
  let db: Kysely<DatabaseSchema>;
  let userId: string;
  let equipmentId: string;

  beforeAll(async () => {
    pool = createPool({
      connectionString: getTestDatabaseUrl(await startPostgresContainer()),
      max: 4,
    });
    await migrate({ pool });
    db = new Kysely<DatabaseSchema>({ dialect: new PostgresDialect({ pool }) });
    const user = await pool.query(
      `INSERT INTO qc.users (login_identity, display_name, password_hash) VALUES ($1, $2, 'hash') RETURNING id`,
      [`closure-008-${Date.now()}`, 'Closure 008'],
    );
    userId = user.rows[0].id as string;
    equipmentId = uuidv7();
    await db
      .insertInto('equipment')
      .values({
        id: equipmentId,
        equipment_no: 'EQ-CLOSURE-008',
        name: 'Closure 008 balance',
        state: 'ACTIVE',
        created_by: userId,
        updated_by: userId,
        calibration_required: true,
        maintenance_required: true,
      })
      .execute();
  });

  afterAll(async () => {
    await db?.destroy();
    await stopPostgresContainer();
  });

  it('preserves certificate evidence, exposes immutable history, and rejects history mutation', async () => {
    const calibrationId = uuidv7();
    const repository = new PostgresCalibrationRepository(db);
    const created = await repository.create({
      calibration: createDraftCalibration({
        id: calibrationId,
        calibrationNo: 'CAL-CLOSURE-008',
        equipmentId,
        calibrationDate: new Date('2026-01-01T00:00:00Z'),
        dueDate: new Date('2026-12-31T00:00:00Z'),
        provider: 'Approved provider',
        certificateNo: 'CERT-CLOSURE-008',
        result: 'PASS',
        createdBy: userId,
        now: new Date('2026-01-01T00:00:00Z'),
      }),
      actor: actor(userId),
      requestId: 'closure-008-create-calibration',
    });
    const file = await pool.query(
      `INSERT INTO qc.files (original_filename, storage_key, storage_provider, mime_type, size_bytes, sha256, uploaded_by, state)
       VALUES ('certificate.pdf', 'closure-008/certificate.pdf', 'OBJECT_STORAGE', 'application/pdf', 10, repeat('a', 64), $1, 'ACTIVE') RETURNING id`,
      [userId],
    );
    await pool.query(
      `INSERT INTO qc.evidence_links (file_id, subject_type, subject_id, evidence_type, linked_by)
       VALUES ($1, 'CALIBRATION_RECORD', $2, 'CALIBRATION_CERTIFICATE', $3)`,
      [file.rows[0].id, calibrationId, userId],
    );
    const scheduled = await repository.transition({
      id: calibrationId,
      expectedVersion: created.version,
      actor: actor(userId),
      action: 'SCHEDULE',
      requestId: 'closure-008-schedule',
    });
    expect(scheduled.state).toBe('SCHEDULED');
    const history = await repository.history!(calibrationId, actor(userId));
    expect(history.map((item) => item.state)).toEqual(['DRAFT', 'SCHEDULED']);
    expect(history[0].snapshot).toMatchObject({ certificateNo: 'CERT-CLOSURE-008' });
    await expect(
      pool.query(`UPDATE qc.calibration_history SET state = 'FAILED' WHERE calibration_id = $1`, [
        calibrationId,
      ]),
    ).rejects.toMatchObject({ code: 'P0001' });
    expect(
      (
        await pool.query(
          `SELECT count(*)::int AS count FROM qc.evidence_links WHERE subject_id = $1`,
          [calibrationId],
        )
      ).rows[0].count,
    ).toBe(1);
  });

  it('allows only one concurrent state transition and records failed calibration safely', async () => {
    const calibrationId = uuidv7();
    const repository = new PostgresCalibrationRepository(db);
    const inserted = await db
      .insertInto('calibration_records')
      .values({
        id: calibrationId,
        calibration_no: 'CAL-CLOSURE-008-CONCURRENT',
        equipment_id: equipmentId,
        state: 'CURRENT',
        calibration_date: '2026-01-01',
        due_date: '2026-12-31',
        provider: 'Approved provider',
        certificate_no: 'CERT-CLOSURE-008-CONCURRENT',
        result: 'PASS',
        created_by: userId,
        version: 1n,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    const [first, second] = await Promise.allSettled([
      repository.transition({
        id: calibrationId,
        expectedVersion: BigInt(inserted.version),
        actor: actor(userId),
        action: 'MARK_DUE',
        requestId: 'closure-008-concurrent-a',
      }),
      repository.transition({
        id: calibrationId,
        expectedVersion: BigInt(inserted.version),
        actor: actor(userId),
        action: 'MARK_DUE',
        requestId: 'closure-008-concurrent-b',
      }),
    ]);
    expect([first.status, second.status].sort()).toEqual(['fulfilled', 'rejected']);
    const due = await repository.get(calibrationId, actor(userId));
    expect(due?.state).toBe('DUE');
    const failed = await repository.transition({
      id: calibrationId,
      expectedVersion: due!.version,
      actor: actor(userId),
      action: 'FAIL',
      reason: 'Reference check failed',
      requestId: 'closure-008-fail',
    });
    expect(failed.state).toBe('FAILED');
    const history = await repository.history!(calibrationId, actor(userId));
    expect(history.at(-1)?.state).toBe('FAILED');
  });

  it('locks equipment during maintenance, records downtime, and keeps the lock fail-safe', async () => {
    const repository = new PostgresMaintenanceRepository(db);
    const maintenanceId = uuidv7();
    const created = await repository.create({
      maintenance: createDraftMaintenance({
        id: maintenanceId,
        maintenanceNo: 'MNT-CLOSURE-008',
        equipmentId,
        maintenanceType: 'PREVENTIVE',
        description: 'Scheduled balance inspection',
        createdBy: userId,
        now: new Date('2026-02-01T00:00:00Z'),
      }),
      actor: actor(userId),
      requestId: 'closure-008-create-maintenance',
    });
    const planned = await repository.transition({
      id: maintenanceId,
      expectedVersion: created.version,
      actor: actor(userId),
      action: 'PLAN',
      requestId: 'closure-008-plan',
    });
    const started = await repository.transition({
      id: maintenanceId,
      expectedVersion: planned.version,
      actor: actor(userId),
      action: 'START',
      requestId: 'closure-008-start',
    });
    expect(started.state).toBe('IN_PROGRESS');
    const equipment = await db
      .selectFrom('equipment')
      .select(['state'])
      .where('id', '=', equipmentId)
      .executeTakeFirstOrThrow();
    expect(equipment.state).toBe('UNDER_MAINTENANCE');
    await expect(
      repository.transition({
        id: maintenanceId,
        expectedVersion: planned.version,
        actor: actor(userId),
        action: 'START',
        requestId: 'closure-008-stale-start',
      }),
    ).rejects.toThrow();
    const history = await repository.history!(maintenanceId, actor(userId));
    expect(history.map((item) => item.state)).toEqual(['DRAFT', 'PLANNED', 'IN_PROGRESS']);
    const completed = await repository.transition({
      id: maintenanceId,
      expectedVersion: started.version,
      actor: actor(userId),
      action: 'COMPLETE',
      requestId: 'closure-008-complete',
    });
    expect(completed.state).toBe('COMPLETED');
    expect(completed.downtimeMinutes).toBeGreaterThanOrEqual(0);
    expect(
      (await repository.history!(maintenanceId, actor(userId))).map((item) => item.state),
    ).toEqual(['DRAFT', 'PLANNED', 'IN_PROGRESS', 'COMPLETED']);
    const equipmentRepository = new PostgresEquipmentRepository(db);
    const lockedEquipment = await db
      .selectFrom('equipment')
      .select(['id', 'version'])
      .where('id', '=', equipmentId)
      .executeTakeFirstOrThrow();
    const returnedToService = await equipmentRepository.transition({
      id: equipmentId,
      expectedVersion: BigInt(lockedEquipment.version),
      actor: actor(userId),
      action: 'RETURN_TO_SERVICE',
      requestId: 'closure-008-return-to-service',
    });
    expect(returnedToService.state).toBe('ACTIVE');
  });
});
