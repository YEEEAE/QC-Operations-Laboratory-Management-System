import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import type {
  FullConfig,
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import { verificationRun } from '../../scripts/verification/evidence-identity.mjs';

type EvidenceStatus = 'PASS' | 'PARTIAL' | 'FAIL' | 'BLOCKED';

interface ScenarioEvidence {
  id: string;
  title: string;
  file: string;
  status: 'PASS' | 'FAIL' | 'SKIPPED' | 'FLAKY';
  durationMs: number;
  tags: string[];
  error?: string;
  skipReason?: string;
}

interface ReleaseIdentity {
  releaseId: string;
  gitSha: string;
  buildId: string;
  applicationVersion: string;
  migrationHead: string;
  migrationHeadChecksum?: string;
  environment?: string;
}

export default class ReleaseEvidenceReporter implements Reporter {
  private readonly startedAt = new Date().toISOString();
  private readonly scenarios = new Map<string, ScenarioEvidence>();
  private outputPath = resolve('.ci-results/authenticated-e2e-evidence.json');
  private identity: ReleaseIdentity | undefined;

  async onBegin(config: FullConfig): Promise<void> {
    this.outputPath = resolve(process.env.E2E_EVIDENCE_OUTPUT ?? this.outputPath);
    const identityPath = process.env.RELEASE_IDENTITY_FILE ?? 'dist/release-identity.json';
    try {
      this.identity = JSON.parse(await readFile(resolve(identityPath), 'utf8')) as ReleaseIdentity;
    } catch {
      this.identity = {
        releaseId: process.env.RELEASE_ID ?? 'unbound',
        gitSha: process.env.RELEASE_GIT_SHA ?? 'unbound',
        buildId: process.env.RELEASE_BUILD_ID ?? 'unbound',
        applicationVersion: process.env.SERVICE_VERSION ?? 'unknown',
        migrationHead: process.env.RELEASE_MIGRATION_HEAD ?? 'unknown',
        environment: process.env.NODE_ENV ?? 'unknown',
      };
    }
    this.scenarios.set('RUN_CONFIG', {
      id: 'RUN_CONFIG',
      title: `Playwright project count ${config.projects.length}`,
      file: 'playwright.config.ts',
      status: 'PASS',
      durationMs: 0,
      tags: ['engineering-e2e'],
    });
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const status =
      result.status === 'passed' ? 'PASS' : result.status === 'skipped' ? 'SKIPPED' : 'FAIL';
    this.scenarios.set(test.id, {
      id: test.titlePath().join(' › '),
      title: test.title,
      file: test.location.file,
      status,
      durationMs: result.duration,
      tags: test.tags,
      ...(status === 'SKIPPED'
        ? {
            skipReason:
              test.annotations.find((annotation) => annotation.type === 'skip')?.description ?? '',
          }
        : {}),
      ...(result.error
        ? { error: (result.error.message ?? String(result.error)).slice(0, 500) }
        : {}),
    });
  }

  async onEnd(result: FullResult): Promise<void> {
    const scenarios = [...this.scenarios.values()];
    const failed = scenarios.filter((scenario) => scenario.status === 'FAIL').length;
    const skipped = scenarios.filter((scenario) => scenario.status === 'SKIPPED').length;
    const passed = scenarios.filter((scenario) => scenario.status === 'PASS').length;
    const status: EvidenceStatus = failed > 0 ? 'FAIL' : skipped > 0 ? 'PARTIAL' : 'PASS';
    const run = await verificationRun();
    const evidence = {
      schemaVersion: 2,
      evidenceKind: 'ENGINEERING_AUTHENTICATED_PLAYWRIGHT_E2E',
      uatClaim: false,
      status,
      testRunId: process.env.E2E_TEST_RUN_ID ?? `e2e-${Date.now()}`,
      startedAt: this.startedAt,
      completedAt: new Date().toISOString(),
      playwrightStatus: result.status,
      release: this.identity,
      candidate: run.candidate,
      runId: run.runId,
      provenance: {
        source: 'TRUSTED_PLAYWRIGHT',
        immutableReference: process.env.E2E_IMMUTABLE_REFERENCE ?? this.outputPath,
        environment: process.env.NODE_ENV ?? 'test',
      },
      totals: { passed, failed, skipped },
      artifactDigest: createHash('sha256')
        .update(JSON.stringify({ scenarios, totals: { passed, failed, skipped } }))
        .digest('hex'),
      scenarios,
    };
    await mkdir(dirname(this.outputPath), { recursive: true });
    await writeFile(this.outputPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  }
}
