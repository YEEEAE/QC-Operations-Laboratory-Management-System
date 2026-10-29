import { AppError } from '../../../shared/errors/app-error.js';
import type { DailyRejectStatus } from './reject-report.js';
import type { FocusComplianceEntry } from './focus-compliance.js';
import {
  assertNonBlank,
  assertNonNegativeNumberString,
  assertOptionalNonNegativeNumberString,
  optionalTrimmed,
} from './reject-report.js';
import {
  addDecimalStrings,
  computePercentage,
  computeRejectPercent,
} from './reject-percentage.js';

export interface DailyRejectEntryInput {
  machineName?: string;
  itemCode?: string;
  itemDescription: string;
  lotNo?: string;
  buRmProductName?: string;
  rmDescription?: string;
  rmUnit?: string;
  rmLotNo?: string;
  rmType?: string;
  pumpOutQty?: string;
  rejectQty: string;
  goodQty: string;
  /** Same entered unit applies to rejectQty, goodQty, totalProducedQty, reworkQty and holdQty. */
  totalProducedQty?: string;
  reworkQty?: string;
  holdQty?: string;
  quantityUnit?: string;
  quantitySourceReference?: string;
  rejectLimit?: string;
  productionFormula?: string;
  rejectReason: string;
  analysis?: string;
}

export interface DailyRejectEntry extends DailyRejectEntryInput {
  id: string;
  reportId: string;
  position: number;
  /** Server-computed: rejectQty / goodQty * 100, null when goodQty = 0. */
  rejectPct: string | null;
  /** Independent Reject / Total Produced metric; never substitutes rejectPct. */
  operationalRejectPct: string | null;
  operationalRejectPctStatus: 'AVAILABLE' | 'NOT_AVAILABLE' | 'ZERO_DENOMINATOR';
  paperFormulaId?: string;
  paperFormulaVersion?: number;
  operationalFormulaId?: string;
  operationalFormulaVersion?: number;
  quantityProvenance?: 'USER_RECORDED';
  productionBalanceStatus?: 'NOT_CONFIGURED';
  thresholdDecisionState: 'REVIEW_REQUIRED' | 'NO_MATCH' | 'CONFLICT' | 'BELOW_LIMIT' | 'ESCALATED';
  thresholdProfileId?: string;
  version: bigint;
}

export interface DailyReject {
  id: string;
  reportNo: string;
  reportDate: Date;
  department: string;
  shift?: string;
  status: DailyRejectStatus;
  reviewEvents?: readonly DailyRejectReviewEvent[];
  focusCompliance?: FocusComplianceEntry;
  entries: readonly DailyRejectEntry[];
  finalizedAt?: Date;
  voidedAt?: Date;
  voidReason?: string;
  correctionOf?: string;
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt: Date;
  version: bigint;
}

export interface DailyRejectReviewEvent {
  id: string;
  reportId: string;
  action: 'SUBMIT_FOR_QC' | 'QC_REVIEW' | 'QC_RETURN' | 'SUPERVISOR_APPROVE';
  fromState: DailyRejectStatus;
  toState: DailyRejectStatus;
  actorId: string;
  permissionCode: string;
  reason?: string;
  occurredAt: Date;
  reportVersion: bigint;
  snapshot?: unknown;
  snapshotHash?: string;
}

export function validateDailyRejectEntry(input: DailyRejectEntryInput): DailyRejectEntryInput {
  const totalProducedQty = assertOptionalNonNegativeNumberString(input.totalProducedQty, 'totalProducedQty');
  const reworkQty = assertOptionalNonNegativeNumberString(input.reworkQty, 'reworkQty');
  const holdQty = assertOptionalNonNegativeNumberString(input.holdQty, 'holdQty');
  const quantityUnit = optionalTrimmed(input.quantityUnit);
  if ((totalProducedQty !== undefined || reworkQty !== undefined || holdQty !== undefined) && !quantityUnit)
    throw new AppError('VALIDATION_FAILED', {
      userSafe: true,
      fieldErrors: { quantityUnit: ['required when produced, rework, or hold quantity is recorded'] },
    });
  return {
    machineName: optionalTrimmed(input.machineName),
    itemCode: optionalTrimmed(input.itemCode),
    itemDescription: assertNonBlank(input.itemDescription, 'itemDescription'),
    lotNo: optionalTrimmed(input.lotNo),
    buRmProductName: optionalTrimmed(input.buRmProductName),
    rmDescription: optionalTrimmed(input.rmDescription),
    rmUnit: optionalTrimmed(input.rmUnit),
    rmLotNo: optionalTrimmed(input.rmLotNo),
    rmType: optionalTrimmed(input.rmType),
    pumpOutQty: assertOptionalNonNegativeNumberString(input.pumpOutQty, 'pumpOutQty'),
    rejectQty: assertNonNegativeNumberString(input.rejectQty, 'rejectQty'),
    goodQty: assertNonNegativeNumberString(input.goodQty, 'goodQty'),
    totalProducedQty,
    reworkQty,
    holdQty,
    quantityUnit,
    quantitySourceReference: optionalTrimmed(input.quantitySourceReference),
    rejectLimit: assertOptionalNonNegativeNumberString(input.rejectLimit, 'rejectLimit'),
    productionFormula: optionalTrimmed(input.productionFormula),
    rejectReason: assertNonBlank(input.rejectReason, 'rejectReason'),
    analysis: optionalTrimmed(input.analysis),
  };
}

