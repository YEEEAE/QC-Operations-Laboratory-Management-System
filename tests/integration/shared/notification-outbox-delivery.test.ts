import { seedControlledInspectionReadVersion } from '../../helpers/controlled-inspection-read-fixture.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Kysely, PostgresDialect } from 'kysely';
import { randomUUID } from 'node:crypto';

import { migrate } from '../../../scripts/db/migrate.js';
import { createPool } from '../../../src/shared/database/pool.js';
import { PostgresOutboxRepository } from '../../../src/shared/outbox/postgres-outbox-repository.js';
import { createQcOutboxHandler } from '../../../src/shared/outbox/qc-event-handler.js';
import { processOutboxBatch } from '../../../src/shared/outbox/worker.js';
import { PostgresNotificationRepository } from '../../../src/shared/notifications/postgres-notification-repository.js';
import { NotificationService } from '../../../src/shared/notifications/notification-service.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import type { OutboxEvent } from '../../../src/shared/outbox/outbox-event.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

const recipientA = '01900000-0000-7000-8000-000000000d01';
const recipientB = '01900000-0000-7000-8000-000000000d02';
const recipientC = '01900000-0000-7000-8000-000000000d03';
const EVENT_RUN = randomUUID();
const eventLabTemplateId = randomUUID();
const eventLabVersionId = randomUUID();
const eventLabTestId = randomUUID();
const eventReceivingId = randomUUID();
const eventInspectionTemplateId = randomUUID();
const eventInspectionVersionId = randomUUID();
const eventInspectionId = randomUUID();

const actorFor = (id: string): ActorContext => ({
  id,
  accountState: 'ACTIVE',
  roles: ['EMPLOYEE'],
  permissions: [
    { code: 'PERM-NOT-VIEW-OWN', scopes: ['OWN'] },
    { code: 'PERM-NOT-MARK-READ', scopes: ['OWN'] },
  ],
});

/**
 * Approved durable delivery model (REQ-NOT-004/005): an outbox event is
 * delivered exactly once per dedupe key into a recipient-scoped notification.
 * The delivery handler is deliberately idempotent — replaying the same event
 * (crash between handler and markProcessed) creates no duplicate row.
 */
async function deliverEventToNotification(
  notifications: PostgresNotificationRepository,
  event: OutboxEvent,
): Promise<void> {
  await notifications.create({
    recipientUserId: String(event.payload.recipientUserId),
    notificationType: 'TASK_ASSIGNED',
    severity: 'INFO',
    title: String(event.payload.title),
    message: String(event.payload.message),
    dedupeKey: `outbox-delivery:${event.id}`,
  });
}

