import { getMigrationChecksumDisposition } from './migration-checksum-policy.js';

export interface MigrationIdentity {
  version: string;
  name: string;
  checksum: string;
}

export interface AppliedMigrationIdentity {
  version: string;
  name: string | null;
  checksum: string;
}

export type MigrationParityIssue =
  | 'SOURCE_DUPLICATE_VERSION'
  | 'SOURCE_SEQUENCE_GAP'
  | 'APPLIED_DUPLICATE_VERSION'
  | 'APPLIED_SEQUENCE_MISMATCH'
  | 'APPLIED_VERSION_UNKNOWN'
  | 'MIGRATION_NAME_MISMATCH'
  | 'CHECKSUM_MISMATCH';

export interface MigrationParity {
  appliedHead: string;
  sourceHead: string;
  pending: readonly string[];
  issues: readonly MigrationParityIssue[];
  integrityMismatches: readonly string[];
  checksumMismatches: readonly string[];
  knownLegacyChecksums: readonly string[];
  sourceAvailable: boolean;
}

/**
 * Compares an applied ledger with the ordered source inventory without
 * treating an out-of-order, duplicated, or incomplete ledger as current.
 * Known legacy checksums remain visible as compatibility facts, but are not
 * reported as unexplained checksum drift.
 */
export function reconcileMigrationParity(
  appliedRows: readonly AppliedMigrationIdentity[],
  sourceRows: readonly MigrationIdentity[] | undefined,
): MigrationParity {
  const issues = new Set<MigrationParityIssue>();
  const mismatches = new Set<string>();
  const checksumMismatches = new Set<string>();
  const knownLegacyChecksums = new Set<string>();
  const source = sourceRows === undefined ? undefined : [...sourceRows].sort(compareVersion);
  const applied = [...appliedRows].sort(compareVersion);

  if (source) {
    const sourceSeen = new Set<string>();
    source.forEach((entry, index) => {
      const expected = String(index + 1).padStart(4, '0');
      if (sourceSeen.has(entry.version)) issues.add('SOURCE_DUPLICATE_VERSION');
      sourceSeen.add(entry.version);
      if (entry.version !== expected) issues.add('SOURCE_SEQUENCE_GAP');
    });
  }

  const sourceByVersion = new Map<string, MigrationIdentity>();
  for (const entry of source ?? []) {
    if (!sourceByVersion.has(entry.version)) sourceByVersion.set(entry.version, entry);
  }

  const appliedSeen = new Set<string>();
  const appliedVersions = new Set<string>();
  applied.forEach((entry, index) => {
    if (appliedSeen.has(entry.version)) {
      issues.add('APPLIED_DUPLICATE_VERSION');
      mismatches.add(entry.version);
    }
    appliedSeen.add(entry.version);
    appliedVersions.add(entry.version);

    if (source === undefined) return;

    const expected = source[index];
    if (!expected || expected.version !== entry.version) {
      issues.add('APPLIED_SEQUENCE_MISMATCH');
      mismatches.add(entry.version);
    }

    const sourceEntry = sourceByVersion.get(entry.version);
    if (!sourceEntry) {
      issues.add('APPLIED_VERSION_UNKNOWN');
      mismatches.add(entry.version);
      return;
    }
    if (sourceEntry.name !== entry.name) {
      issues.add('MIGRATION_NAME_MISMATCH');
      mismatches.add(entry.version);
    }
    const checksumDisposition = getMigrationChecksumDisposition(
      entry.version,
      sourceEntry.checksum,
      entry.checksum,
    );
    if (checksumDisposition === 'UNKNOWN') {
      issues.add('CHECKSUM_MISMATCH');
      mismatches.add(entry.version);
      checksumMismatches.add(entry.version);
    } else if (checksumDisposition === 'KNOWN_LEGACY') {
      knownLegacyChecksums.add(entry.version);
    }
  });

  return {
    appliedHead: applied.at(-1)?.version ?? 'NONE',
    sourceHead: source?.at(-1)?.version ?? (source === undefined ? 'UNKNOWN' : 'NONE'),
    pending: (source ?? []).filter((entry) => !appliedVersions.has(entry.version)).map((entry) => entry.version),
    issues: [...issues],
    integrityMismatches: [...mismatches].sort(),
    checksumMismatches: [...checksumMismatches].sort(),
    knownLegacyChecksums: [...knownLegacyChecksums].sort(),
    sourceAvailable: source !== undefined,
  };
}

function compareVersion(left: { version: string }, right: { version: string }): number {
  return left.version.localeCompare(right.version);
}