export function entryOperationalRejectPct(
  entry: Pick<DailyRejectEntryInput, 'rejectQty' | 'totalProducedQty'>,
): string | null {
  return entry.totalProducedQty === undefined
    ? null
    : computePercentage(entry.rejectQty, entry.totalProducedQty);
}

export function entryOperationalRejectPctStatus(
  entry: Pick<DailyRejectEntryInput, 'totalProducedQty'>,
): 'AVAILABLE' | 'NOT_AVAILABLE' | 'ZERO_DENOMINATOR' {
  if (entry.totalProducedQty === undefined) return 'NOT_AVAILABLE';
  return computePercentage('0', entry.totalProducedQty) === null
    ? 'ZERO_DENOMINATOR'
    : 'AVAILABLE';
}

export function entryRejectPct(entry: Pick<DailyRejectEntryInput, 'rejectQty' | 'goodQty'>) {
  return computeRejectPercent(entry.rejectQty, entry.goodQty);
}

export function assertFinalizable(entries: readonly DailyRejectEntryInput[]): void {
  if (entries.length === 0)
    throw new AppError('VALIDATION_FAILED', {
      userSafe: true,
      fieldErrors: { entries: ['at least one entry is required'] },
    });
}

export function dailyRejectTotals(entries: readonly DailyRejectEntry[]): {
  byRecordedUnit: readonly {
    unit: string;
    totalRejectQty: string;
    totalGoodQty: string;
    rejectPct: string | null;
    entryCount: number;
  }[];
  byQuantityUnit: readonly {
    unit: string;
    totalRejectQty: string | null;
    totalProducedQty: string | null;
    operationalRejectPct: string | null;
    operationalRejectPctStatus: 'AVAILABLE' | 'NOT_AVAILABLE' | 'ZERO_DENOMINATOR';
    entryCount: number;
  }[];
} {
  const groups = new Map<string, DailyRejectEntry[]>();
  for (const entry of entries) {
    const unit = entry.rmUnit?.trim() || 'Unit not recorded';
    const group = groups.get(unit) ?? [];
    group.push(entry);
    groups.set(unit, group);
  }
  const quantityGroups = new Map<string, DailyRejectEntry[]>();
  for (const entry of entries) {
    const unit = entry.quantityUnit?.trim() ?? '';
    const group = quantityGroups.get(unit) ?? [];
    group.push(entry);
    quantityGroups.set(unit, group);
  }
  return {
    byRecordedUnit: [...groups.entries()].map(([unit, group]) => {
      const totalRejectQty = addDecimalStrings(group.map((entry) => entry.rejectQty));
      const totalGoodQty = addDecimalStrings(group.map((entry) => entry.goodQty));
      return {
        unit,
        totalRejectQty,
        totalGoodQty,
        rejectPct: computeRejectPercent(totalRejectQty, totalGoodQty),
        entryCount: group.length,
      };
    }),
    byQuantityUnit: [...quantityGroups.entries()].map(([unit, group]) => {
      const totalRejectQty = unit
        ? addDecimalStrings(group.map((entry) => entry.rejectQty))
        : null;
      const hasTotalProduced = Boolean(unit) && group.every((entry) => entry.totalProducedQty !== undefined);
      const totalProducedQty = hasTotalProduced
        ? addDecimalStrings(group.map((entry) => entry.totalProducedQty!))
        : null;
      return {
        unit: unit || 'Unit not recorded',
        totalRejectQty,
        totalProducedQty,
        operationalRejectPct: totalProducedQty === null
          ? null
          : computePercentage(totalRejectQty, totalProducedQty),
        operationalRejectPctStatus: totalProducedQty === null
          ? 'NOT_AVAILABLE' as const
          : computePercentage('0', totalProducedQty) === null
            ? 'ZERO_DENOMINATOR' as const
            : 'AVAILABLE' as const,
        entryCount: group.length,
      };
    }),
  };
}
