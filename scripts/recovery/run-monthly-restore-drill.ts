import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync, existsSync, openSync, closeSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

export function localDrillConnection(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error('INVALID_EXPLICIT_CONNECTION');
  }
  const database = decodeURIComponent(url.pathname.slice(1));
  if (
    !['postgresql:', 'postgres:'].includes(url.protocol) ||
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    !/^qc_local_drill_[a-z0-9_]+$/.test(database) ||
    !url.username ||
    url.searchParams.has('host')
  )
    throw new Error('LOCAL_ISOLATED_TARGET_REQUIRED');
  for (const key of url.searchParams.keys())
    if (!['sslmode', 'sslrootcert'].includes(key)) throw new Error('UNSUPPORTED_CONNECTION_OPTION');
  const env: NodeJS.ProcessEnv = {
    PATH: process.env.PATH,
    HOME: process.env.HOME,
    LANG: 'C',
    PGHOST: url.hostname.replace(/^\[|\]$/g, ''),
    PGPORT: url.port || '5432',
    PGDATABASE: database,
    PGUSER: decodeURIComponent(url.username),
    PGPASSWORD: decodeURIComponent(url.password),
    PGCONNECT_TIMEOUT: '10',
    PGPASSFILE: '/dev/null',
    PGSERVICEFILE: '/dev/null',
    PGSSLMODE: url.searchParams.get('sslmode') || 'prefer',
  };
  if (url.searchParams.get('sslrootcert')) env.PGSSLROOTCERT = url.searchParams.get('sslrootcert')!;
  return { database, host: env.PGHOST!, port: env.PGPORT!, user: env.PGUSER!, env };
}
export function assertSeparateDrillDatabases(
  source: ReturnType<typeof localDrillConnection>,
  target: ReturnType<typeof localDrillConnection>,
) {
  const loopback = (host: string) => ['localhost', '127.0.0.1', '::1'].includes(host);
  if (
    loopback(source.host) &&
    loopback(target.host) &&
    source.port === target.port &&
    source.database === target.database
  )
    throw new Error('SOURCE_TARGET_MUST_DIFFER');
}
const sha = (value: string) => createHash('sha256').update(value).digest('hex');
const quote = (value: string) => `"${value.replaceAll(`"`, `""`)}"`;
const tableSql =
  "SELECT json_build_object('schema', schemaname, 'table', tablename)::text FROM pg_tables WHERE schemaname NOT IN ('pg_catalog','information_schema') ORDER BY schemaname, tablename";
const schemaSql =
  "SELECT json_build_object('schema', n.nspname, 'name', c.relname, 'kind', c.relkind, 'columns', (SELECT json_agg(json_build_array(a.attname,format_type(a.atttypid,a.atttypmod),a.attnotnull,pg_get_expr(d.adbin,d.adrelid)) ORDER BY a.attnum) FROM pg_attribute a LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum WHERE a.attrelid=c.oid AND a.attnum>0 AND NOT a.attisdropped), 'constraints', (SELECT json_agg(json_build_array(conname,pg_get_constraintdef(oid)) ORDER BY conname) FROM pg_constraint WHERE conrelid=c.oid), 'indexes', (SELECT json_agg(indexdef ORDER BY indexname) FROM pg_indexes WHERE schemaname=n.nspname AND tablename=c.relname))::text FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%' AND c.relkind IN ('r','p','v','m','S') ORDER BY n.nspname,c.relname";

export function runLocalRestoreDrill(input: {
  source: string;
  target: string;
  evidenceDir: string;
  pgBin: string;
}) {
  const source = localDrillConnection(input.source),
    target = localDrillConnection(input.target);
  assertSeparateDrillDatabases(source, target);
  const started = performance.now();
  const directory = resolve(input.evidenceDir);
  mkdirSync(directory, { recursive: true });
  const execute = (tool: string, args: string[], connection: typeof source, readOnly = false) => {
    const result = spawnSync(join(input.pgBin, tool), args, {
      env: {
        ...connection.env,
        ...(readOnly ? { PGOPTIONS: '-c default_transaction_read_only=on' } : {}),
      },
      encoding: 'utf8',
      maxBuffer: 128 * 1024 * 1024,
      timeout: 300_000,
    });
    // Provider diagnostics may contain secrets or record values: expose only a fixed classification.
    if (result.error || result.status !== 0)
      throw new Error(`LOCAL_DRILL_${tool.toUpperCase()}_FAILED`);
    return result.stdout;
  };
  const sql = (connection: typeof source, query: string) =>
    execute(
      'psql',
      ['-X', '-A', '-t', '-v', 'ON_ERROR_STOP=1', '-c', query],
      connection,
      true,
    ).trim();
  const snapshot = (connection: typeof source) => {
    const schemaDump = execute(
      'pg_dump',
      ['--schema-only', '--no-owner', '--no-privileges'],
      connection,
      true,
    )
      .split('\n')
      .filter(
        (line) =>
          !line.startsWith('\\restrict ') &&
          !line.startsWith('\\unrestrict ') &&
          !line.startsWith('--'),
      )
      .join('\n');
    const tables = sql(connection, tableSql)
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as { schema: string; table: string });
    return {
      schemaHash: sha(schemaDump),
      relationDefinitionsHash: sha(sql(connection, schemaSql)),
      sequenceStateHash: sha(
        sql(
          connection,
          "SELECT json_build_array(schemaname,sequencename,start_value,min_value,max_value,increment_by,cycle,cache_size,last_value)::text FROM pg_sequences WHERE schemaname NOT IN ('pg_catalog','information_schema') ORDER BY schemaname,sequencename",
        ),
      ),
      tables: tables.map((table) => {
        const name = `${quote(table.schema)}.${quote(table.table)}`;
        const rows = sql(
          connection,
          `SELECT to_jsonb(t)::text FROM ${name} t ORDER BY to_jsonb(t)::text`,
        );
        return {
          ...table,
          count: sql(connection, `SELECT count(*) FROM ${name}`),
          rowsHash: sha(rows),
        };
      }),
      migrationLedgerHash: tables.some(
        (table) => table.schema === 'qc' && table.table === 'schema_migrations',
      )
        ? sha(
            sql(
              connection,
              'SELECT to_jsonb(t)::text FROM qc.schema_migrations t ORDER BY to_jsonb(t)::text',
            ),
          )
        : null,
    };
  };
  if (
    sql(
      target,
      "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%'",
    ) !== '0'
  )
    throw new Error('ISOLATED_TARGET_NOT_EMPTY');
  const sourceBefore = snapshot(source);
  const artifact = join(directory, 'local-drill.dump');
  if (existsSync(artifact) || existsSync(join(directory, 'restore-drill.json')))
    throw new Error('DRILL_EVIDENCE_ALREADY_EXISTS');
  closeSync(openSync(artifact, 'wx', 0o600));
  execute(
    'pg_dump',
    ['--format=custom', '--no-owner', '--no-privileges', '--file', artifact],
    source,
    true,
  );
  execute('pg_restore', ['--list', artifact], target, true);
  execute(
    'pg_restore',
    [
      '--exit-on-error',
      '--single-transaction',
      '--no-owner',
      '--no-privileges',
      '--dbname',
      target.database,
      artifact,
    ],
    target,
  );
  const restored = snapshot(target),
    sourceAfter = snapshot(source);
  const matches =
    JSON.stringify(sourceBefore) === JSON.stringify(restored) &&
    JSON.stringify(sourceBefore) === JSON.stringify(sourceAfter);
  const evidence = {
    scope: 'LOCAL_ISOLATED_OPERATOR_DRILL',
    result: matches ? 'PASS' : 'FAIL',
    sourceDatabase: source.database,
    targetDatabase: target.database,
    elapsedMs: Math.round(performance.now() - started),
    artifactSha256: createHash('sha256').update(readFileSync(artifact)).digest('hex'),
    source: sourceBefore,
    restored,
    sourceUnchanged: JSON.stringify(sourceBefore) === JSON.stringify(sourceAfter),
    limits:
      'No production/provider DR, application restore execution, RPO/RTO/SLO or human acceptance claim',
  };
  writeFileSync(join(directory, 'restore-drill.json'), JSON.stringify(evidence, null, 2), {
    flag: 'wx',
    mode: 0o600,
  });
  if (!matches) throw new Error('RESTORE_RECONCILIATION_FAILED');
  return evidence;
}
function main() {
  const args = process.argv.slice(2);
  const option = (name: string) => {
    const index = args.indexOf(name);
    return index < 0 ? undefined : args[index + 1];
  };
  const source = option('--source') ?? process.env.QC_LOCAL_DRILL_SOURCE_URL;
  const target = option('--target') ?? process.env.QC_LOCAL_DRILL_TARGET_URL;
  const evidenceDir = option('--evidence-dir'),
    pgBin = option('--pg-bin');
  if (!source || !target || !evidenceDir || !pgBin)
    throw new Error('RESTORE_DRILL_REQUIRES_EXPLICIT_ISOLATED_TARGET');
  runLocalRestoreDrill({ source, target, evidenceDir, pgBin });
  process.stdout.write('LOCAL_ISOLATED_RESTORE_DRILL_PASS\n');
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    main();
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error && /^[A-Z0-9_]+$/.test(error.message) ? error.message : 'LOCAL_DRILL_FAILED'}\n`,
    );
    process.exitCode = 1;
  }
}
