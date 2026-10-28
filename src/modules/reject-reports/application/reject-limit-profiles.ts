import { createHash } from 'node:crypto';
import { isNamedSystemOwner } from '../../../shared/authorization/p05-authority.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { AppError } from '../../../shared/errors/app-error.js';
import { compareDecimalStrings } from '../domain/reject-percentage.js';

export interface RejectLimitProfileInput {
  itemCode: string; line?: string; site?: string; shift?: string; formulaId: string;
  denominator: string; limit: string; unit: string; baselineStart: Date; baselineEnd: Date;
  sourceFileName: string; sourceBytes: Uint8Array;
}
export interface RejectLimitProfileRepository {
  create(input: RejectLimitProfileInput & { actor: ActorContext; requestId: string }): Promise<unknown>;
  transition(input: { profileId: string; expectedVersion: bigint; actor: ActorContext; requestId: string; action: 'REVIEW' | 'REJECT' | 'ACTIVATE'; reason: string; effectiveFrom?: Date; effectiveTo?: Date }): Promise<unknown>;
  list(): Promise<readonly unknown[]>;
}

export class RejectLimitProfilesUseCase {
  constructor(private readonly repository: RejectLimitProfileRepository) {}
  create(input: RejectLimitProfileInput & { actor: ActorContext; requestId: string }) {
    if (!isNamedSystemOwner(input.actor)) throw new AppError('AUTHZ_DENIED', { userSafe: true });
    if (input.sourceBytes.byteLength === 0 || !input.sourceFileName.trim())
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    if (!['REJECT_OVER_GOOD', 'REJECT_OVER_TOTAL_PRODUCED'].includes(input.formulaId))
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    const expectedDenominator = input.formulaId === 'REJECT_OVER_GOOD' ? 'goodQty' : 'totalProducedQty';
    if (input.denominator !== expectedDenominator)
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    if (compareDecimalStrings(input.limit, '0') < 0 || input.baselineEnd < input.baselineStart)
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    if (input.baselineStart.getUTCFullYear() !== 2025 || input.baselineEnd.getUTCFullYear() !== 2025)
      throw new AppError('VALIDATION_FAILED', { userSafe: true });
    return this.repository.create(input);
  }
  transition(input: Parameters<RejectLimitProfileRepository['transition']>[0]) {
    if (!isNamedSystemOwner(input.actor)) throw new AppError('AUTHZ_DENIED', { userSafe: true });
    if (!input.reason.trim()) throw new AppError('VALIDATION_FAILED', { userSafe: true });
    return this.repository.transition(input);
  }
  list() { return this.repository.list(); }
}

export function sourceDigest(bytes: Uint8Array) {
  return createHash('sha256').update(bytes).digest('hex');
}
