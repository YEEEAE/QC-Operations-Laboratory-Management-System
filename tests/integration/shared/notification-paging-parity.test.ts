import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Kysely, PostgresDialect } from 'kysely';

import { migrate } from '../../../scripts/db/migrate.js';
import { createPool } from '../../../src/shared/database/pool.js';
import type { DatabaseSchema } from '../../../src/shared/database/db-types.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import { uuidv7 } from '../../../src/shared/id/uuid.js';
import { NotificationService } from '../../../src/shared/notifications/notification-service.js';
import { PostgresNotificationRepository } from '../../../src/shared/notifications/postgres-notification-repository.js';
import { startPostgresContainer, stopPostgresContainer } from '../../helpers/postgres-container.js';
import { getTestDatabaseUrl } from '../../helpers/test-env.js';

const recipientA = '01900000-0000-7000-8000-000000000f01';
const recipientB = '01900000-0000-7000-8000-000000000f02';

const actorFor = (id: string): ActorContext => ({
  id,
  accountState: 'ACTIVE',
  roles: ['EMPLOYEE'],
  permissions: [
    { code: 'PERM-NOT-VIEW-OWN', scopes: ['OWN'] },
    { code: 'PERM-NOT-MARK-READ', scopes: ['OWN'] },
  ],
});

describe('Notification paging and recipient isolation (PostgreSQL)', () => {
  let pool: ReturnType<typeof createPool> | undefined;
  let repository: PostgresNotificationRepository;
  let service: NotificationService;

  beforeAll(async () => {
    pool = createPool({
      connectionString: getTestDatabaseUrl(await startPostgresContainer({ tls: true })),
      max: 2,
    });
    await pool.query('DROP SCHEMA IF EXISTS qc CASCADE');
    await migrate({ pool });
    for (const [id, identity] of [
      [recipientA, 'notification-page-recipient-a'],
      [recipientB, 'notification-page-recipient-b'],
    ] as const) {
      await pool.query(
        `INSERT INTO qc.users (id, login_identity, display_name, password_hash)
         VALUES ($1, $2, 'Notification page user', 'test-hash')`,
        [id, identity],
      );
    }
    const database = new Kysely<DatabaseSchema>({ dialect: new PostgresDialect({ pool }) });
    repository = new PostgresNotificationRepository(database);
    service = new NotificationService(repository);
  });

  afterAll(async () => {
    await pool?.end();
    await stopPostgresContainer();
  });

  it('returns exact 50+1 pages in newest-first order and never reads or marks another recipient row', async () => {
    const firstCreatedAt = Date.parse('2026-09-01T00:00:00.000Z');
    const ids: string[] = [];
    for (let index = 1; index <= 51; index++) {
      const notification = await repository.create({
        id: uuidv7(),
        recipientUserId: recipientA,
        notificationType: 'TASK_ASSIGNED',
        severity: 'INFO',
        title: `Notice ${index}`,
        message: 'Representative pagination row',
        createdAt: new Date(firstCreatedAt + index * 60_000),
      });
      ids.push(notification.id);
    }
    const otherRecipient = await repository.create({
      id: uuidv7(),
      recipientUserId: recipientB,
      notificationType: 'TASK_ASSIGNED',
      severity: 'INFO',
      title: 'Private notice',
      message: 'Must not appear for recipient A',
      createdAt: new Date(firstCreatedAt + 52 * 60_000),
    });

    const firstPage = await service.listOwnPage(actorFor(recipientA), true, 1);
    const secondPage = await service.listOwnPage(actorFor(recipientA), true, 2);
    expect(firstPage).toMatchObject({ total: 51, page: 1, pageSize: 50 });
    expect(firstPage.items).toHaveLength(50);
    expect(secondPage).toMatchObject({ total: 51, page: 2, pageSize: 50 });
    expect(secondPage.items).toHaveLength(1);
    expect([...firstPage.items, ...secondPage.items].map((item) => item.id)).toEqual(
      ids.slice().reverse(),
    );
    expect(
      [...firstPage.items, ...secondPage.items].some((item) => item.id === otherRecipient.id),
    ).toBe(false);

    const targetId = firstPage.items[0]!.id;
    const denied = await service.markOwnRead(actorFor(recipientB), targetId);
    expect(denied).toBeUndefined();
    const marked = await service.markOwnRead(actorFor(recipientA), targetId);
    const replayed = await service.markOwnRead(actorFor(recipientA), targetId);
    expect(marked?.readAt).toBeInstanceOf(Date);
    expect(replayed?.readAt).toEqual(marked?.readAt);
    await expect(service.listOwnPage(actorFor(recipientA), true, 1)).resolves.toMatchObject({
      total: 50,
    });
    await expect(service.listOwnPage(actorFor(recipientA), false, 1)).resolves.toMatchObject({
      total: 51,
    });
    const privateRow = await repository.markRead(otherRecipient.id, recipientA, new Date());
    expect(privateRow).toBeUndefined();
  });
});
