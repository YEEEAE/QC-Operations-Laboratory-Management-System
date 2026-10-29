import { authorize } from '../../../shared/authorization/authorize.js';
import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { CANONICAL_ENVIRONMENTS } from '../domain/backup-record.js';
import type {
  RecoveryGovernanceRepository,
  RecoveryIncidentRecord,
} from '../ports/recovery-governance.js';

export const RECOVERY_INCIDENT_KINDS = [
  'BACKUP_FAILURE',
  'RESTORE_FAILURE',
  'POLICY_GAP',
  'PROVIDER_OUTAGE',
  'DATA_LOSS',
  'OBJECT_STORE_GAP',
] as const;
export type RecoveryIncidentKind = (typeof RECOVERY_INCIDENT_KINDS)[number];

export const RECOVERY_INCIDENT_KIND_LABELS: Record<RecoveryIncidentKind, string> = {
  BACKUP_FAILURE: 'Backup job failure',
  RESTORE_FAILURE: 'Restore failure',
  POLICY_GAP: 'Missing or expired recovery policy',
  PROVIDER_OUTAGE: 'Provider outage',
  DATA_LOSS: 'Data loss',
  OBJECT_STORE_GAP: 'Object-store coverage gap',
};

function requireText(
  value: string,
  field: string,
  maxLength: number,
): string {
  const trimmed = value.trim();
  if (!trimmed)
    throw new AppError('VALIDATION_FAILED', {
      userSafe: true,
      fieldErrors: { [field]: ['required'] },
    });
  if (trimmed.length > maxLength)
    throw new AppError('VALIDATION_FAILED', {
      userSafe: true,
      fieldErrors: { [field]: ['too_long'] },
    });
  return trimmed;
}

function optionalDate(value: Date | undefined, field: string): Date | undefined {
  if (!value) return undefined;
  if (!Number.isFinite(value.getTime()))
    throw new AppError('VALIDATION_FAILED', {
      userSafe: true,
      fieldErrors: { [field]: ['invalid'] },
    });
  return value;
}

/** Records an observed recovery incident as an append-only fact. */
export class RecordRecoveryIncidentUseCase {
  constructor(
    private readonly repository: RecoveryGovernanceRepository,
    private readonly now = () => new Date(),
  ) {}

  async execute(input: {
    actor: ActorContext;
    reference: string;
    kind: string;
    environment: string;
    detectedAt: Date;
    summary: string;
    recoveredDataAsOf?: Date;
    recoveryStartedAt?: Date;
    recoveryValidatedAt?: Date;
    requestId: string;
  }): Promise<RecoveryIncidentRecord> {
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-BKP-POLICY-MANAGE',
        action: 'CREATE',
        entity: {
          type: 'RECOVERY_INCIDENT',
          id: 'incident',
          state: 'OPEN',
          domain: 'BACKUP_RECOVERY',
        },
        scope: { domain: 'BACKUP_RECOVERY' },
        currentVersion: 1n,
        expectedVersion: 1n,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    if (!(RECOVERY_INCIDENT_KINDS as readonly string[]).includes(input.kind))
      throw new AppError('VALIDATION_FAILED', {
        userSafe: true,
        fieldErrors: { kind: ['invalid'] },
      });
    if (!(CANONICAL_ENVIRONMENTS as readonly string[]).includes(input.environment))
      throw new AppError('VALIDATION_FAILED', {
        userSafe: true,
        fieldErrors: { environment: ['invalid'] },
      });
    const detectedAt = optionalDate(input.detectedAt, 'detectedAt');
    if (!detectedAt)
      throw new AppError('VALIDATION_FAILED', {
        userSafe: true,
        fieldErrors: { detectedAt: ['required'] },
      });

    return this.repository.recordIncident({
      reference: requireText(input.reference, 'reference', 120),
      kind: input.kind,
      environment: input.environment,
      detectedAt,
      summary: requireText(input.summary, 'summary', 2000),
      ...(optionalDate(input.recoveredDataAsOf, 'recoveredDataAsOf')
        ? { recoveredDataAsOf: input.recoveredDataAsOf }
        : {}),
      ...(optionalDate(input.recoveryStartedAt, 'recoveryStartedAt')
        ? { recoveryStartedAt: input.recoveryStartedAt }
        : {}),
      ...(optionalDate(input.recoveryValidatedAt, 'recoveryValidatedAt')
        ? { recoveryValidatedAt: input.recoveryValidatedAt }
        : {}),
      actor: input.actor,
      requestId: input.requestId,
      now: this.now(),
    });
  }
}

/** Closes an open incident with a new append-only closure row. */
export class ResolveRecoveryIncidentUseCase {
  constructor(
    private readonly repository: RecoveryGovernanceRepository,
    private readonly now = () => new Date(),
  ) {}

  async execute(input: {
    actor: ActorContext;
    incidentId: string;
    resolutionSummary: string;
    recoveredDataAsOf?: Date;
    recoveryStartedAt?: Date;
    recoveryValidatedAt?: Date;
    requestId: string;
  }): Promise<RecoveryIncidentRecord> {
    authorize(
      {
        actor: input.actor,
        permission: 'PERM-BKP-POLICY-MANAGE',
        action: 'CREATE',
        entity: {
          type: 'RECOVERY_INCIDENT',
          id: 'closure',
          state: 'RESOLVED',
          domain: 'BACKUP_RECOVERY',
        },
        scope: { domain: 'BACKUP_RECOVERY' },
        currentVersion: 1n,
        expectedVersion: 1n,
        businessCondition: true,
      },
      { throwOnDeny: true },
    );
    return this.repository.resolveIncident({
      incidentId: input.incidentId,
      resolutionSummary: requireText(input.resolutionSummary, 'resolutionSummary', 2000),
      ...(optionalDate(input.recoveredDataAsOf, 'recoveredDataAsOf')
        ? { recoveredDataAsOf: input.recoveredDataAsOf }
        : {}),
      ...(optionalDate(input.recoveryStartedAt, 'recoveryStartedAt')
        ? { recoveryStartedAt: input.recoveryStartedAt }
        : {}),
      ...(optionalDate(input.recoveryValidatedAt, 'recoveryValidatedAt')
        ? { recoveryValidatedAt: input.recoveryValidatedAt }
        : {}),
      actor: input.actor,
      requestId: input.requestId,
      now: this.now(),
    });
  }
}
