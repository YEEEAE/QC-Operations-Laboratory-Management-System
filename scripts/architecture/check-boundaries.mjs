/* global console, process */

import { access, readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const repositoryRoot = process.cwd();
const deliveryRoots = ['src/pages', 'src/actions', 'src/ui', 'src/middleware.ts'];
const violations = [];

const prohibitedPatterns = [
  {
    rule: 'delivery-database-import',
    pattern: /from\s+['"][^'"]*(?:\/database\/|\/db\/|kysely|pg)['"]/,
  },
  {
    rule: 'delivery-domain-import',
    pattern: /from\s+['"][^'"]*\/modules\/[^'"]*\/domain(?:\/|['"])/,
  },
  {
    rule: 'delivery-business-rules-import',
    pattern: /from\s+['"][^'"]*(?:business-rules|state-machine)(?:\/|['"])/,
  },
  {
    rule: 'delivery-raw-sql',
    pattern:
      /\b(?:SELECT|INSERT|UPDATE|DELETE|ALTER|CREATE|DROP)\s+(?:FROM|INTO|TABLE|DATABASE|INDEX)\b/i,
  },
];

async function filesAt(path) {
  const absolutePath = join(repositoryRoot, path);
  const entries = await readdir(absolutePath, { withFileTypes: true }).catch(() => []);
  return (
    await Promise.all(
      entries.map(async (entry) => {
        const entryPath = join(path, entry.name);
        return entry.isDirectory() ? filesAt(entryPath) : [entryPath];
      }),
    )
  ).flat();
}

const candidates = [];
for (const root of deliveryRoots) {
  if (root.endsWith('.ts')) {
    try {
      await access(join(repositoryRoot, root));
      candidates.push(root);
    } catch {
      // Middleware is optional until its authenticated-context implementation exists.
    }
  } else candidates.push(...(await filesAt(root)));
}

for (const file of candidates.filter((candidate) => /\.(?:astro|[cm]?[jt]sx?)$/.test(candidate))) {
  const content = await readFile(join(repositoryRoot, file), 'utf8');
  for (const { rule, pattern } of prohibitedPatterns) {
    const match = content.match(pattern);
    if (!match || match.index === undefined) continue;
    const line = content.slice(0, match.index).split('\n').length;
    violations.push(
      `${relative(repositoryRoot, join(repositoryRoot, file))}:${line} ${rule}: ${match[0]}`,
    );
  }
}

if (violations.length > 0) {
  console.error('Architecture boundary violations found:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exitCode = 1;
} else {
  console.log(
    'Architecture boundary check passed: no Delivery → database/domain/business-rule violations found.',
  );
}
