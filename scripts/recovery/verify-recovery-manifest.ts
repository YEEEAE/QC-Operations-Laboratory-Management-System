import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export type RecoveryVerificationStatus = 'NOT_VERIFIED' | 'VERIFIED' | 'VERIFICATION_FAILED';

export interface MigrationLedgerEntry {
  version: string;
  name: string;
  checksum: string;
}

export interface RecoveryFileObject {
  storageKey: string;
  sha256: string;
  sizeBytes: number;
}

export interface RecoveryManifest {
  manifestVersion: 1;
  backupSetId: string;
  environment: 'local' | 'test' | 'staging' | 'production';
  createdAt: string;
  backupJobResult: 'SUCCEEDED' | 'FAILED' | 'UNKNOWN';
  restoreVerificationStatus: RecoveryVerificationStatus;
  database: {
    restoreReference: string;
    postgresqlVersion: string;
    migrationLedger: MigrationLedgerEntry[];
    coreRelations: string[];
    historyRelations: string[];
    pitr?: { provider: string; target: string };
  };
  fileObjects: RecoveryFileObject[];
  appContext: {
    gitCommitSha: string;
    releaseId: string;
    migrationHead: string;
  };
  knownGaps: string[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const text = (value: unknown, name: string): string => {
  if (typeof value !== 'string' || value.trim() === '')
    throw new Error(`Manifest ${name} is required.`);
  return value;
};

const sha = (value: unknown, name: string): string => {
  const result = text(value, name);
  if (!/^[0-9a-f]{64}$/i.test(result))
    throw new Error(`Manifest ${name} must be a SHA-256 hex digest.`);
  return result.toLowerCase();
};

const stringList = (value: unknown, name: string): string[] => {
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string' || item.trim() === ''))
    throw new Error(`Manifest ${name} must be a non-empty string list.`);
  return value;
};

export function validateRecoveryManifest(value: unknown): RecoveryManifest {
  if (!isRecord(value) || value.manifestVersion !== 1)
    throw new Error('Manifest version 1 is required.');
  const database = value.database;
  const appContext = value.appContext;
  if (!isRecord(database) || !isRecord(appContext) || !Array.isArray(value.fileObjects))
    throw new Error('Manifest database, file, and application context are required.');
  if (database.pitr !== undefined)
    throw new Error(
      'Provider PITR remains blocked until an approved hosting/provider choice exists.',
    );
  if (value.restoreVerificationStatus !== 'NOT_VERIFIED')
    throw new Error('A manifest cannot claim restore verification without post-restore evidence.');
  const ledger = database.migrationLedger;
  if (!Array.isArray(ledger) || ledger.length === 0)
    throw new Error('Manifest migration ledger is required.');
  const migrationLedger = ledger.map((entry, index) => {
    if (!isRecord(entry)) throw new Error(`Manifest migration ledger entry ${index} is invalid.`);
    return {
      version: text(entry.version, `migrationLedger[${index}].version`),
      name: text(entry.name, `migrationLedger[${index}].name`),
      checksum: sha(entry.checksum, `migrationLedger[${index}].checksum`),
    };
  });
  const fileObjects = value.fileObjects.map((entry, index) => {
    if (!isRecord(entry)) throw new Error(`Manifest file object ${index} is invalid.`);
    if (
      typeof entry.sizeBytes !== 'number' ||
      !Number.isSafeInteger(entry.sizeBytes) ||
      entry.sizeBytes < 0
    )
      throw new Error(
        `Manifest fileObjects[${index}].sizeBytes must be a non-negative safe integer.`,
      );
    return {
      storageKey: text(entry.storageKey, `fileObjects[${index}].storageKey`),
      sha256: sha(entry.sha256, `fileObjects[${index}].sha256`),
      sizeBytes: entry.sizeBytes,
    };
  });
  const environment = value.environment;
  if (!['local', 'test', 'staging', 'production'].includes(String(environment)))
    throw new Error('Manifest environment is invalid.');
  if (!['SUCCEEDED', 'FAILED', 'UNKNOWN'].includes(String(value.backupJobResult)))
    throw new Error('Manifest backupJobResult is invalid.');
  if (typeof value.restoreVerificationStatus !== 'string')
    throw new Error('Manifest restoreVerificationStatus is required.');
  const migrationHead = text(appContext.migrationHead, 'appContext.migrationHead');
  if (!migrationLedger.some((entry) => entry.version === migrationHead))
    throw new Error('Manifest appContext.migrationHead is not in the migration ledger.');
  return {
    manifestVersion: 1,
    backupSetId: text(value.backupSetId, 'backupSetId'),
    environment: environment as RecoveryManifest['environment'],
    createdAt: text(value.createdAt, 'createdAt'),
    backupJobResult: value.backupJobResult as RecoveryManifest['backupJobResult'],
    restoreVerificationStatus: 'NOT_VERIFIED',
    database: {
      restoreReference: text(database.restoreReference, 'database.restoreReference'),
      postgresqlVersion: text(database.postgresqlVersion, 'database.postgresqlVersion'),
      migrationLedger,
      coreRelations: stringList(database.coreRelations, 'database.coreRelations'),
      historyRelations: stringList(database.historyRelations, 'database.historyRelations'),
    },
    fileObjects,
    appContext: {
      gitCommitSha: text(appContext.gitCommitSha, 'appContext.gitCommitSha'),
      releaseId: text(appContext.releaseId, 'appContext.releaseId'),
      migrationHead,
    },
    knownGaps:
      Array.isArray(value.knownGaps) && value.knownGaps.every((gap) => typeof gap === 'string')
        ? value.knownGaps
        : [],
  };
}

export function parseRecoveryManifest(json: string): RecoveryManifest {
  try {
    return validateRecoveryManifest(JSON.parse(json) as unknown);
  } catch (error) {
    if (error instanceof SyntaxError)
      throw new Error('Recovery manifest is not valid JSON.', { cause: error });
    throw error;
  }
}

export async function readRecoveryManifest(path: string): Promise<RecoveryManifest> {
  return parseRecoveryManifest(await readFile(path, 'utf8'));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const path = process.argv[process.argv.indexOf('--manifest') + 1];
  if (!path) {
    console.error('Usage: verify-recovery-manifest.ts --manifest <path>');
    process.exitCode = 2;
  } else {
    readRecoveryManifest(path)
      .then((manifest) =>
        console.log(
          JSON.stringify({
            status: 'PASS',
            backupSetId: manifest.backupSetId,
            restoreVerificationStatus: manifest.restoreVerificationStatus,
          }),
        ),
      )
      .catch((error: unknown) => {
        console.error(
          error instanceof Error ? error.message : 'Recovery manifest validation failed.',
        );
        process.exitCode = 1;
      });
  }
}
