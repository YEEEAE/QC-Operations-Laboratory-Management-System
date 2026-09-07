import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  assertReleaseMetadataShape,
  collectReleaseMetadata,
  parseArguments,
} from './release-id.mjs';

export async function readReleaseEvidence(inputPath) {
  const path = resolve(inputPath);
  const metadata = JSON.parse(await readFile(path, 'utf8'));
  assertReleaseMetadataShape(metadata);
  return metadata;
}

export async function verifyReleaseEvidence(metadata, options = {}) {
  const environment = options.environment ?? metadata.environment;
  const buildId = options.buildId ?? metadata.buildId;
  const artifact = options.artifact ?? metadata.artifact?.path;
  const expected = await collectReleaseMetadata(
    {
      environment,
      buildId,
      buildTimestamp: metadata.buildTimestamp,
      serviceVersion: metadata.serviceVersion,
      artifact,
    },
    options.env,
  );

  const fields = [
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
    'artifactSha256',
  ];
  for (const field of fields) {
    if ((metadata[field] ?? undefined) !== (expected[field] ?? undefined)) {
      throw new Error(
        `Release evidence ${field} mismatch: expected ${String(expected[field])}, actual ${String(metadata[field])}.`,
      );
    }
  }
  return { verified: true, releaseId: metadata.releaseId, gitSha: metadata.gitSha };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = parseArguments(process.argv.slice(2));
    const input = args.input ?? args.output;
    if (!input) throw new Error('--input is required.');
    const metadata = await readReleaseEvidence(input);
    const result = await verifyReleaseEvidence(metadata, args);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(
      `${error instanceof Error ? error.message : 'Unable to verify release evidence.'}\n`,
    );
    process.exitCode = 1;
  }
}
