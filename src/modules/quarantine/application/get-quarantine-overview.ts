import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';

export interface QuarantineOverview {
  generatedAt: Date;
  scopeLabel: string;
  metrics: Array<{ key: string; label: string; value: number; definition: string; href: string; tone: 'neutral' | 'warning' | 'danger' | 'success' }>;
  attention: Array<{ id: string; title: string; summary: string; href: string; severity: 'INFO' | 'WARNING' | 'CRITICAL'; state: string }>;
  distributions: Array<{ label: string; value: number }>;
}
export interface QuarantineOverviewReader { get(input: { actor: ActorContext }): Promise<QuarantineOverview>; }

export class GetQuarantineOverviewUseCase {
  constructor(private readonly reader: QuarantineOverviewReader) {}
  execute(input: { actor: ActorContext }) {
    authorize({ actor: input.actor, permission: 'PERM-QUAR-VIEW', action: 'VIEW', entity: { type: 'QUARANTINE_DASHBOARD', id: 'overview', state: 'ACTIVE', ownerId: input.actor.id }, scope: { ownerId: input.actor.id }, currentVersion: 1, expectedVersion: 1, businessCondition: true }, { throwOnDeny: true });
    return this.reader.get(input);
  }
}
