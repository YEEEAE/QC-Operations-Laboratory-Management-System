/**
 * QC-100-FINAL-004 Task 5 — unit coverage for the UAT evidence domain rules
 * and the ingestion use cases (fail-closed, kit-consistency, authority).
 */
import { describe, expect, it, vi } from 'vitest';

import {
  AUTOMATED_PARTICIPANT_CODE,
  assertUatCycleIdentity,
  assertUatDefect,
  assertUatSession,
  evaluateAcceptancePreconditions,
  uatCycleSnapshotHash,
  type UatSessionInput,
} from '../../../src/modules/uat-evidence/domain/uat-evidence.js';
import {
  AcceptUatCycleUseCase,
  CreateUatCycleUseCase,
  GetUatCycleEvidenceUseCase,
  RecordUatDefectUseCase,
  RecordUatSessionUseCase,
  assertUatAcceptanceAuthority,
} from '../../../src/modules/uat-evidence/application/use-cases.js';
import type { UatEvidenceRepository } from '../../../src/modules/uat-evidence/ports/repository.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';

const identity = {
  cycleId: 'UAT-2026-09-19-001',
  releaseId: 'rel-20260919',
  gitSha: 'a'.repeat(40),
  buildId: 'qc-closure-testbuild1',
  applicationVersion: '0.1.0',
  migrationHead: '0030_reject_reports_role_parity',
  environment: 'test' as const,
  planReference: 'Documents/UAT-ACCEPTANCE-PLAN.md',
};

const actor = (
  id: string,
  roles: string[],
  permissions: string[],
  loginIdentity = 'test-user',
): ActorContext => ({
  id,
  loginIdentity,
  accountState: 'ACTIVE',
  roles,
  permissions: permissions.map((code) => ({ code: code as never, scopes: ['GLOBAL'] })),
});

const sessionInput = (): UatSessionInput => ({
  sessionId: 'SES-001',
  taskId: 'T-UAT-01',
  participantRole: 'QC Employee',
  participantCode: 'uat-qc-01',
  startedAt: new Date('2026-09-19T09:00:00Z'),
  endedAt: new Date('2026-09-19T09:05:00Z'),
  timeOnTaskSeconds: 300,
  taskSuccess: true,
  errorCount: 0,
  backtrackingCount: 0,
  failedNavigationCount: 0,
  formCorrectionCount: 0,
  assistance: 'none',
  wrongActionAttempts: 0,
  confidence1To5: 5,
  seq1To7: 7,
  observations: 'Flow completed as expected.',
  severity: 'NONE',
  participantComments: 'No issues observed.',
  scenarioStatus: 'PASS',
  taskAcceptReject: 'ACCEPT',
  evidenceReference: 'audit/uat/SES-001',
});

function makeRepo(): UatEvidenceRepository &
  Record<string, ReturnType<typeof vi.fn>> & {
  cycles: Map<string, unknown>;
} {
  const cycles = new Map<string, unknown>();
  return {
    cycles,
    findCycleByCycleId: vi.fn(async () => undefined),
    createCycle: vi.fn(async (input: { identity: typeof identity; evidenceSnapshotHash: string; status?: string; requestId: string }) => ({
      id: 'cycle-1',
      ...input.identity,
      status: input.status ?? 'UNVERIFIED',
      evidenceSnapshotHash: input.evidenceSnapshotHash,
      createdAt: new Date(),
    })),
    recordSession: vi.fn(async () => ({
      id: 'session-1',
      cycleId: 'cycle-1',
      ...sessionInput(),
      createdAt: new Date(),
    })),
    recordDefect: vi.fn(async () => ({
      id: 'defect-1',
      cycleId: 'cycle-1',
      ...(await Promise.resolve({
        defectId: 'DEF-1',
        sessionId: 'SES-001',
        taskId: 'T-UAT-01',
        severity: 'MINOR',
        title: 'Label typo',
        observedEvidence: 'Observed',
        expectedBusinessOutcome: 'Expected',
        actualBusinessOutcome: 'Actual',
        requestIdOrRef: 'req-1',
        status: 'OPEN',
      })),
      createdAt: new Date(),
    })),
    getEvidenceSummary: vi.fn(async () => ({
      sessionCount: 1,
      humanSessionCount: 1,
      openCriticalDefectCount: 0,
    })),
    listSessions: vi.fn(async () => []),
    listDefects: vi.fn(async () => []),
  } as never;
}

