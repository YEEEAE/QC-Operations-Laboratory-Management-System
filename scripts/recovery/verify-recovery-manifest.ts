import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export type RecoveryVerificationStatus = 'NOT_VERIFIED' | 'VERIFIED' | 'VERIFICATION_FAILED';
export type BackupArtifactIntegrityStatus = 'NOT_VERIFIED' | 'VERIFIED' | 'VERIFICATION_FAILED';

export interface MigrationLedgerEntry {
  version: string;
  name: string;
  checksum: string;
}

export interface RecoveryFileObject {
  fileId?: string;
  storageProvider?: string;
  storageKey: string;
  sha256: string;
  sizeBytes: number;
  detachedArtifactReference?: string;
}

export interface ControlledDocumentVersionSnapshot {
  documentId: string;
  documentNo: string;
  documentType: string;
  versionId: string;
  revision: string;
  state: string;
  contentHash: string;
  fileIds: string[];
}

export interface RecoveryManifest {
  manifestVersion: 1 | 2;
  manifestSha256?: string;
  backupSetId: string;
  environment: 'local' | 'test' | 'staging' | 'production';
  createdAt: string;
  backupJobResult: 'SUCCEEDED' | 'CREATED' | 'ARTIFACT_VERIFIED' | 'FAILED' | 'UNKNOWN';
  artifactIntegrityStatus: BackupArtifactIntegrityStatus;
  restoreVerificationStatus: RecoveryVerificationStatus;
  database: {
    restoreReference: string;
    postgresqlVersion: string;
    schemaChecksum?: string;
    migrationLedger: MigrationLedgerEntry[];
    coreRelations: string[];
    historyRelations: string[];
    pitr?: { provider: string; target: string };
  };
  fileStoreIdentity?: string;
  fileObjects: RecoveryFileObject[];
  controlledDocumentVersions: ControlledDocumentVersionSnapshot[];
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
    throw new Error(`Manifest ${name} must be a string list.`);
  return value;
};

