import type {
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
  QueryResult,
  RootOperationNode,
  UnknownRow,
} from 'kysely';
import { withSpan, recordCounter, recordHistogram } from './telemetry.js';

/**
 * Kysely plugin that emits bounded spans/counters for database queries.
 * Attributes carry only a bounded statement kind — never SQL text, bind
 * parameters, or record identifiers (OBSERVABILITY-ARCHITECTURE §32/§33,
 * SECURITY-ARCHITECTURE §139). Query failures are counted via the Kysely
 * `log` hook in database.ts because transformResult only runs on success.
 */

const queryMetadata = new WeakMap<object, { statementKind: string; startedAt: bigint }>();

export function createTelemetryQueryPlugin(): KyselyPlugin {
  return {
    transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
      queryMetadata.set(args.queryId, {
        statementKind: typeof args.node.kind === 'string' ? args.node.kind : 'UnknownNode',
        startedAt: process.hrtime.bigint(),
      });
      return args.node;
    },
    async transformResult(args: PluginTransformResultArgs): Promise<QueryResult<UnknownRow>> {
      const metadata = queryMetadata.get(args.queryId);
      const statementKind = metadata?.statementKind ?? 'UnknownNode';
      const durationMs = metadata
        ? Number(process.hrtime.bigint() - metadata.startedAt) / 1_000_000
        : undefined;
      await withSpan('postgres.query', async () => undefined, {
        dependency: 'postgres',
        statement_kind: statementKind,
      });
      recordCounter('qc_db_queries_total', 1, {
        dependency: 'postgres',
        statement_kind: statementKind,
        outcome: 'success',
      });
      if (durationMs !== undefined) {
        recordHistogram('qc_db_query_duration_ms', durationMs, {
          dependency: 'postgres',
          statement_kind: statementKind,
          outcome: 'success',
        });
      }
      return args.result;
    },
  };
}