describe('UAT cycle identity binding', () => {
  it('accepts a controlled identity and derives a stable snapshot hash', () => {
    assertUatCycleIdentity(identity);
    const hash = uatCycleSnapshotHash(identity);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(uatCycleSnapshotHash({ ...identity, gitSha: identity.gitSha.toUpperCase() })).toBe(hash);
  });

  it('fails closed on wrong SHA length, bad environment, or missing plan reference', () => {
    expect(() => assertUatCycleIdentity({ ...identity, gitSha: 'abc' })).toThrow();
    expect(() => assertUatCycleIdentity({ ...identity, environment: 'production' as never })).toThrow();
    expect(() => assertUatCycleIdentity({ ...identity, planReference: ' ' })).toThrow();
    expect(() => assertUatCycleIdentity({ ...identity, cycleId: 'x' })).toThrow();
  });
});

describe('session and defect validation (controlled kit rules)', () => {
  it('accepts a consistent PASS session', () => {
    expect(() => assertUatSession(sessionInput())).not.toThrow();
  });

  it('rejects PASS without success/ACCEPT and FAIL without REJECT', () => {
    expect(() =>
      assertUatSession({ ...sessionInput(), scenarioStatus: 'PASS', taskAcceptReject: 'BLOCKED' }),
    ).toThrow();
    expect(() =>
      assertUatSession({ ...sessionInput(), scenarioStatus: 'FAIL', taskAcceptReject: 'ACCEPT' }),
    ).toThrow();
    expect(() =>
      assertUatSession({
        ...sessionInput(),
        scenarioStatus: 'FAIL',
        taskSuccess: false,
        taskAcceptReject: 'REJECT',
      }),
    ).not.toThrow();
  });

  it('rejects time/window, counter, and enum violations', () => {
    expect(() =>
      assertUatSession({
        ...sessionInput(),
        endedAt: new Date('2026-09-19T08:59:00Z'),
      }),
    ).toThrow();
    expect(() => assertUatSession({ ...sessionInput(), timeOnTaskSeconds: 299 })).toThrow();
    expect(() => assertUatSession({ ...sessionInput(), confidence1To5: 6 })).toThrow();
    expect(() => assertUatSession({ ...sessionInput(), seq1To7: 0 })).toThrow();
    expect(() => assertUatSession({ ...sessionInput(), assistance: 'unsure' as never })).toThrow();
    expect(() =>
      assertUatSession({ ...sessionInput(), participantRole: 'Superuser' }),
    ).toThrow();
    expect(() => assertUatSession({ ...sessionInput(), observations: ' ' })).toThrow();
  });

  it('rejects malformed defects', () => {
    expect(() =>
      assertUatDefect({
        defectId: 'DEF-1',
        sessionId: 'SES-001',
        taskId: 'T-UAT-01',
        severity: 'MINOR',
        title: 't',
        observedEvidence: 'e',
        expectedBusinessOutcome: 'x',
        actualBusinessOutcome: 'y',
        requestIdOrRef: 'req-1',
        status: 'OPEN',
      }),
    ).not.toThrow();
    expect(() =>
      assertUatDefect({
        defectId: '',
        sessionId: 'SES-001',
        taskId: 'T-UAT-01',
        severity: 'MINOR',
        title: 't',
        observedEvidence: 'e',
        expectedBusinessOutcome: 'x',
        actualBusinessOutcome: 'y',
        requestIdOrRef: 'req-1',
        status: 'OPEN',
      }),
    ).toThrow();
    expect(() =>
      assertUatDefect({
        defectId: 'DEF-2',
        sessionId: 'SES-001',
        taskId: 'T-UAT-01',
        severity: 'NONE' as never,
        title: 't',
        observedEvidence: 'e',
        expectedBusinessOutcome: 'x',
        actualBusinessOutcome: 'y',
        requestIdOrRef: 'req-1',
        status: 'OPEN',
      }),
    ).toThrow();
  });
});

describe('acceptance preconditions (fail-closed)', () => {
  const base = {
    cycleStatus: 'IN_PROGRESS' as const,
    environment: 'test',
    cycleSnapshotHash: 'h',
    expectedSnapshotHash: 'h',
    sessionCount: 3,
    humanSessionCount: 3,
    openCriticalDefectCount: 0,
  };

  it('passes with human sessions and no open critical defects', () => {
    expect(() => evaluateAcceptancePreconditions(base)).not.toThrow();
  });

  it('rejects automated-only evidence and empty cycles', () => {
    expect(() => evaluateAcceptancePreconditions({ ...base, humanSessionCount: 0 })).toThrow();
    expect(() => evaluateAcceptancePreconditions({ ...base, sessionCount: 0 })).toThrow();
  });

  it('rejects open critical defects, hash drift, and double acceptance', () => {
    expect(() => evaluateAcceptancePreconditions({ ...base, openCriticalDefectCount: 1 })).toThrow();
    expect(() => evaluateAcceptancePreconditions({ ...base, cycleSnapshotHash: 'x' })).toThrow();
    expect(() =>
      evaluateAcceptancePreconditions({ ...base, cycleStatus: 'ACCEPTED' as never }),
    ).toThrow();
  });
});

