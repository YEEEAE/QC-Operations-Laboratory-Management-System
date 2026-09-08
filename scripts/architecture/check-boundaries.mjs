/* global console, process */

import { access, readdir, readFile } from 'node:fs/promises';
import { isAbsolute, join, relative } from 'node:path';

const repositoryRoot = process.cwd();
const envRoots = process.env.QC_ARCH_DELIVERY_ROOTS;
const deliveryRoots = envRoots
  ? envRoots.split(':').filter(Boolean)
  : ['src/pages', 'src/actions', 'src/ui', 'src/middleware.ts'];
const violations = [];

/**
 * Narrow allowlist for architecturally necessary Delivery exceptions.
 *
 * Each entry must reference an explicit architecture-spec decision and is
 * matched against `file:rule`. The list is intentionally empty: after
 * QC-100-CLOSURE-02 all Delivery composition goes through approved
 * application `*Dependencies()` factories, so no direct
 * Delivery → DB/infrastructure import is permitted. Do not add entries here
 * to hide a violation — document the spec decision first.
 */
const allowlist = [];

const prohibitedPatterns = [
  {
    rule: 'delivery-getDatabase-usage',
    pattern: /\bgetDatabase\b/,
  },
  {
    rule: 'delivery-database-import',
    pattern: /from\s+['"][^'"]*\/(?:database|db)\/[^'"]*['"]/,
  },
  {
    rule: 'delivery-kysely-pg-import',
    pattern: /from\s+['"][^'"]*(?:kysely|\bpg\b)[^'"]*['"]/,
  },
  {
    rule: 'delivery-kysely-pg-usage',
    pattern: /\b(?:Kysely|DatabaseSchema)\b|\bnew\s+(?:Pool|Client)\s*\(/,
  },
  {
    rule: 'delivery-infrastructure-import',
    pattern: /from\s+['"][^'"]*\/infrastructure(\/[^'"]*)?['"]/,
  },
  {
    rule: 'delivery-postgres-implementation',
    pattern: /\bPostgres[A-Za-z]*\b/,
  },
  {
    rule: 'delivery-repository-construction',
    pattern: /\bnew\s+[A-Za-z]*Repository\s*\(/,
  },
  {
    rule: 'delivery-transaction-object',
    pattern: /\b(?:database|db)\s*\.\s*transaction\s*\(\s*\)|\bTransaction\b\s*<|\bKysely\s*</,
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
      /\bsql\s*`|\b(?:SELECT|INSERT|UPDATE|DELETE|ALTER|CREATE|DROP)\s+(?:FROM|INTO|TABLE|DATABASE|INDEX)\b/,
  },
];

function isAllowed(file, rule) {
  return allowlist.some((entry) => entry.file === file && entry.rule === rule);
}

async function filesAt(path) {
  const absolutePath = isAbsolute(path) ? path : join(repositoryRoot, path);
  const entries = await readdir(absolutePath, { withFileTypes: true }).catch(() => []);
  return (
    await Promise.all(
      entries.map(async (entry) => {
        const entryPath = isAbsolute(path) ? join(path, entry.name) : join(path, entry.name);
        return entry.isDirectory() ? filesAt(entryPath) : [entryPath];
      }),
    )
  ).flat();
}

const candidates = [];
for (const root of deliveryRoots) {
  const absoluteRoot = isAbsolute(root) ? root : join(repositoryRoot, root);
  if (root.endsWith('.ts')) {
    try {
      await access(absoluteRoot);
      candidates.push(root);
    } catch {
      // Middleware is optional until its authenticated-context implementation exists.
    }
  } else candidates.push(...(await filesAt(root)));
}

for (const file of candidates.filter((candidate) => /\.(?:astro|[cm]?[jt]sx?)$/.test(candidate))) {
  const absoluteFile = isAbsolute(file) ? file : join(repositoryRoot, file);
  const content = await readFile(absoluteFile, 'utf8');
  const relativeFile = isAbsolute(file)
    ? relative(repositoryRoot, absoluteFile)
    : relative(repositoryRoot, join(repositoryRoot, file));
  for (const { rule, pattern } of prohibitedPatterns) {
    const match = content.match(pattern);
    if (!match || match.index === undefined) continue;
    if (isAllowed(relativeFile, rule)) continue;
    const line = content.slice(0, match.index).split('\n').length;
    violations.push(`${relativeFile}:${line} ${rule}: ${match[0]}`);
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
