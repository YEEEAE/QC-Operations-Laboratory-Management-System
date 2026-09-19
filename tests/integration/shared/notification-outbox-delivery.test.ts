import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Kysely, PostgresDialect } from 'kysely';

import { migrate } from '../../../scripts/db/migrate.js';
import { createPool } from '../../../src/shared/database/pool.js';
import { PostgresOutboxRepository } from '../../../src/shared/outbox/postgres-outbox-repository.js';
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
});
