import type {
  KyselyPlugin,
  PluginTransformQueryArgs,
  PluginTransformResultArgs,
  QueryResult,
  RootOperationNode,
  UnknownRow,
} from 'kysely';
import { withSpan, recordCounter } from './telemetry.js';

/**
 * Kysely plugin that emits bounded spans/counters for database queries.
 * Attributes carry only a bounded statement kind — never SQL text, bind
 * parameters, or record identifiers (OBSERVABILITY-ARCHITECTURE §32/§33,
 * SECURITY-ARCHITECTURE §139). Query failures are counted via the Kysely
 * `log` hook in database.ts because transformResult only runs on success.
 */

const statementKinds = new WeakMap<object, string>();

export function createTelemetryQueryPlugin(): KyselyPlugin {
  return {
    transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
      statementKinds.set(
        args.queryId,
        typeof args.node.kind === 'string' ? args.node.kind : 'UnknownNode',
      );
      return args.node;
    },
    async transformResult(args: PluginTransformResultArgs): Promise<QueryResult<UnknownRow>> {
      const statementKind = statementKinds.get(args.queryId) ?? 'UnknownNode';
      await withSpan('postgres.query', async () => undefined, {
        dependency: 'postgres',
        statement_kind: statementKind,
      });
      recordCounter('qc_db_queries_total', 1, {
        dependency: 'postgres',
        statement_kind: statementKind,
        outcome: 'success',
      });
      return args.result;
    },
  };
}