describe('ingestion use cases', () => {
  it('create-cycle binds the snapshot hash and refuses duplicates', async () => {
    const repo = makeRepo();
    const created = await new CreateUatCycleUseCase(repo).execute({
      identity,
      requestId: 'req-create',
      status: 'IN_PROGRESS',
    });
    expect(created.status).toBe('IN_PROGRESS');
    expect(created.evidenceSnapshotHash).toBe(uatCycleSnapshotHash(identity));
    (repo.findCycleByCycleId as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ id: 'dup' });
    await expect(
      new CreateUatCycleUseCase(repo).execute({ identity, requestId: 'req-2' }),
    ).rejects.toMatchObject({ code: 'RESOURCE_ALREADY_EXISTS' });
  });

  it('record-session validates the kit row before persisting', async () => {
    const repo = makeRepo();
    await new RecordUatSessionUseCase(repo).execute({
      cycleId: 'UAT-1',
      session: sessionInput(),
      requestId: 'req-s',
    });
    expect(repo.recordSession).toHaveBeenCalledTimes(1);
    await expect(
      new RecordUatSessionUseCase(repo).execute({
        cycleId: 'UAT-1',
        session: { ...sessionInput(), scenarioStatus: 'PASS', taskAcceptReject: 'REJECT' },
        requestId: 'req-s2',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(repo.recordSession).toHaveBeenCalledTimes(1);
  });

  it('record-defect validates before persisting', async () => {
    const repo = makeRepo();
    await new RecordUatDefectUseCase(repo).execute({
      cycleId: 'UAT-1',
      defect: {
        defectId: 'DEF-1',
        sessionId: 'SES-001',
        taskId: 'T-UAT-01',
        severity: 'MAJOR',
        title: 'Broken state guard',
        observedEvidence: 'e',
        expectedBusinessOutcome: 'x',
        actualBusinessOutcome: 'y',
        requestIdOrRef: 'req-1',
        status: 'OPEN',
      },
      requestId: 'req-d',
    });
    expect(repo.recordDefect).toHaveBeenCalledTimes(1);
  });
});

describe('acceptance authority and ceremony', () => {
  it('grants acceptance authority to Manager and named owner only', () => {
    expect(() =>
      assertUatAcceptanceAuthority(actor('mgr', ['MANAGER'], ['PERM-APR-APPROVE'])),
    ).not.toThrow();
    expect(() =>
      assertUatAcceptanceAuthority(actor('owner', ['SYSTEM_OWNER'], [], 'yazeed')),
    ).not.toThrow();
    expect(() => assertUatAcceptanceAuthority(actor('adm', ['ADMIN'], []))).toThrow();
    expect(() => assertUatAcceptanceAuthority(actor('emp', ['EMPLOYEE'], []))).toThrow();
    expect(() =>
      assertUatAcceptanceAuthority(actor('so', ['SYSTEM_OWNER'], [], 'someone-else')),
    ).toThrow();
  });

  it('performs the ceremony with reauth + signature and writes gate evidence only for ACCEPTED', async () => {
    const repo = makeRepo();
    const executeAcceptance = vi.fn(async () => ({ acceptanceId: 'acc-1', outcome: 'ACCEPTED' }));
    const verifier = { verify: vi.fn(async () => true) };
    const signatureService = {
      create: vi.fn((input: { requestId: string }) => ({ id: 'sig-1', ...input })),
    };
    const useCase = new AcceptUatCycleUseCase(
      repo as unknown as UatEvidenceRepository,
      executeAcceptance,
      verifier,
      signatureService,
    );
    (repo.findCycleByCycleId as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'cycle-1',
      ...identity,
      status: 'IN_PROGRESS',
      evidenceSnapshotHash: uatCycleSnapshotHash(identity),
      createdAt: new Date(),
    });
    const result = await useCase.execute({
      actor: actor('mgr', ['MANAGER'], ['PERM-APR-APPROVE']),
      signer: { id: 'mgr', loginIdentity: 'mgr', accountState: 'ACTIVE', roles: ['MANAGER'] },
      cycleId: identity.cycleId,
      outcome: 'ACCEPTED',
      releaseRowId: '01900000-0000-7000-8000-00000000aa01',
      releaseVersion: 1n,
      evidenceVersion: 1n,
      reauthenticationSecret: 'secret',
      requestId: 'req-accept',
    });
    expect(result.acceptanceId).toBe('acc-1');
    expect(verifier.verify).toHaveBeenCalled();
    expect(signatureService.create).toHaveBeenCalledWith(
      expect.objectContaining({ subjectType: 'UAT_CYCLE', action: 'UAT_ACCEPT' }),
    );
    expect(executeAcceptance).toHaveBeenCalledWith(
      expect.objectContaining({
        acceptance: expect.objectContaining({ outcome: 'ACCEPTED' }),
        gateEvidence: expect.objectContaining({ status: 'PASS' }),
      }),
    );
  });

  it('denies missing reauth, non-authority actors, and gate evidence status for non-acceptance', async () => {
    const repo = makeRepo();
    const executeAcceptance = vi.fn(async () => ({ acceptanceId: 'acc-2', outcome: 'REJECTED' }));
    const useCase = new AcceptUatCycleUseCase(
      repo as unknown as UatEvidenceRepository,
      executeAcceptance,
      { verify: vi.fn(async () => true) },
      { create: vi.fn((input: { requestId: string }) => ({ id: 'sig-2', ...input })) },
    );
    (repo.findCycleByCycleId as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'cycle-1',
      ...identity,
      status: 'IN_PROGRESS',
      evidenceSnapshotHash: uatCycleSnapshotHash(identity),
      createdAt: new Date(),
    });
    await expect(
      useCase.execute({
        actor: actor('mgr', ['MANAGER'], ['PERM-APR-APPROVE']),
        signer: { id: 'mgr', loginIdentity: 'mgr', accountState: 'ACTIVE', roles: ['MANAGER'] },
        cycleId: identity.cycleId,
        outcome: 'ACCEPTED',
        releaseRowId: '01900000-0000-7000-8000-00000000aa01',
        releaseVersion: 1n,
        evidenceVersion: 1n,
        reauthenticationSecret: ' ',
        requestId: 'req-1',
      }),
    ).rejects.toMatchObject({ code: 'AUTH_REAUTH_REQUIRED' });
    await expect(
      useCase.execute({
        actor: actor('emp', ['EMPLOYEE'], []),
        signer: { id: 'emp', loginIdentity: 'emp', accountState: 'ACTIVE', roles: ['EMPLOYEE'] },
        cycleId: identity.cycleId,
        outcome: 'ACCEPTED',
        releaseRowId: '01900000-0000-7000-8000-00000000aa01',
        releaseVersion: 1n,
        evidenceVersion: 1n,
        reauthenticationSecret: 'secret',
        requestId: 'req-2',
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_DENIED' });
    await useCase.execute({
      actor: actor('mgr', ['MANAGER'], ['PERM-APR-APPROVE']),
      signer: { id: 'mgr', loginIdentity: 'mgr', accountState: 'ACTIVE', roles: ['MANAGER'] },
      cycleId: identity.cycleId,
      outcome: 'REJECTED',
      releaseRowId: '01900000-0000-7000-8000-00000000aa01',
      releaseVersion: 1n,
      evidenceVersion: 1n,
      reauthenticationSecret: 'secret',
      requestId: 'req-3',
    });
    expect(executeAcceptance).toHaveBeenCalledWith(
      expect.objectContaining({ gateEvidence: expect.objectContaining({ status: 'UNVERIFIED' }) }),
    );
  });
});

describe('automated facilitator marker', () => {
  it('is a distinct non-human participant code', () => {
    expect(AUTOMATED_PARTICIPANT_CODE).toBe('FACILITATOR-AUTOMATED');
    expect(AUTOMATED_PARTICIPANT_CODE).not.toBe('');
  });
});

describe('retrieval read model authorization', () => {
  it('denies actors without report view and reports gate UNVERIFIED for non-accepted cycles', async () => {
    const repo = makeRepo();
    (repo.findCycleByCycleId as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'cycle-1',
      ...identity,
      status: 'IN_PROGRESS',
      evidenceSnapshotHash: 'h',
      createdAt: new Date(),
    });
    await expect(
      new GetUatCycleEvidenceUseCase(repo as unknown as UatEvidenceRepository).execute({
        actor: actor('emp', ['EMPLOYEE'], []),
        cycleId: identity.cycleId,
      }),
    ).rejects.toMatchObject({ code: 'AUTHZ_PERMISSION_MISSING' });
    const view = await new GetUatCycleEvidenceUseCase(repo as unknown as UatEvidenceRepository).execute({
      actor: actor('mgr', ['MANAGER'], ['PERM-RPT-VIEW']),
      cycleId: identity.cycleId,
    });
    expect(view.releaseGateStatus).toBe('UNVERIFIED');
  });
});
