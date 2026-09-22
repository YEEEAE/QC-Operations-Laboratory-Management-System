import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { verificationRun } from './evidence-identity.mjs';
import { hashFileTree } from '../release/build-manifest.mjs';

await mkdir('.ci-results', { recursive: true });
const manifest = await hashFileTree(resolve('dist'));
await writeFile(
  resolve('.ci-results/build-manifest.json'),
  `${JSON.stringify(manifest, null, 2)}\n`,
);
const entry = await readFile(resolve('dist/server/entry.mjs'));
const evidence = {
  schemaVersion: 2,
  suite: 'build',
  ...(await verificationRun()),
  artifactDigest: manifest.digest,
  entryArtifactDigest: createHash('sha256').update(entry).digest('hex'),
  totals: { total: 1, passed: 1, failed: 0, skipped: 0 },
};
await writeFile(resolve('.ci-results/build.json'), `${JSON.stringify(evidence, null, 2)}\n`);
