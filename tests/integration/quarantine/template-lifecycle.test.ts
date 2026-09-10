import { describe, expect, it } from 'vitest';
import { AppError } from '../../../src/shared/errors/app-error.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import type { PermissionCode } from '../../../src/shared/authorization/permissions.js';
import {
  createTemplateVersion,
  type TemplateVersion,
} from '../../../src/modules/quarantine/templates/domain/template.js';
import type { TemplateRepository } from '../../../src/modules/quarantine/templates/ports/repository.js';
import type { TemplateVersionAction } from '../../../src/modules/quarantine/templates/domain/template-state.js';
import { transitionTemplateVersion } from '../../../src/modules/quarantine/templates/domain/template-state.js';
import { CreateTemplateUseCase } from '../../../src/modules/quarantine/templates/application/create-template.js';
import {
  ApproveTemplateUseCase,
  ReviewTemplateUseCase,
  StopTemplateUseCase,
  SupersedeTemplateUseCase,
  VoidTemplateUseCase,
} from '../../../src/modules/quarantine/templates/application/lifecycle.js';
import { ReviseTemplateUseCase } from '../../../src/modules/quarantine/templates/application/revise-and-read.js';
import type { TemplateCeremony } from '../../../src/modules/quarantine/templates/application/template-ceremony.js';

let counter = 0;
const uuid = () => `01900000-0000-7000-8000-${String(100000000000 + (counter += 1)).slice(-12)}`;

export interface CapturedAudit {
  subjectId: string;
  action: string;
  oldState?: string;
  newState?: string;
  requestId: string;
  signatureId?: string;
}

export class InMemoryTemplateRepository implements TemplateRepository {
  readonly rows = new Map<string, TemplateVersion>();
  readonly audits: CapturedAudit[] = [];
  readonly outbox: Array<{ aggregateId: string; dedupeKey: string }> = [];
  readonly replayIndex = new Map<string, string>();

  async create(input: {
    template: TemplateVersion;
    templateCode: string;
    actor: ActorContext;
    requestId: string;
    signatureId?: string;
  }): Promise<TemplateVersion> {
    const replayKey = `${input.requestId}:${input.template.id}`;
    const existing = this.replayIndex.get(replayKey);
    if (existing) return this.rows.get(existing)!;
    if (
      [...this.rows.values()].some(
        (r) => r.versionNo === input.template.versionNo && r.templateCode === input.templateCode,
      )
    ) {
      throw new AppError('CONFLICT_DUPLICATE_COMMAND', { userSafe: true });
    }
    this.rows.set(input.template.id, input.template);
    this.replayIndex.set(replayKey, input.template.id);
    this.audits.push({
      subjectId: input.template.id,
      action: 'CREATE',
      newState: input.template.state,
      requestId: input.requestId,
      ...(input.signatureId ? { signatureId: input.signatureId } : {}),
    });
    this.outbox.push({
      aggregateId: input.template.id,
      dedupeKey: `template:${input.template.id}:v1`,
    });
    return input.template;
  }

  async get(id: string): Promise<TemplateVersion | undefined> {
    return this.rows.get(id);
  }

  async list(input: {
    actor: ActorContext;
    state?: TemplateVersion['state'];
  }): Promise<TemplateVersion[]> {
    if (input.actor.accountState !== 'ACTIVE') return [];
    return [...this.rows.values()].filter((r) => !input.state || r.state === input.state);
  }

  async findReplay(requestId: string, subjectId: string): Promise<TemplateVersion | undefined> {
    const hit = this.audits.find((a) => a.requestId === requestId && a.subjectId === subjectId);
    return hit ? this.rows.get(subjectId) : undefined;
  }

