import { runSeed } from './common.js';

runSeed('test').catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Test seed failed.');
  process.exitCode = 1;
});