describe('Notification delivery, outbox replay and deduplication (PostgreSQL)', () => {
  let pool: ReturnType<typeof createPool> | undefined;
  let database: Kysely<DatabaseSchema>;
  let outbox: PostgresOutboxRepository;
  let notifications: PostgresNotificationRepository;
  let service: NotificationService;

  beforeAll(async () => {
    pool = createPool({
      connectionString: getTestDatabaseUrl(await startPostgresContainer({ tls: true })),
      max: 2,
    });
    // Per-suite schema isolation: `outbox.claim(10)` consumes the oldest
    // unclaimed events, so events left behind by another suite on a reused
    // cluster would starve this suite's own keys (same pattern as the
    // control-center and controlled-mutation suites).
    await pool.query('DROP SCHEMA IF EXISTS qc CASCADE');
    await migrate({ pool: pool! });
    for (const [id, identity] of [
      [recipientA, 'notification-recipient-a'],
      [recipientB, 'notification-recipient-b'],
      [recipientC, 'notification-recipient-c'],
    ] as const) {
      await pool!.query(
        `INSERT INTO qc.users (id, login_identity, display_name, password_hash)
         VALUES ($1, $2, 'Notification test user', 'test-hash')
         ON CONFLICT (id) DO NOTHING`,
        [id, identity],
      );
    }
    database = new Kysely<DatabaseSchema>({ dialect: new PostgresDialect({ pool: pool! }) });
    outbox = new PostgresOutboxRepository(database);
    notifications = new PostgresNotificationRepository(database);
    service = new NotificationService(notifications);
  });

  afterAll(async () => {
    const eventPrefix = `qc-notification-test:${EVENT_RUN}:%`;
    await pool?.query(
      `DELETE FROM qc.notification_deliveries
       WHERE notification_id IN (
         SELECT id FROM qc.notifications
         WHERE dedupe_key IN (
           SELECT 'notification:' || id::text FROM qc.outbox_events WHERE dedupe_key LIKE $1
         )
       )`,
      [eventPrefix],
    );
    await pool?.query(
      `DELETE FROM qc.notifications
       WHERE dedupe_key IN (
         SELECT 'notification:' || id::text FROM qc.outbox_events WHERE dedupe_key LIKE $1
       )`,
      [eventPrefix],
    );
    await pool?.query('DELETE FROM qc.outbox_events WHERE dedupe_key LIKE $1', [eventPrefix]);
    await pool?.query('DELETE FROM qc.inspection_reports WHERE id = $1', [eventInspectionId]);
    await pool?.query('DELETE FROM qc.inspection_template_versions WHERE id = $1', [
      eventInspectionVersionId,
    ]);
    await pool?.query('DELETE FROM qc.inspection_item_templates WHERE template_id=$1', [
      eventInspectionTemplateId,
    ]);
    await pool?.query('DELETE FROM qc.inspection_templates WHERE id = $1', [
      eventInspectionTemplateId,
    ]);
    await pool?.query('DELETE FROM qc.receiving_items WHERE id = $1', [eventReceivingId]);
    await pool?.query('DELETE FROM qc.lab_tests WHERE id = $1', [eventLabTestId]);
    await pool?.query('DELETE FROM qc.lab_test_template_versions WHERE id = $1', [
      eventLabVersionId,
    ]);
    await pool?.query('DELETE FROM qc.lab_test_templates WHERE id = $1', [eventLabTemplateId]);
    await pool?.end();
    await stopPostgresContainer();
  });

  it('deduplicates enqueued outbox events on the unique dedupe key', async () => {
    const dedupeKey = 'notif-test:task-created:t1';
    for (const suffix of ['1', '2']) {
      await outbox.enqueue({
        eventType: 'TASK_ASSIGNED',
        aggregateType: 'TASK',
        aggregateId: recipientA,
        payload: { recipientUserId: recipientA, title: `T${suffix}`, message: 'M' },
        dedupeKey,
      });
    }
    const claimed = await outbox.claim(10);
    expect(claimed.filter((event) => event.dedupeKey === dedupeKey)).toHaveLength(1);
    const total = await pool!.query(
      `SELECT COUNT(*)::int AS count FROM qc.outbox_events WHERE dedupe_key = $1`,
      [dedupeKey],
    );
    expect(total.rows[0]).toMatchObject({ count: 1 });
  });

  it('delivers an outbox event to exactly one recipient-scoped notification and replays idempotently', async () => {
    const dedupeKey = 'notif-test:task-created:t2';
    await outbox.enqueue({
      eventType: 'TASK_ASSIGNED',
      aggregateType: 'TASK',
      aggregateId: recipientA,
      payload: { recipientUserId: recipientA, title: 'Approval needed', message: 'Task t2' },
      dedupeKey,
    });
    // Make the event claimable regardless of sub-millisecond clock rounding.
    await pool!.query(
      `UPDATE qc.outbox_events SET available_at = now() - interval '1 second' WHERE dedupe_key = $1`,
      [dedupeKey],
    );
    let delivered = 0;
    await processOutboxBatch(outbox, async (event) => {
      if (event.dedupeKey !== dedupeKey) return;
      // Simulate a replay after the handler wrote the notification but before
      // the worker marked the event processed: no duplicate row may appear.
      await deliverEventToNotification(notifications, event);
      await deliverEventToNotification(notifications, event);
      delivered++;
    });
    expect(delivered).toBe(1);
    const rows = await pool!.query(
      `SELECT COUNT(*)::int AS count FROM qc.notifications WHERE dedupe_key LIKE 'outbox-delivery:%'`,
    );
    expect(rows.rows[0]).toMatchObject({ count: 1 });
    const own = await service.listOwn(actorFor(recipientA));
    expect(own.filter((notification) => notification.title === 'Approval needed')).toHaveLength(1);
    expect(own.every((notification) => notification.recipientUserId === recipientA)).toBe(true);
  });

  it('keeps notifications recipient-scoped: another recipient sees nothing and cannot mark them read', async () => {
    const created = await service.create({
      recipientUserId: recipientA,
      notificationType: 'TASK_ASSIGNED',
      severity: 'INFO',
      title: 'Private to A',
      message: 'Only A',
    });
    expect(await service.listOwn(actorFor(recipientB))).not.toContainEqual(
      expect.objectContaining({ title: 'Private to A' }),
    );
    await expect(service.markOwnRead(actorFor(recipientB), created.id)).resolves.toBeUndefined();
    const stillUnread = await service.listOwn(actorFor(recipientA), true);
    expect(stillUnread.some((notification) => notification.id === created.id)).toBe(true);
  });

  it('claims events in a deterministic order even when created_at ties', async () => {
    // created_at is not unique; claim order must still be total and stable so a
    // limited batch never re-serves or skips events across identical runs.
    const keys = ['ord-1', 'ord-2', 'ord-3', 'ord-4', 'ord-5'];
    for (const key of keys) {
      await outbox.enqueue({
        eventType: 'TASK_ASSIGNED',
        aggregateType: 'TASK',
        aggregateId: recipientA,
        payload: { recipientUserId: recipientA, title: `Order ${key}`, message: 'M' },
        dedupeKey: `notif-test:order:${key}`,
      });
    }
    await pool!.query(
      `UPDATE qc.outbox_events
          SET created_at = TIMESTAMPTZ '2026-01-01 00:00:00+00',
              available_at = now() - interval '1 second'
        WHERE dedupe_key LIKE 'notif-test:order:%'`,
    );
    const firstRun = (await outbox.claim(3)).map((event) => event.dedupeKey);
    const secondRun = (await outbox.claim(3)).map((event) => event.dedupeKey);
    expect(firstRun).toHaveLength(3);
    expect(secondRun).toHaveLength(2);
    expect([...firstRun, ...secondRun]).toHaveLength(5);
    expect(new Set([...firstRun, ...secondRun]).size).toBe(5);
    // The two runs together must follow one stable total order (id tie-break):
    // no event reappears and none is skipped between the bounded claims.
    const orderedIds = await pool!.query(
      `SELECT dedupe_key FROM qc.outbox_events
        WHERE dedupe_key LIKE 'notif-test:order:%'
        ORDER BY created_at, id`,
    );
    expect([...firstRun, ...secondRun]).toEqual(
      orderedIds.rows.map((row: { dedupe_key: string }) => row.dedupe_key),
    );
  });

  it('keeps recipient listing and mark-read replays stable and idempotent', async () => {
    const first = await service.create({
      recipientUserId: recipientB,
      notificationType: 'TASK_ASSIGNED',
      severity: 'INFO',
      title: 'Stable order 1',
      message: 'Same timestamp',
    });
    const second = await service.create({
      recipientUserId: recipientB,
      notificationType: 'TASK_ASSIGNED',
      severity: 'INFO',
      title: 'Stable order 2',
      message: 'Same timestamp',
    });
    const page1 = await service.listOwn(actorFor(recipientB));
    const page2 = await service.listOwn(actorFor(recipientB));
    expect(page1.map((notification) => notification.id)).toEqual(
      page2.map((notification) => notification.id),
    );
    // Both rows share one timestamp, so the listing falls back to its declared
    // tie-break (`created_at DESC, id DESC`). PostgreSQL 18's `uuidv7()` is time
    // ordered but not monotonic inside a millisecond, so creation order is not
    // recoverable from the id — the assertion pins the rule the query actually
    // implements instead of assuming one.
    const positions = page1.map((notification) => notification.id);
    expect(positions).toContain(second.id);
    expect(positions).toContain(first.id);
    expect(positions).toEqual([...positions].sort().reverse());
    const markedOnce = await service.markOwnRead(actorFor(recipientB), first.id);
    const markedTwice = await service.markOwnRead(actorFor(recipientB), first.id);
    expect(markedOnce?.readAt).toEqual(markedTwice?.readAt);
  });

  it('pages 51 own notifications and changes only read_at on authorized idempotent replay', async () => {
    const own = actorFor(recipientC);
    for (let index = 1; index <= 51; index++) {
      await service.create({
        recipientUserId: recipientC,
        notificationType: 'TASK_ASSIGNED',
        severity: 'INFO',
        title: `Page boundary ${index}`,
        message: 'Bounded page fixture',
      });
    }
    const firstPage = await service.listOwnPage(own, true, 1);
    const secondPage = await service.listOwnPage(own, true, 2);
    expect(firstPage).toMatchObject({ total: 51, page: 1, pageSize: 50 });
    expect(firstPage.items).toHaveLength(50);
    expect(secondPage).toMatchObject({ total: 51, page: 2, pageSize: 50 });
    expect(secondPage.items).toHaveLength(1);
    expect(new Set([...firstPage.items, ...secondPage.items].map((row) => row.id)).size).toBe(51);

    const target = secondPage.items[0]!;
    const beforeCounts = await pool!.query(
      `SELECT (SELECT COUNT(*)::int FROM qc.audit_events) AS audit_count,
              (SELECT COUNT(*)::int FROM qc.outbox_events) AS outbox_count`,
    );
    await expect(service.markOwnRead(actorFor(recipientB), target.id)).resolves.toBeUndefined();
    const deniedSnapshot = await pool!.query(
      `SELECT read_at FROM qc.notifications WHERE id = $1 AND recipient_user_id = $2`,
      [target.id, recipientC],
    );
    const deniedCounts = await pool!.query(
      `SELECT (SELECT COUNT(*)::int FROM qc.audit_events) AS audit_count,
              (SELECT COUNT(*)::int FROM qc.outbox_events) AS outbox_count`,
    );
    expect(deniedSnapshot.rows[0]?.read_at).toBeNull();
    expect(deniedCounts.rows[0]).toEqual(beforeCounts.rows[0]);

    const [marked, replay, concurrentReplay] = await Promise.all([
      service.markOwnRead(own, target.id),
      service.markOwnRead(own, target.id),
      service.markOwnRead(own, target.id),
    ]);
    expect(marked?.readAt).toBeInstanceOf(Date);
    expect(replay?.readAt).toEqual(marked?.readAt);
    expect(concurrentReplay?.readAt).toEqual(marked?.readAt);
    const finalCounts = await pool!.query(
      `SELECT (SELECT COUNT(*)::int FROM qc.audit_events) AS audit_count,
              (SELECT COUNT(*)::int FROM qc.outbox_events) AS outbox_count`,
    );
    expect(finalCounts.rows[0]).toEqual(beforeCounts.rows[0]);
    await expect(service.listOwnPage(own, true, 1)).resolves.toMatchObject({ total: 50 });
    await expect(service.listOwnPage(own, false, 1)).resolves.toMatchObject({ total: 51 });
  });

  it('persists retry metadata for a failed outbox handler without writing a notification', async () => {
    const dedupeKey = `qc-retry-test:${EVENT_RUN}`;
    await outbox.enqueue({
      eventType: 'TASK_CHANGED',
      aggregateType: 'TASK',
      aggregateId: recipientA,
      payload: { title: 'retry fixture' },
      dedupeKey,
    });
    await pool!.query(
      `UPDATE qc.outbox_events SET available_at = now() - interval '1 second' WHERE dedupe_key = $1`,
      [dedupeKey],
    );
    const auditBefore = await pool!.query(`SELECT COUNT(*)::int AS count FROM qc.audit_events`);
    await processOutboxBatch(outbox, async () => {
      throw new Error('provider unavailable with private-detail');
    });
    const event = await pool!.query<{
      attempt_count: number;
      last_error: string | null;
      available_at: Date;
      processed_at: Date | null;
    }>(
      `SELECT attempt_count, last_error, available_at, processed_at
       FROM qc.outbox_events WHERE dedupe_key = $1`,
      [dedupeKey],
    );
    expect(event.rows[0]?.attempt_count).toBe(1);
    expect(event.rows[0]?.last_error).toBe('delivery failed');
    expect(event.rows[0]?.last_error).not.toContain('private-detail');
    expect(event.rows[0]?.available_at.getTime()).toBeGreaterThan(Date.now());
    expect(event.rows[0]?.processed_at).toBeNull();
    const notificationsForEvent = await pool!.query(
      `SELECT COUNT(*)::int AS count FROM qc.notifications
       WHERE dedupe_key = (
         SELECT 'notification:' || id::text FROM qc.outbox_events WHERE dedupe_key = $1
       )`,
      [dedupeKey],
    );
    expect(notificationsForEvent.rows[0]?.count).toBe(0);
    const auditAfter = await pool!.query(`SELECT COUNT(*)::int AS count FROM qc.audit_events`);
    expect(auditAfter.rows[0]?.count).toBe(auditBefore.rows[0]?.count);
  });

  it('notifies authors only for final inspection/lab approval and deduplicates replay', async () => {
    await pool!.query(
      `INSERT INTO qc.lab_test_templates (id, test_code, name, active, created_by)
       VALUES ($1, $2, 'Outbox lab template', TRUE, $3)`,
      [eventLabTemplateId, `LAB-NOT-${EVENT_RUN}`, recipientB],
    );
    await pool!.query(
      `INSERT INTO qc.lab_test_template_versions (id, template_id, version_no, state, created_by)
       VALUES ($1, $2, 'v1', 'APPROVED', $3)`,
      [eventLabVersionId, eventLabTemplateId, recipientB],
    );
    await pool!.query(
      `INSERT INTO qc.lab_tests (id, lab_test_no, template_version_id, state, author_id, created_by)
       VALUES ($1, $2, $3, 'PENDING_QCM_APPROVAL', $4, $4)`,
      [eventLabTestId, `LAB-NOT-${EVENT_RUN}`, eventLabVersionId, recipientA],
    );
    await pool!.query(
      `INSERT INTO qc.receiving_items
         (id, receiving_no, doc_no, supplier_name, item_code, description, lot, qty, receiving_date, created_by)
       VALUES ($1, $2, 'OUTBOX-DOC', 'Outbox supplier', 'OUTBOX-ITEM', 'Outbox item', 'OUTBOX-LOT', 1, CURRENT_DATE, $3)`,
      [eventReceivingId, `RCV-NOT-${EVENT_RUN}`, recipientB],
    );
    await pool!.query(
      `INSERT INTO qc.inspection_templates (id, template_code, name, active, created_by)
       VALUES ($1, $2, 'Outbox inspection template', TRUE, $3)`,
      [eventInspectionTemplateId, `INSP-NOT-${EVENT_RUN}`, recipientB],
    );
    await pool!.query(
      "UPDATE qc.receiving_items SET workflow_state='READY_FOR_INSPECTION' WHERE id=$1",
      [eventReceivingId],
    );
    await seedControlledInspectionReadVersion(pool!, {
      templateId: eventInspectionTemplateId,
      versionId: eventInspectionVersionId,
      versionNo: 'v1',
      actorId: recipientB,
      receivingId: eventReceivingId,
    });
    await pool!.query(
      `INSERT INTO qc.inspection_reports
         (id, inspection_no, receiving_item_id, template_version_id, state, author_id, created_by)
       VALUES ($1, $2, $3, $4, 'PENDING_QCM_APPROVAL', $5, $5)`,
      [
        eventInspectionId,
        `INSP-NOT-${EVENT_RUN}`,
        eventReceivingId,
        eventInspectionVersionId,
        recipientA,
      ],
    );

    const stageOneKeys = [
      `qc-notification-test:${EVENT_RUN}:lab-stage-one`,
      `qc-notification-test:${EVENT_RUN}:inspection-stage-one`,
    ];
    await outbox.enqueue({
      eventType: 'LAB_TEST_CHANGED',
      aggregateType: 'LAB_TEST',
      aggregateId: eventLabTestId,
      payload: { action: 'APPROVE', state: 'PENDING_QCM_APPROVAL' },
      dedupeKey: stageOneKeys[0],
    });
    await outbox.enqueue({
      eventType: 'INSPECTION_CHANGED',
      aggregateType: 'INSPECTION_REPORT',
      aggregateId: eventInspectionId,
      payload: { action: 'APPROVE', state: 'PENDING_QCM_APPROVAL' },
      dedupeKey: stageOneKeys[1],
    });
    await pool!.query(
      `UPDATE qc.outbox_events SET available_at = now() - interval '1 second' WHERE dedupe_key LIKE $1`,
      [`qc-notification-test:${EVENT_RUN}:%`],
    );
    const handler = createQcOutboxHandler(database);
    await processOutboxBatch(outbox, handler);
    const early = await pool!.query(
      `SELECT COUNT(*)::int AS count FROM qc.notifications
       WHERE dedupe_key IN (
         SELECT 'notification:' || id::text FROM qc.outbox_events WHERE dedupe_key LIKE $1
       )`,
      [`qc-notification-test:${EVENT_RUN}:%`],
    );
    expect(early.rows[0]?.count).toBe(0);

    await pool!.query('UPDATE qc.lab_tests SET state = $2 WHERE id = $1', [
      eventLabTestId,
      'APPROVED',
    ]);
    await pool!.query('UPDATE qc.inspection_reports SET state = $2 WHERE id = $1', [
      eventInspectionId,
      'APPROVED',
    ]);
    const finalKeys = [
      `qc-notification-test:${EVENT_RUN}:lab-final`,
      `qc-notification-test:${EVENT_RUN}:inspection-final`,
    ];
    await outbox.enqueue({
      eventType: 'LAB_TEST_CHANGED',
      aggregateType: 'LAB_TEST',
      aggregateId: eventLabTestId,
      payload: { action: 'FINAL_APPROVE', state: 'APPROVED' },
      dedupeKey: finalKeys[0],
    });
    await outbox.enqueue({
      eventType: 'INSPECTION_CHANGED',
      aggregateType: 'INSPECTION_REPORT',
      aggregateId: eventInspectionId,
      payload: { action: 'FINAL_APPROVE', state: 'APPROVED' },
      dedupeKey: finalKeys[1],
    });
    await pool!.query(
      `UPDATE qc.outbox_events SET available_at = now() - interval '1 second' WHERE dedupe_key = ANY($1::text[])`,
      [finalKeys],
    );
    const auditBefore = await pool!.query(`SELECT COUNT(*)::int AS count FROM qc.audit_events`);
    await processOutboxBatch(outbox, handler);

    const finalEvents = await pool!.query<{
      id: string;
      event_type: string;
      aggregate_type: string;
      aggregate_id: string;
      payload: Record<string, unknown>;
      dedupe_key: string;
    }>(
      `SELECT id, event_type, aggregate_type, aggregate_id, payload, dedupe_key
       FROM qc.outbox_events WHERE dedupe_key = ANY($1::text[]) ORDER BY dedupe_key`,
      [finalKeys],
    );
    expect(finalEvents.rows).toHaveLength(2);
    for (const row of finalEvents.rows) {
      await handler({
        id: row.id,
        eventType: row.event_type,
        aggregateType: row.aggregate_type,
        aggregateId: row.aggregate_id,
        payload: row.payload,
        dedupeKey: row.dedupe_key,
        attemptCount: 1,
        availableAt: new Date(),
      });
    }

    const delivered = await pool!.query<{
      recipient_user_id: string;
      notification_type: string;
      title: string;
      subject_type: string;
      subject_id: string;
      dedupe_key: string;
      read_at: Date | null;
    }>(
      `SELECT recipient_user_id, notification_type, title, subject_type, subject_id, dedupe_key, read_at
       FROM qc.notifications WHERE dedupe_key IN (
         SELECT 'notification:' || id::text FROM qc.outbox_events WHERE dedupe_key = ANY($1::text[])
       ) ORDER BY notification_type`,
      [finalKeys],
    );
    expect(delivered.rows).toHaveLength(2);
    expect(delivered.rows).toMatchObject([
      {
        recipient_user_id: recipientA,
        notification_type: 'INSPECTION_CHANGED_APPROVED',
        title: 'Inspection approved',
        subject_type: 'INSPECTION_REPORT',
        subject_id: eventInspectionId,
        read_at: null,
      },
      {
        recipient_user_id: recipientA,
        notification_type: 'LAB_TEST_CHANGED_APPROVED',
        title: 'Laboratory test approved',
        subject_type: 'LAB_TEST',
        subject_id: eventLabTestId,
        read_at: null,
      },
    ]);
    expect(new Set(delivered.rows.map((row) => row.dedupe_key)).size).toBe(2);
    const deliveryRows = await pool!.query(
      `SELECT COUNT(*)::int AS count FROM qc.notification_deliveries
       WHERE notification_id IN (SELECT id FROM qc.notifications WHERE dedupe_key = ANY($1::text[]))`,
      [delivered.rows.map((row) => row.dedupe_key)],
    );
    expect(deliveryRows.rows[0]?.count).toBe(0);

    const authorNotifications = await service.listOwn(actorFor(recipientA));
    expect(
      authorNotifications.filter((item) => item.dedupeKey?.startsWith('notification:')),
    ).toHaveLength(2);
    expect(
      (await service.listOwn(actorFor(recipientB))).some(
        (item) => item.subjectId === eventLabTestId,
      ),
    ).toBe(false);
    const auditAfter = await pool!.query(`SELECT COUNT(*)::int AS count FROM qc.audit_events`);
    expect(auditAfter.rows[0]?.count).toBe(auditBefore.rows[0]?.count);
  });
});