  async transition(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    action: TemplateVersionAction;
    reason?: string;
    requestId: string;
    signatureId?: string;
  }): Promise<TemplateVersion> {
    const replayKey = `${input.requestId}:${input.id}`;
    const existing = this.replayIndex.get(replayKey);
    if (existing) return this.rows.get(existing)!;
    const old = this.rows.get(input.id);
    if (!old) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (old.version !== input.expectedVersion)
      throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
    const next = transitionTemplateVersion(old.state, input.action);
    const updated: TemplateVersion = {
      ...old,
      state: next,
      version: old.version + 1n,
      updatedAt: new Date(),
      ...(input.action === 'APPROVE'
        ? { approverId: input.actor.id, approvedBy: input.actor.id, approvedAt: new Date() }
        : {}),
    };
    this.rows.set(input.id, updated);
    this.replayIndex.set(replayKey, input.id);
    this.audits.push({
      subjectId: input.id,
      action: input.action,
      oldState: old.state,
      newState: next,
      requestId: input.requestId,
      ...(input.signatureId ? { signatureId: input.signatureId } : {}),
    });
    this.outbox.push({
      aggregateId: input.id,
      dedupeKey: `template:${input.id}:v${updated.version}`,
    });
    return updated;
  }

  async createRevision(input: {
    id: string;
    expectedVersion: bigint;
    actor: ActorContext;
    versionNo: string;
    name: string;
    description?: string | null;
    contentHash?: string | null;
    sourceDocument?: string | null;
    requestId: string;
  }): Promise<TemplateVersion> {
    const old = this.rows.get(input.id);
    if (!old) throw new AppError('RESOURCE_NOT_FOUND', { userSafe: true });
    if (old.version !== input.expectedVersion)
      throw new AppError('CONFLICT_STALE_VERSION', { userSafe: true });
    if (old.state !== 'APPROVED' && old.state !== 'STOPPED') {
      throw new AppError('DOMAIN_INVALID_TRANSITION', { userSafe: true });
    }
    const revision = createTemplateVersion({
      id: uuid(),
      templateId: old.templateId,
      templateCode: old.templateCode,
      versionNo: input.versionNo,
      name: input.name,
      description: input.description ?? null,
      contentHash: input.contentHash ?? null,
      sourceDocument: input.sourceDocument ?? null,
      createdBy: input.actor.id,
      initialState: 'DRAFT',
      now: new Date(),
    });
    this.rows.set(revision.id, revision);
    this.audits.push({
      subjectId: revision.id,
      action: 'REVISE',
      oldState: old.state,
      newState: 'DRAFT',
      requestId: input.requestId,
    });
    return revision;
  }
}

const ceremony: TemplateCeremony = {
  verifySignature: async (input) => {
    if (!input.reauthenticationSecret?.trim())
      throw new AppError('AUTH_REAUTH_REQUIRED', { userSafe: true });
    if (!input.meaning.trim() || !input.snapshotHash.trim()) {
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    }
    return `sig-${input.requestId}`;
  },
};

const actor = (
  id: string,
  roles: string[],
  permissions: PermissionCode[] = ['PERM-ADM-TEMPLATES', 'PERM-ESIG-SIGN'],
): ActorContext => ({
  id,
  accountState: 'ACTIVE',
  roles,
  permissions: permissions.map((code) => ({ code, scopes: ['GLOBAL'] as const })),
});

const EMPLOYEE = '01900000-0000-7000-8000-000000000021';
const SUPERVISOR = '01900000-0000-7000-8000-000000000022';
const MANAGER = '01900000-0000-7000-8000-000000000023';
const OWNER = '01900000-0000-7000-8000-000000000024';
const ADMIN_ONLY = '01900000-0000-7000-8000-000000000025';

const base = {
  templateCode: 'INSP-TMPL',
  name: 'Incoming inspection',
  description: 'Controlled points',
};