export function validateRecoveryManifest(value: unknown): RecoveryManifest {
  if (!isRecord(value) || ![1, 2].includes(Number(value.manifestVersion)))
    throw new Error('Manifest version 1 or 2 is required.');
  const manifestVersion = Number(value.manifestVersion) as RecoveryManifest['manifestVersion'];
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
    const file: RecoveryFileObject = {
      storageKey: text(entry.storageKey, `fileObjects[${index}].storageKey`),
      sha256: sha(entry.sha256, `fileObjects[${index}].sha256`),
      sizeBytes: entry.sizeBytes,
    };
    if (entry.fileId !== undefined) file.fileId = text(entry.fileId, `fileObjects[${index}].fileId`);
    if (entry.storageProvider !== undefined)
      file.storageProvider = text(entry.storageProvider, `fileObjects[${index}].storageProvider`);
    if (entry.detachedArtifactReference !== undefined)
      file.detachedArtifactReference = text(entry.detachedArtifactReference, `fileObjects[${index}].detachedArtifactReference`);
    return file;
  });
  const environment = value.environment;
  if (!['local', 'test', 'staging', 'production'].includes(String(environment)))
    throw new Error('Manifest environment is invalid.');
  if (!['SUCCEEDED', 'CREATED', 'ARTIFACT_VERIFIED', 'FAILED', 'UNKNOWN'].includes(String(value.backupJobResult)))
    throw new Error('Manifest backupJobResult is invalid.');
  if (typeof value.restoreVerificationStatus !== 'string')
    throw new Error('Manifest restoreVerificationStatus is required.');
  const migrationHead = text(appContext.migrationHead, 'appContext.migrationHead');
  if (
    !migrationLedger.some(
      (entry) => entry.version === migrationHead || entry.name === migrationHead,
    )
  )
    throw new Error('Manifest appContext.migrationHead is not in the migration ledger.');
  const artifactIntegrityStatus = value.artifactIntegrityStatus ?? 'NOT_VERIFIED';
  if (!['NOT_VERIFIED', 'VERIFIED', 'VERIFICATION_FAILED'].includes(String(artifactIntegrityStatus)))
    throw new Error('Manifest artifactIntegrityStatus is invalid.');
  const schemaChecksum = database.schemaChecksum === undefined
    ? undefined
    : sha(database.schemaChecksum, 'database.schemaChecksum');
  const controlledDocumentVersions = value.controlledDocumentVersions === undefined
    ? []
    : Array.isArray(value.controlledDocumentVersions)
      ? value.controlledDocumentVersions.map((entry, index) => {
          if (!isRecord(entry) || !Array.isArray(entry.fileIds))
            throw new Error(`Manifest controlledDocumentVersions[${index}] is invalid.`);
          return {
            documentId: text(entry.documentId, `controlledDocumentVersions[${index}].documentId`),
            documentNo: text(entry.documentNo, `controlledDocumentVersions[${index}].documentNo`),
            documentType: text(entry.documentType, `controlledDocumentVersions[${index}].documentType`),
            versionId: text(entry.versionId, `controlledDocumentVersions[${index}].versionId`),
            revision: text(entry.revision, `controlledDocumentVersions[${index}].revision`),
            state: text(entry.state, `controlledDocumentVersions[${index}].state`),
            contentHash: sha(entry.contentHash, `controlledDocumentVersions[${index}].contentHash`),
            fileIds: entry.fileIds.map((fileId, fileIndex) => text(fileId, `controlledDocumentVersions[${index}].fileIds[${fileIndex}]`)),
          };
        })
      : (() => { throw new Error('Manifest controlledDocumentVersions must be an array.'); })();
  if (manifestVersion === 2) {
    if (artifactIntegrityStatus === 'NOT_VERIFIED')
      throw new Error('Manifest version 2 requires an explicit artifact integrity outcome.');
    if (!schemaChecksum) throw new Error('Manifest version 2 requires database.schemaChecksum.');
    const suppliedManifestSha = sha(value.manifestSha256, 'manifestSha256');
    const canonicalManifest = { ...value };
    delete canonicalManifest.manifestSha256;
    if (createHash('sha256').update(JSON.stringify(canonicalManifest)).digest('hex') !== suppliedManifestSha)
      throw new Error('Manifest version 2 checksum mismatch.');
    if (
      value.backupJobResult === 'ARTIFACT_VERIFIED' && artifactIntegrityStatus !== 'VERIFIED'
    )
      throw new Error('Manifest artifact verification state is inconsistent.');
  }
  const gitCommitSha = text(appContext.gitCommitSha, 'appContext.gitCommitSha');
  if (!/^[0-9a-f]{40}$/i.test(gitCommitSha))
    throw new Error('Manifest appContext.gitCommitSha must be a full Git SHA.');
  return {
    manifestVersion,
    ...(typeof value.manifestSha256 === 'string' ? { manifestSha256: value.manifestSha256 } : {}),
    backupSetId: text(value.backupSetId, 'backupSetId'),
    environment: environment as RecoveryManifest['environment'],
    createdAt: text(value.createdAt, 'createdAt'),
    backupJobResult: value.backupJobResult as RecoveryManifest['backupJobResult'],
    artifactIntegrityStatus: artifactIntegrityStatus as BackupArtifactIntegrityStatus,
    restoreVerificationStatus: 'NOT_VERIFIED',
    database: {
      restoreReference: text(database.restoreReference, 'database.restoreReference'),
      postgresqlVersion: text(database.postgresqlVersion, 'database.postgresqlVersion'),
      ...(schemaChecksum ? { schemaChecksum } : {}),
      migrationLedger,
      coreRelations: stringList(database.coreRelations, 'database.coreRelations'),
      historyRelations: stringList(database.historyRelations, 'database.historyRelations'),
    },
    ...(typeof value.fileStoreIdentity === 'string' ? { fileStoreIdentity: value.fileStoreIdentity } : {}),
    fileObjects,
    controlledDocumentVersions,
    appContext: {
      gitCommitSha,
      releaseId: text(appContext.releaseId, 'appContext.releaseId'),
      migrationHead,
    },
    knownGaps:
      [
        ...(Array.isArray(value.knownGaps) && value.knownGaps.every((gap) => typeof gap === 'string')
          ? value.knownGaps
          : []),
        ...(manifestVersion === 1 ? ['LEGACY_MANIFEST_HAS_NO_REQUIRED_FILE_STORE_OR_SCHEMA_IDENTITY'] : []),
        ...(manifestVersion === 2 && !value.fileStoreIdentity ? ['FILE_STORE_IDENTITY_NOT_CAPTURED'] : []),
        ...(fileObjects.some((file) => !file.detachedArtifactReference)
          ? ['DETACHED_FILE_ARTIFACT_REFERENCE_MISSING']
          : []),
        ...(Array.isArray(database.coreRelations) && database.coreRelations.length === 0
          ? ['CORE_RELATION_SET_NOT_CAPTURED']
          : []),
      ],
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
            status: 'SCHEMA_VALIDATED_ONLY',
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
