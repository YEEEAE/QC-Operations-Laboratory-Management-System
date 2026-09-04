import { runSeed } from './common.js';

runSeed('development').catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Development seed failed.');
  process.exitCode = 1;
});
