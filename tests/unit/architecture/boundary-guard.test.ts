import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const guard = resolve(process.cwd(), 'scripts/architecture/check-boundaries.mjs');

function runGuardAgainst(
  source: string,
  filename = 'page.astro',
): {
  exitCode: number;
  output: string;
} {
  const root = mkdtempSync(join(tmpdir(), 'qc-arch-'));
  mkdirSync(join(root, 'delivery'), { recursive: true });
  writeFileSync(join(root, 'delivery', filename), source);
  try {
    const output = execFileSync('node', [guard], {
      cwd: process.cwd(),
      env: { ...process.env, QC_ARCH_DELIVERY_ROOTS: join(root, 'delivery') },
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { exitCode: 0, output: String(output) };
  } catch (error) {
    const err = error as { status?: number; stdout?: string; stderr?: string };
    return {
      exitCode: err.status ?? 1,
      output: String(err.stdout ?? '') + String(err.stderr ?? ''),
    };
  }
}

describe('delivery/database boundary guard regression', () => {
  it('FAILS on a page importing getDatabase', () => {
    const result = runGuardAgainst(
      `---\nimport { getDatabase } from '../../shared/database/database.js';\nconst db = getDatabase();\n---\n<h1>x</h1>\n`,
    );
    expect(result.exitCode).toBe(1);
    expect(result.output).toMatch(/delivery-getDatabase-usage|delivery-database-import/);
  });

  it('FAILS on an action importing pg/Kysely', () => {
    const result = runGuardAgainst(
      `import { Kysely } from 'kysely';\nimport { Pool } from 'pg';\nexport const db = new Pool();\n`,
      'action.ts',
    );
    expect(result.exitCode).toBe(1);
    expect(result.output).toMatch(/delivery-kysely-pg/);
  });

  it('FAILS on UI importing a repository', () => {
    const result = runGuardAgainst(
      `import { PostgresTaskRepository } from '../modules/tasks/infrastructure/postgres-repository.js';\nexport const repo = new PostgresTaskRepository();\n`,
      'Widget.ts',
    );
    expect(result.exitCode).toBe(1);
    expect(result.output).toMatch(
      /delivery-infrastructure-import|delivery-postgres|delivery-repository/,
    );
  });

  it('FAILS on delivery importing an infrastructure package', () => {
    const result = runGuardAgainst(
      `import { DisabledAiProvider } from '../modules/ai-advisory/infrastructure/disabled-ai-provider.js';\nexport const provider = new DisabledAiProvider();\n`,
      'action.ts',
    );
    expect(result.exitCode).toBe(1);
    expect(result.output).toMatch(/delivery-infrastructure-import/);
  });

  it('PASSES on approved application composition', () => {
    const result = runGuardAgainst(
      `import { tasksActionDependencies } from '../modules/tasks/application/dependencies.js';\nexport const deps = tasksActionDependencies();\n`,
      'action.ts',
    );
    expect(result.exitCode).toBe(0);
    expect(result.output).toMatch(/passed/);
  });
});
