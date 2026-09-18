import { AppError } from '../../../shared/errors/app-error.js';
import type { DailyRejectStatus } from './reject-report.js';
import {
  assertNonBlank,
  assertNonNegativeNumberString,
  assertOptionalNonNegativeNumberString,
  optionalTrimmed,
} from './reject-report.js';
import { computeRejectPercent } from './reject-percentage.js';

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
  rejectPct: number | null;
  version: bigint;
}

export interface DailyReject {
  id: string;
  reportNo: string;
  reportDate: Date;
  department: string;
  shift?: string;
  status: DailyRejectStatus;
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

export function validateDailyRejectEntry(input: DailyRejectEntryInput): DailyRejectEntryInput {
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
    rejectLimit: assertOptionalNonNegativeNumberString(input.rejectLimit, 'rejectLimit'),
    productionFormula: optionalTrimmed(input.productionFormula),
    rejectReason: assertNonBlank(input.rejectReason, 'rejectReason'),
    analysis: optionalTrimmed(input.analysis),
  };
}

export function entryRejectPct(entry: Pick<DailyRejectEntryInput, 'rejectQty' | 'goodQty'>) {
  return computeRejectPercent(Number(entry.rejectQty), Number(entry.goodQty));
}

export function assertFinalizable(entries: readonly DailyRejectEntryInput[]): void {
  if (entries.length === 0)
    throw new AppError('VALIDATION_FAILED', {
      userSafe: true,
      fieldErrors: { entries: ['at least one entry is required'] },
    });
}

export function dailyRejectTotals(entries: readonly DailyRejectEntry[]): {
  totalRejectQty: number;
  totalGoodQty: number;
  rejectPct: number | null;
} {
  const totalRejectQty = entries.reduce((sum, entry) => sum + Number(entry.rejectQty), 0);
  const totalGoodQty = entries.reduce((sum, entry) => sum + Number(entry.goodQty), 0);
  return {
    totalRejectQty,
    totalGoodQty,
    rejectPct: computeRejectPercent(totalRejectQty, totalGoodQty),
  };
}
