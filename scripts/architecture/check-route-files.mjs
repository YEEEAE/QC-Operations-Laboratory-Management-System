/* global console, process */

import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { getRequiredRouteFiles, routes } from '../../src/shared/routing/routes.ts';
import { validateRouteIntegrity } from '../../src/shared/routing/route-integrity.ts';
import { navigationRouteIds } from '../../src/ui/navigation/navigation.ts';

const frameworkPageFiles = new Set(['src/pages/404.astro', 'src/pages/500.astro']);
async function collectPageFiles(directory = 'src/pages') {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map(async (entry) => {
        const path = `${directory}/${entry.name}`;
        return entry.isDirectory()
          ? collectPageFiles(path)
          : entry.name.endsWith('.astro')
            ? [path]
            : [];
      }),
    )
  ).flat();
}

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
  const pageFiles = (await collectPageFiles()).filter((file) => !frameworkPageFiles.has(file));
  const errors = validateRouteIntegrity({ routes, pageFiles, navigationRouteIds });
  if (errors.length > 0) {
    console.error('Route registry integrity violations:');
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else console.log('Canonical route file coverage and registry integrity passed.');
}
