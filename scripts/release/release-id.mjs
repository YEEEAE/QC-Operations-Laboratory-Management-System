import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { basename, dirname, relative, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export const RELEASE_SCHEMA_VERSION = 1;
export const SERVICE_NAME = 'qc-operations-laboratory-management-system';
export const RELEASE_ENVIRONMENTS = ['local', 'test', 'ci', 'staging', 'production'];

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptDirectory, '../..');
const migrationDirectory = resolve(repositoryRoot, 'db/migrations');
const defaultOutput = resolve(repositoryRoot, 'dist/release-identity.json');
const safeValue = /^[A-Za-z0-9][A-Za-z0-9._:+/@-]{0,127}$/;
const gitShaPattern = /^[0-9a-f]{40}$/i;
const sha256Pattern = /^[0-9a-f]{64}$/i;
const migrationPattern = /^\d{4}_[a-z0-9_]+\.sql$/;

function assertSafeValue(name, value) {
  if (!value || !safeValue.test(value)) throw new Error(`Invalid ${name}.`);
}

function git(args) {
  return execFileSync('git', args, { cwd: repositoryRoot, encoding: 'utf8' }).trim();
}

function repositoryPath(inputPath) {
  const path = resolve(repositoryRoot, inputPath);
  const relativePath = relative(repositoryRoot, path);
  if (
    relativePath.startsWith('..') ||
    relativePath.includes(`..${process.platform === 'win32' ? '\\' : '/'}`)
  )
    throw new Error('Artifact path must be inside the repository.');
  return path;
}

export function readGitSha() {
  const value = git(['rev-parse', 'HEAD']);
  if (!gitShaPattern.test(value)) throw new Error('Unable to resolve an exact Git SHA.');
  return value.toLowerCase();
}

export function readWorkingTreeState() {
  try {
    return git(['status', '--porcelain=v1', '--untracked-files=all']) === '' ? 'clean' : 'dirty';
  } catch {
    return 'unknown';
  }
}

export async function readMigrationHead() {
  const names = (await readdir(migrationDirectory))
    .filter((name) => migrationPattern.test(name))
    .sort();
  const name = names.at(-1);
  if (!name) throw new Error('No valid migration files found.');
  const sql = await readFile(resolve(migrationDirectory, name), 'utf8');
  return {
    name: basename(name, '.sql'),
    checksum: createHash('sha256').update(sql, 'utf8').digest('hex'),
  };
}

function identityDigest(input) {
  return createHash('sha256')
    .update(
      [
        input.applicationVersion,
        input.serviceVersion,
        input.buildId,
        input.gitSha,
        input.migrationHead,
        input.migrationHeadChecksum,
        input.artifactSha256 ?? '',
      ].join('\u0000'),
      'utf8',
    )
    .digest('hex')
    .slice(0, 16);
}

export function createReleaseMetadata(input) {
  if (!RELEASE_ENVIRONMENTS.includes(input.environment))
    throw new Error('Invalid release environment.');
  assertSafeValue('application version', input.applicationVersion);
  assertSafeValue('service version', input.serviceVersion);
  assertSafeValue('build ID', input.buildId);
  if (!gitShaPattern.test(input.gitSha)) throw new Error('Invalid Git SHA.');
  if (!/^\d{4}_[a-z0-9_]+$/.test(input.migrationHead)) throw new Error('Invalid migration head.');
  if (!sha256Pattern.test(input.migrationHeadChecksum))
    throw new Error('Invalid migration head checksum.');
  if (input.artifactSha256 && !sha256Pattern.test(input.artifactSha256))
    throw new Error('Invalid artifact checksum.');
  if (!Number.isFinite(Date.parse(input.buildTimestamp)))
    throw new Error('Invalid build timestamp.');
  const workingTree = input.workingTree.trim().toLowerCase();
  if (!['clean', 'dirty', 'unknown'].includes(workingTree))
    throw new Error('Invalid working tree state.');
  if (input.environment === 'production' && workingTree !== 'clean')
    throw new Error('Production release evidence refuses a dirty working tree or unknown state.');

  const metadata = {
    schemaVersion: RELEASE_SCHEMA_VERSION,
    serviceName: SERVICE_NAME,
    serviceVersion: input.serviceVersion,
    applicationVersion: input.applicationVersion,
    releaseId: `rel-${identityDigest(input)}`,
    buildId: input.buildId,
    buildTimestamp: input.buildTimestamp,
    environment: input.environment,
    gitSha: input.gitSha.toLowerCase(),
    migrationHead: input.migrationHead,
    migrationHeadChecksum: input.migrationHeadChecksum.toLowerCase(),
    workingTree,
    dirty: workingTree !== 'clean',
  };
  if (input.artifactSha256) metadata.artifactSha256 = input.artifactSha256.toLowerCase();
  return metadata;
}

