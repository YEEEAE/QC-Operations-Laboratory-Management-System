import { fileURLToPath } from 'node:url';
import { validateRestoredDatabase } from './validate-restored-database.js';
import { validateRestoredFiles } from './validate-restored-files.js';
import { readRecoveryManifest } from './verify-recovery-manifest.js';

export type RecoveryChecklistStatus = 'PASS' | 'FAIL' | 'BLOCKED' | 'UNVERIFIED';

export interface RecoveryChecklistItem {
  id: string;
  status: RecoveryChecklistStatus;
  evidence: string;
  failures?: readonly string[];
}

export interface RecoveryChecklistReport {
  provider: 'render';
  backupSetId: string;
  overall: 'RESTORE_NOT_VERIFIED' | 'RESTORE_VERIFICATION_FAILED';
  items: readonly RecoveryChecklistItem[];
  nextAction: string;
}

const blocked = (id: string, evidence: string): RecoveryChecklistItem => ({
  id,
  status: 'BLOCKED',
  evidence,
});

/**
 * Runs only evidence checks that are safe to execute from the application
 * repository. It never creates a backup, calls a provider API, restores a
 * database, mutates a target, or turns an operator assertion into proof.
 */
export async function runRecoveryChecklist(input: {
  manifestPath: string;
  databaseUrl?: string;
  objectRoot?: string;
}): Promise<RecoveryChecklistReport> {
  const manifest = await readRecoveryManifest(input.manifestPath);
  const items: RecoveryChecklistItem[] = [
    {
      id: 'manifest-schema',
      status: 'PASS',
      evidence:
        'Manifest schema and SHA-256 fields validated; restore status remains NOT_VERIFIED.',
    },
    blocked(
      'render-physical-restore',
      'BLOCKED: Render/provider restore execution and provider evidence are outside this repository. Follow docs/operations/RESTORE-DRILL-RUNBOOK.md and record the provider reference.',
    ),
  ];

  if (input.databaseUrl) {
    const report = await validateRestoredDatabase(manifest, input.databaseUrl);
    items.push({
      id: 'restored-database',
      status: report.status,
      evidence:
        'Read-only PostgreSQL validation executed against the supplied isolated target; no migrations or writes were performed.',
      failures: report.failures,
    });
  } else {
    items.push(
      blocked(
        'restored-database',
        'UNVERIFIED: supply --database-url for an isolated restored PostgreSQL target; DATABASE_URL is never printed.',
      ),
    );
  }

  if (input.objectRoot) {
    const report = await validateRestoredFiles(manifest, input.objectRoot);
    items.push({
      id: 'restored-file-objects',
      status: report.status,
      evidence: `File metadata and SHA-256 validation executed for ${report.checked} manifest object(s).`,
      failures: report.failures,
    });
  } else {
    items.push(
      blocked(
        'restored-file-objects',
        'UNVERIFIED: supply --object-root for an isolated object-store recovery mount; no object is copied or modified.',
      ),
    );
  }

  items.push(
    blocked(
      'application-compatibility',
      `BLOCKED: operator must run the exact release ${manifest.appContext.releaseId} (${manifest.appContext.gitCommitSha}) against the isolated target and attach health/read-only compatibility evidence.`,
    ),
    blocked(
      'authorization-enforcement',
      'BLOCKED: operator must execute positive and negative server-side authorization checks, including scope denial, with no UI-only evidence.',
    ),
    blocked(
      'session-behavior',
      'BLOCKED: operator must record session invalidation/re-authentication behavior after recovery; no session is changed by this checklist.',
    ),
    blocked(
      'secret-exposure',
      'BLOCKED: operator must inspect logs, environment wiring, and recovery artifacts for secret exposure without placing secret values in the evidence record.',
    ),
  );

  const hasFailure = items.some((item) => item.status === 'FAIL');
  return {
    provider: 'render',
    backupSetId: manifest.backupSetId,
    overall: hasFailure ? 'RESTORE_VERIFICATION_FAILED' : 'RESTORE_NOT_VERIFIED',
    items,
    nextAction:
      'Do not mark RESTORE VERIFIED. Complete the provider restore and all manual evidence gates in the DR evidence template, then create a new evidence record.',
  };
}

async function main(): Promise<void> {
  const manifestPath = process.argv[process.argv.indexOf('--manifest') + 1];
  const databaseUrl = process.argv.includes('--database-url')
    ? process.argv[process.argv.indexOf('--database-url') + 1]
    : undefined;
  const objectRoot = process.argv.includes('--object-root')
    ? process.argv[process.argv.indexOf('--object-root') + 1]
    : undefined;
  if (!manifestPath) {
    console.error(
      'Usage: run-recovery-checklist.ts --manifest <path> [--database-url <url>] [--object-root <path>]',
    );
    process.exitCode = 2;
    return;
  }
  const report = await runRecoveryChecklist({ manifestPath, databaseUrl, objectRoot });
  console.log(JSON.stringify(report, null, 2));
  if (report.items.some((item) => item.status !== 'PASS')) process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Recovery checklist failed.');
    process.exitCode = 1;
  });
}
