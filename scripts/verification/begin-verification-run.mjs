import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { evidenceIdentity } from './evidence-identity.mjs';

const directory = resolve('.ci-results');
await mkdir(directory, { recursive: true });
const context = { runId: randomUUID(), candidate: await evidenceIdentity() };
await writeFile(resolve(directory, 'run-context.json'), `${JSON.stringify(context, null, 2)}\n`);
console.log(
  JSON.stringify({
    started: true,
    runId: context.runId,
    gitSha: context.candidate.gitSha,
    sourceFingerprint: context.candidate.sourceFingerprint,
  }),
);
