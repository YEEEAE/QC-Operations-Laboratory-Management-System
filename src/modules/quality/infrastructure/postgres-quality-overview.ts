import type { Kysely } from 'kysely';
import type { DatabaseSchema } from '../../../shared/database/db-types.js';
import type { ActorContext } from '../../../shared/authorization/types.js';

type OwnedQualityTable = 'findings' | 'ncrs' | 'capas';

export class PostgresQualityOverview {
  constructor(private db: Kysely<DatabaseSchema>) {}
  async overview(i: { actor: ActorContext }) {
    const owned = (t: OwnedQualityTable) =>
      this.db
        .selectFrom(t)
        .select((eb) => eb.fn.countAll().as('count'))
        .where((eb) => eb.or([eb('owner_id', '=', i.actor.id), eb('created_by', '=', i.actor.id)]))
        .executeTakeFirst();
    // qc.rcas has no owner_id column (see 0007_quality.sql): RCA ownership is
    // the creator only. Counting by owner_id would raise 42703 at runtime.
    const createdRcas = () =>
      this.db
        .selectFrom('rcas')
        .select((eb) => eb.fn.countAll().as('count'))
        .where('created_by', '=', i.actor.id)
        .executeTakeFirst();
    const [f, n, c, r] = await Promise.all([
      owned('findings'),
      owned('ncrs'),
      owned('capas'),
      createdRcas(),
    ]);
    return {
      findings: Number(f?.count ?? 0),
      ncrs: Number(n?.count ?? 0),
      rcas: Number(r?.count ?? 0),
      capas: Number(c?.count ?? 0),
      trendAvailable: false as const,
    };
  }
}