export function assertReleaseMetadataShape(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata))
    throw new Error('Release evidence must be a JSON object.');
  const required = [
    'schemaVersion',
    'serviceName',
    'serviceVersion',
    'applicationVersion',
    'releaseId',
    'buildId',
    'buildTimestamp',
    'environment',
    'gitSha',
    'migrationHead',
    'migrationHeadChecksum',
    'workingTree',
    'dirty',
  ];
  for (const field of required) {
    if (!(field in metadata)) throw new Error(`Release evidence is missing ${field}.`);
  }
  if (metadata.schemaVersion !== RELEASE_SCHEMA_VERSION || metadata.serviceName !== SERVICE_NAME)
    throw new Error('Unsupported release evidence schema or service name.');
  if (typeof metadata.dirty !== 'boolean' || metadata.dirty !== (metadata.workingTree !== 'clean'))
    throw new Error('Release evidence working-tree state is inconsistent.');
  if (metadata.environment === 'production' && metadata.workingTree !== 'clean')
    throw new Error('Production release evidence refuses a dirty working tree or unknown state.');
  createReleaseMetadata(metadata);
}

function valueAfter(args, flag) {
  const index = args.indexOf(flag);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value.`);
  return value;
}

export function parseArguments(args) {
  args = args.filter((arg) => arg !== '--');
  const known = new Set([
    '--environment',
    '--build-id',
    '--output',
    '--artifact',
    '--build-timestamp',
    '--service-version',
    '--migration-head',
    '--input',
  ]);
  const unknown = args.filter((arg) => arg.startsWith('--') && !known.has(arg));
  if (unknown.length) throw new Error(`Unknown option: ${unknown[0]}`);
  return {
    environment: valueAfter(args, '--environment'),
    buildId: valueAfter(args, '--build-id'),
    output: valueAfter(args, '--output') ?? defaultOutput,
    artifact: valueAfter(args, '--artifact'),
    buildTimestamp: valueAfter(args, '--build-timestamp'),
    serviceVersion: valueAfter(args, '--service-version'),
    migrationHead: valueAfter(args, '--migration-head'),
    input: valueAfter(args, '--input'),
  };
}

function inferredEnvironment(environment, env) {
  if (environment) return environment;
  if (env.RELEASE_ENVIRONMENT) return env.RELEASE_ENVIRONMENT;
  if (env.GITHUB_ACTIONS === 'true') return 'ci';
  if (env.NODE_ENV === 'production') return 'production';
  if (env.NODE_ENV === 'test') return 'test';
  return 'local';
}

function inferredBuildId(buildId, env, gitSha, environment) {
  if (buildId) return buildId;
  if (env.RELEASE_BUILD_ID) return env.RELEASE_BUILD_ID;
  if (env.GITHUB_RUN_ID) return `github-${env.GITHUB_RUN_ID}.${env.GITHUB_RUN_ATTEMPT ?? '1'}`;
  if (environment === 'production')
    throw new Error('RELEASE_BUILD_ID or --build-id is required for production evidence.');
  return `local-${gitSha.slice(0, 12)}`;
}

export async function collectReleaseMetadata(options = {}, env = process.env) {
  const packageJson = JSON.parse(await readFile(resolve(repositoryRoot, 'package.json'), 'utf8'));
  const gitSha = readGitSha();
  const migration = await readMigrationHead();
  const environment = inferredEnvironment(options.environment, env);
  const buildId = inferredBuildId(options.buildId, env, gitSha, environment);
  const artifactPath = options.artifact ? repositoryPath(options.artifact) : undefined;
  let artifactSha256;
  if (artifactPath)
    artifactSha256 = createHash('sha256')
      .update(await readFile(artifactPath))
      .digest('hex');
  const metadata = createReleaseMetadata({
    applicationVersion: packageJson.version,
    serviceVersion: options.serviceVersion ?? env.SERVICE_VERSION ?? packageJson.version,
    buildId,
    buildTimestamp:
      options.buildTimestamp ?? env.RELEASE_BUILD_TIMESTAMP ?? new Date().toISOString(),
    environment,
    gitSha,
    migrationHead: options.migrationHead ?? migration.name,
    migrationHeadChecksum: migration.checksum,
    workingTree: readWorkingTreeState(),
    artifactSha256,
  });
  if (artifactPath)
    metadata.artifact = { path: relative(repositoryRoot, artifactPath), sha256: artifactSha256 };
  return metadata;
}

export async function writeReleaseMetadata(metadata, output = defaultOutput) {
  const outputPath = resolve(repositoryRoot, output);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(metadata, null, 2)}\n`, 'utf8');
  return outputPath;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = parseArguments(process.argv.slice(2));
    const metadata = await collectReleaseMetadata(options);
    const outputPath = await writeReleaseMetadata(metadata, options.output);
    process.stdout.write(
      `${JSON.stringify({ ...metadata, evidenceFile: relative(repositoryRoot, outputPath) }, null, 2)}\n`,
    );
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : 'Unable to create release identity.'}\n`,
    );
    process.exitCode = 1;
  }
}
