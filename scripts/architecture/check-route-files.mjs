/* global console, process */

import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { getRequiredRouteFiles } from '../../src/shared/routing/routes.ts';

const missingFiles = [];
for (const file of getRequiredRouteFiles()) {
  try {
    await access(file, constants.F_OK);
  } catch {
    missingFiles.push(file);
  }
}

if (missingFiles.length > 0) {
  console.error('Required canonical route files are missing:');
  for (const file of missingFiles) console.error(`- ${file}`);
  console.error(
    'Create each page only with its domain implementation; deferred and conditional routes are intentionally excluded.',
  );
  process.exitCode = 1;
} else {
  console.log('Canonical route file coverage passed.');
}
