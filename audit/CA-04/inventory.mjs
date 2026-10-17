import { readFileSync, existsSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname, relative } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import ts from 'typescript';

// Static import inventory, not a claim that every conditional component renders.
const root = process.cwd();
const sha = (value) => createHash('sha256').update(value).digest('hex');
const registry = JSON.parse(readFileSync('audit/CA-01/route-register.json', 'utf8'));
const pageFiles = readdirSync('src/pages', { recursive: true }).filter((file) => file.endsWith('.astro')).map((file) => `src/pages/${file}`).sort();
if (JSON.stringify(pageFiles) !== JSON.stringify(registry.routes.map((row) => row.file).sort())) {
  throw new Error('Current page files differ from CA-01; reconcile the route register before claiming inventory coverage.');
}
const targets = ['PageHeader', 'RecordHeader', 'JourneyContextPanel', 'StatusBadge',
  'PolicyBlocker', 'ProviderUnavailableState', 'FormErrorSummary', 'FilterBar',
  'AppliedFilters', 'DataTable', 'Pagination', 'ConfirmDialog',
  'ControlledInspectionForm', 'TemplateDesigner'];
const cache = new Map();
function imports(file) {
  if (cache.has(file)) return cache.get(file);
  const text = readFileSync(file, 'utf8');
  const blocks = file.endsWith('.astro') ? [
    { context: 'frontmatter', input: text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '' },
    ...[...text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((match) => ({ context: 'client-script', input: match[1] })),
  ] : [{ context: 'module', input: text }];
  const entries = blocks.flatMap(({ context, input }) => {
    const source = ts.createSourceFile(file, input, ts.ScriptTarget.Latest, true);
    return source.statements.filter(ts.isImportDeclaration).map((node) => {
    const specifier = node.moduleSpecifier.text;
    let local = null;
    if (specifier.startsWith('.')) {
      const stem = resolve(dirname(file), specifier);
      local = [stem, stem.replace(/\.js$/, '.ts'), `${stem}.ts`, `${stem}/index.ts`]
        .find((candidate) => existsSync(candidate) && !readdirSafe(candidate));
    }
    return { specifier, context, binding: node.importClause?.getText(source) ?? null,
      resolved: local ? relative(root, local) : null };
    });
  });
  const entry = { sha256: sha(text), imports: entries };
  cache.set(file, entry);
  return entry;
}
function readdirSafe(path) { try { readdirSync(path); return true; } catch { return false; } }
function closure(file, seen = new Set()) {
  if (seen.has(file)) return seen;
  seen.add(file);
  for (const item of imports(file).imports) {
    if (item.resolved && /\.(astro|ts|tsx|js|mjs)$/.test(item.resolved)) closure(item.resolved, seen);
  }
  return seen;
}
const routes = registry.routes.filter((row) => row.kind === 'screen').map((row) => {
  const direct = imports(row.file);
  const reachable = [...closure(row.file)];
  const primitives = Object.fromEntries(targets.map((name) => [name,
    reachable.filter((file) => file.endsWith(`/${name}.astro`))]));
  return { route: row.route, file: row.file, sha256: direct.sha256, imports: direct.imports,
    primitives, runtime: 'NOT RUN', guardReference: 'audit/CA-03/state-contracts.md' };
});
const primitives = Object.fromEntries(targets.map((name) => [name, {
  files: [...new Set(routes.flatMap((row) => row.primitives[name]))],
  directConsumers: routes.filter((row) => row.imports.some((item) => item.resolved?.endsWith(`/${name}.astro`))).map((row) => row.route),
  transitiveConsumers: routes.filter((row) => row.primitives[name].length).map((row) => row.route),
} ]));
const output = { task: 'CA-04', head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  note: 'Static import graph only. TS import declarations in Astro frontmatter, inline client scripts and local modules; excludes dynamic import expressions and runtime rendering. Guards are documented separately, not inferred from HTTP status.',
  screenCount: routes.length, excludedRedirects: registry.routes.filter((row) => row.kind === 'redirect').map((row) => row.route),
  primitives, routes };
writeFileSync('audit/CA-04/import-inventory.json', JSON.stringify(output, null, 2) + '\n');
console.log(JSON.stringify({ screens: routes.length, primitives: Object.fromEntries(Object.entries(primitives).map(([name, value]) => [name, value.transitiveConsumers.length])) }, null, 2));
