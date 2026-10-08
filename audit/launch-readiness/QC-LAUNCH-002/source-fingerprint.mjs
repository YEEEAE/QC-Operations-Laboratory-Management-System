import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const run = (args, encoding) => {
  const result = spawnSync('git', args, { encoding });
  if (result.status !== 0) throw new Error(`git ${args.join(' ')} failed`);
  return result.stdout;
};

const hash = createHash('sha256');
hash.update(run(['diff', '--binary', 'HEAD'], null));
const untracked = run(['ls-files', '--others', '--exclude-standard', '-z'], 'utf8');
for (const path of untracked.split(String.fromCharCode(0)).filter(Boolean).sort()) {
  if (path.startsWith('.ci-results/') || path.startsWith('audit/launch-readiness/QC-LAUNCH-002/')) continue;
  hash.update(Buffer.from(path));
  hash.update(Buffer.from([0]));
  hash.update(readFileSync(path));
  hash.update(Buffer.from([0]));
}
process.stdout.write(`${hash.digest('hex')}\n`);