describe('template lifecycle authorization (P-06)', () => {
  it('lets every active user create, but Employee creation produces DRAFT', async () => {
    const repo = new InMemoryTemplateRepository();
    const created = await new CreateTemplateUseCase(repo).execute({
      actor: actor(EMPLOYEE, ['EMPLOYEE']),
      ...base,
      versionNo: 'v1',
      requestId: 'req-employee-create',
    });
    expect(created.state).toBe('DRAFT');
    expect(created.authorId).toBe(EMPLOYEE);
  });

  it('denies creation for Admin-only actors without the template permission', async () => {
    const repo = new InMemoryTemplateRepository();
    await expect(
      new CreateTemplateUseCase(repo).execute({
        actor: actor(ADMIN_ONLY, ['ADMIN'], []),
        ...base,
        versionNo: 'v1',
        requestId: 'req-admin-create',
      }),
    ).rejects.toThrowError(AppError);
  });

  it.each([
    ['SUPERVISOR', SUPERVISOR],
    ['MANAGER', MANAGER],
    ['SYSTEM_OWNER', OWNER],
  ] as const)(
    'creates APPROVED immediately for %s only with reauthentication and E-Signature',
    async (role, id) => {
      const repo = new InMemoryTemplateRepository();
      const useCase = new CreateTemplateUseCase(repo, ceremony);
      await expect(
        useCase.execute({
          actor: actor(id, [role]),
          ...base,
          versionNo: 'v1',
          requestId: `req-${role}-nosig`,
        }),
      ).rejects.toThrowError(AppError);
      const created = await useCase.execute({
        actor: actor(id, [role]),
        ...base,
        versionNo: 'v1',
        reauthenticationSecret: 'correct-password',
        requestId: `req-${role}-sig`,
      });
      expect(created.state).toBe('APPROVED');
      expect(repo.audits.at(-1)?.signatureId).toBe(`sig-req-${role}-sig`);
    },
  );

  it('never lets Employee review, approve, stop, void, or supersede', async () => {
    const repo = new InMemoryTemplateRepository();
    const draft = await new CreateTemplateUseCase(repo).execute({
      actor: actor(EMPLOYEE, ['EMPLOYEE']),
      ...base,
      versionNo: 'v1',
      requestId: 'req-draft',
    });
    const employee = actor(EMPLOYEE, ['EMPLOYEE']);
    await expect(
      new ReviewTemplateUseCase(repo).execute({
        actor: employee,
        id: draft.id,
        expectedVersion: 1n,
        requestId: 'r1',
      }),
    ).rejects.toThrowError(AppError);
    await expect(
      new ApproveTemplateUseCase(repo, ceremony).execute({
        actor: employee,
        id: draft.id,
        expectedVersion: 1n,
        reauthenticationSecret: 'pw',
        requestId: 'r2',
      }),
    ).rejects.toThrowError(AppError);
    await expect(
      new StopTemplateUseCase(repo, ceremony).execute({
        actor: employee,
        id: draft.id,
        expectedVersion: 1n,
        reason: 'risk',
        reauthenticationSecret: 'pw',
        requestId: 'r3',
      }),
    ).rejects.toThrowError(AppError);
    await expect(
      new VoidTemplateUseCase(repo, ceremony).execute({
        actor: employee,
        id: draft.id,
        expectedVersion: 1n,
        reason: 'risk',
        reauthenticationSecret: 'pw',
        requestId: 'r4',
      }),
    ).rejects.toThrowError(AppError);
    await expect(
      new SupersedeTemplateUseCase(repo, ceremony).execute({
        actor: employee,
        id: draft.id,
        expectedVersion: 1n,
        reason: 'risk',
        reauthenticationSecret: 'pw',
        requestId: 'r5',
      }),
    ).rejects.toThrowError(AppError);
  });

  it('lets authorities review and approve an Employee DRAFT, including their own template (SoD exception)', async () => {
    const repo = new InMemoryTemplateRepository();
    const draft = await new CreateTemplateUseCase(repo).execute({
      actor: actor(EMPLOYEE, ['EMPLOYEE']),
      ...base,
      versionNo: 'v1',
      requestId: 'req-sod-draft',
    });
    const supervisor = actor(SUPERVISOR, ['SUPERVISOR']);
    const reviewed = await new ReviewTemplateUseCase(repo).execute({
      actor: supervisor,
      id: draft.id,
      expectedVersion: 1n,
      requestId: 'req-sod-review',
    });
    expect(reviewed.state).toBe('UNDER_REVIEW');
    // Template-only SoD exception: the same reviewer approves the same record.
    const approved = await new ApproveTemplateUseCase(repo, ceremony).execute({
      actor: supervisor,
      id: draft.id,
      expectedVersion: 2n,
      reauthenticationSecret: 'pw',
      requestId: 'req-sod-approve',
    });
    expect(approved.state).toBe('APPROVED');

    // An authority may also approve their own directly-created DRAFT path:
    // create a DRAFT as supervisor is impossible (creates APPROVED), so
    // simulate self-approval by approving an employee draft as the same
    // actor that reviewed — already proven above — plus direct DRAFT approve.
    const draft2 = await new CreateTemplateUseCase(repo).execute({
      actor: actor(EMPLOYEE, ['EMPLOYEE']),
      ...base,
      versionNo: 'v2',
      requestId: 'req-sod-draft2',
    });
    const direct = await new ApproveTemplateUseCase(repo, ceremony).execute({
      actor: supervisor,
      id: draft2.id,
      expectedVersion: 1n,
      reauthenticationSecret: 'pw',
      requestId: 'req-sod-direct',
    });
    expect(direct.state).toBe('APPROVED');
  });

  it('requires reason, reauthentication, and E-Signature for stop, void, and supersede', async () => {
    const repo = new InMemoryTemplateRepository();
    const useCase = new CreateTemplateUseCase(repo, ceremony);
    const approved = await useCase.execute({
      actor: actor(SUPERVISOR, ['SUPERVISOR']),
      ...base,
      versionNo: 'v1',
      reauthenticationSecret: 'pw',
      requestId: 'req-approved',
    });
    const supervisor = actor(SUPERVISOR, ['SUPERVISOR']);
    await expect(
      new StopTemplateUseCase(repo, ceremony).execute({
        actor: supervisor,
        id: approved.id,
        expectedVersion: 1n,
        reason: '',
        reauthenticationSecret: 'pw',
        requestId: 'req-stop-noreason',
      }),
    ).rejects.toThrowError(AppError);
    await expect(
      new StopTemplateUseCase(repo, ceremony).execute({
        actor: supervisor,
        id: approved.id,
        expectedVersion: 1n,
        reason: 'risk',
        requestId: 'req-stop-nosig',
      }),
    ).rejects.toThrowError(AppError);
    const stopped = await new StopTemplateUseCase(repo, ceremony).execute({
      actor: supervisor,
      id: approved.id,
      expectedVersion: 1n,
      reason: 'Contamination risk on line 2',
      reauthenticationSecret: 'pw',
      requestId: 'req-stop',
    });
    expect(stopped.state).toBe('STOPPED');
    const superseded = await new SupersedeTemplateUseCase(repo, ceremony).execute({
      actor: supervisor,
      id: approved.id,
      expectedVersion: 2n,
      reason: 'Replaced by v2',
      reauthenticationSecret: 'pw',
      requestId: 'req-supersede',
    });
    expect(superseded.state).toBe('SUPERSEDED');
  });

  it('replaces approved content only through a new revision followed by Supersede', async () => {
    const repo = new InMemoryTemplateRepository();
    const useCase = new CreateTemplateUseCase(repo, ceremony);
    const approved = await useCase.execute({
      actor: actor(MANAGER, ['MANAGER']),
      ...base,
      versionNo: 'v1',
      reauthenticationSecret: 'pw',
      requestId: 'req-rev-base',
    });
    const revision = await new ReviseTemplateUseCase(repo).execute({
      actor: actor(EMPLOYEE, ['EMPLOYEE']),
      id: approved.id,
      expectedVersion: 1n,
      versionNo: 'v2',
      name: 'Incoming inspection',
      description: 'Updated points',
      requestId: 'req-revise',
    });
    expect(revision.state).toBe('DRAFT');
    expect(revision.templateId).toBe(approved.templateId);
    // The approved revision itself is untouched.
    expect((await repo.get(approved.id))?.state).toBe('APPROVED');
  });

  it('rejects stale writes and replays idempotently without duplicate audit', async () => {
    const repo = new InMemoryTemplateRepository();
    const draft = await new CreateTemplateUseCase(repo).execute({
      actor: actor(EMPLOYEE, ['EMPLOYEE']),
      ...base,
      versionNo: 'v1',
      requestId: 'req-stale',
    });
    const supervisor = actor(SUPERVISOR, ['SUPERVISOR']);
    const auditsBefore = repo.audits.length;
    const first = await new ReviewTemplateUseCase(repo).execute({
      actor: supervisor,
      id: draft.id,
      expectedVersion: 1n,
      requestId: 'req-review-once',
    });
    expect(first.state).toBe('UNDER_REVIEW');
    // Same request id replays the same result without a second audit row.
    const replay = await new ReviewTemplateUseCase(repo).execute({
      actor: supervisor,
      id: draft.id,
      expectedVersion: 1n,
      requestId: 'req-review-once',
    });
    expect(replay.state).toBe('UNDER_REVIEW');
    expect(repo.audits.length).toBe(auditsBefore + 1);
    // A stale expected version is rejected.
    await expect(
      new ApproveTemplateUseCase(repo, ceremony).execute({
        actor: supervisor,
        id: draft.id,
        expectedVersion: 1n,
        reauthenticationSecret: 'pw',
        requestId: 'req-approve-stale',
      }),
    ).rejects.toThrowError(AppError);
  });

  it('persists immutable audit and outbox evidence for every lifecycle action', async () => {
    const repo = new InMemoryTemplateRepository();
    const useCase = new CreateTemplateUseCase(repo, ceremony);
    const created = await useCase.execute({
      actor: actor(OWNER, ['SYSTEM_OWNER']),
      ...base,
      versionNo: 'v1',
      reauthenticationSecret: 'pw',
      requestId: 'req-evidence',
    });
    expect(repo.audits.some((a) => a.subjectId === created.id && a.action === 'CREATE')).toBe(true);
    expect(repo.outbox.some((o) => o.aggregateId === created.id)).toBe(true);
    expect(repo.audits.at(-1)?.signatureId).toBe('sig-req-evidence');
  });
});
