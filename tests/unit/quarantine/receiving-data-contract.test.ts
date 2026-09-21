/**
 * QC-DATA-001 — Receiving data-contract unit tests (part 1).
 *
 * Covers the canonical quantity/unit contract, legacy source-row
 * classification, the derived status projections (including PASS ≠ RELEASED),
 * and the register filter parser. The release state chain runs over an
 * in-memory repository in part 2.
 */
import { describe, expect, it } from 'vitest';
import {
  canonicalReceivingUnit,
  assertReceivingQuantityUnit,
} from '../../../src/modules/quarantine/receiving/domain/receiving-units.js';
import {
  assertReceivingQuantity,
  assertExpiryNotBeforeReceiving,
} from '../../../src/modules/quarantine/receiving/domain/receiving-item.js';
import { parseReceivingQuantity } from '../../../src/modules/quarantine/receiving/domain/receiving-quantity.js';
import {
  classifyReceivingSourceRow,
  parseReceivingSourceDate,
} from '../../../src/modules/quarantine/receiving/domain/receiving-normalization.js';
import {
  deriveInspectionStatus,
  deriveQuarantineStatus,
  deriveReleaseStatus,
  inspectionAcceptanceReleasesMaterial,
  type ReceivingStatusFacts,
} from '../../../src/modules/quarantine/receiving/domain/receiving-status.js';
import { AppError } from '../../../src/shared/errors/app-error.js';
import { parseReceivingFilters } from '../../../src/modules/quarantine/receiving/application/receiving-filters.js';

describe('quantity and unit contract', () => {
  it('separates a legacy "250 PCS" value into a number and a unit', () => {
    const parsed = parseReceivingQuantity('250 PCS');
    expect(parsed.classification).toBe('NORMALIZABLE');
    expect(parsed.quantity).toBe('250');
    expect(parsed.unit).toBe('PCS');
  });

  it('normalises unit aliases and decimal commas', () => {
    expect(parseReceivingQuantity('29 KGS')).toMatchObject({ classification: 'NORMALIZABLE', quantity: '29', unit: 'KG' });
    expect(parseReceivingQuantity('1,5 KG')).toMatchObject({ quantity: '1.5', unit: 'KG' });
    expect(parseReceivingQuantity('12 LITERS')).toMatchObject({ unit: 'L' });
    expect(parseReceivingQuantity('3 EACH')).toMatchObject({ unit: 'PCS' });
    expect(canonicalReceivingUnit('M²')).toBe('M2');
  });

  it('never guesses: a bare number is missing its unit, not assumed PCS', () => {
    expect(parseReceivingQuantity('250')).toMatchObject({ classification: 'REQUIRES_REVIEW', quantity: '250' });
    expect(parseReceivingQuantity('3 FURLONGS')).toMatchObject({ classification: 'REQUIRES_REVIEW' });
  });

  it('rejects missing, multiple, or non-positive quantities', () => {
    expect(parseReceivingQuantity('').classification).toBe('INVALID');
    expect(parseReceivingQuantity('lot of stuff').classification).toBe('INVALID');
    expect(parseReceivingQuantity('250 PCS 10 BOX').classification).toBe('REQUIRES_REVIEW');
    expect(parseReceivingQuantity('0 PCS').classification).toBe('INVALID');
    expect(parseReceivingQuantity('-5 KG').classification).not.toBe('NORMALIZABLE');
  });

  it('rejects write-path quantities that are not positive plain decimals', () => {
    expect(assertReceivingQuantity('12')).toBe('12');
    expect(assertReceivingQuantity(4)).toBe('4');
    expect(() => assertReceivingQuantity('0')).toThrow(AppError);
    expect(() => assertReceivingQuantity('-3')).toThrow(AppError);
    expect(() => assertReceivingQuantity('12 PCS')).toThrow(AppError);
  });

  it('accepts only the controlled unit vocabulary, with no default unit', () => {
    expect(assertReceivingQuantityUnit('pcs')).toBe('PCS');
    expect(() => assertReceivingQuantityUnit('BARREL')).toThrow();
    expect(() => assertReceivingQuantityUnit(undefined)).toThrow();
  });

  it('rejects an expiry date that precedes the receiving date', () => {
    const receiving = new Date('2026-09-01T00:00:00Z');
    expect(() => assertExpiryNotBeforeReceiving(receiving, new Date('2026-08-31T00:00:00Z'))).toThrow(AppError);
    expect(() => assertExpiryNotBeforeReceiving(receiving, new Date('2026-09-01T00:00:00Z'))).not.toThrow();
  });
});

describe('legacy source-row classification', () => {
  it('classifies a clean canonical row as VALID', () => {
    const result = classifyReceivingSourceRow({
      itemCode: 'RM-001',
      description: 'Raw material',
      lot: 'L-1',
      quantity: '250 PCS',
      receivingDate: '2026-09-01',
    });
    expect(result.classification).toBe('VALID');
    expect(result.normalized).toMatchObject({
      itemCode: 'RM-001',
      receivedQuantity: '250',
      quantityUnit: 'PCS',
      receivingDate: '2026-09-01',
    });
  });

  it('requires review for a missing item code instead of guessing one', () => {
    const result = classifyReceivingSourceRow({
      itemCode: '',
      description: 'Raw material',
      lot: 'L-1',
      quantity: '250 PCS',
      receivingDate: '2026-09-01',
    });
    expect(result.classification).toBe('REQUIRES_REVIEW');
    expect(result.normalized).toBeUndefined();
    expect(result.issues[0]?.reason).toBe('MISSING_REQUIRED_FIELD');
  });

  it('rejects an expiry date that precedes the receiving date', () => {
    const result = classifyReceivingSourceRow({
      itemCode: 'RM-001',
      description: 'Raw material',
      lot: 'L-1',
      quantity: '10 KG',
      receivingDate: '2026-09-10',
      expiryDate: '2026-09-01',
    });
    expect(result.classification).toBe('INVALID');
    expect(result.issues.some((issue) => issue.reason === 'EXPIRY_BEFORE_RECEIVING')).toBe(true);
  });

  it('normalises slash dates and flags ambiguous day/month order', () => {
    expect(parseReceivingSourceDate('2026/09/05').value).toBe('2026-09-05');
    expect(parseReceivingSourceDate('25/12/2026')).toEqual({
      value: '2026-12-25',
      ambiguous: false,
      normalized: true,
    });
    expect(parseReceivingSourceDate('05/12/2026').ambiguous).toBe(true);
    expect(parseReceivingSourceDate('not a date').reason).toBe('DATE_UNPARSEABLE');
    expect(parseReceivingSourceDate('').reason).toBe('DATE_MISSING');
  });
});

describe('derived status projections', () => {
  const facts = (overrides: Partial<ReceivingStatusFacts>): ReceivingStatusFacts => ({
    workflowState: 'PENDING',
    inspectionResult: 'NOT_STARTED',
    releaseSystem: false,
    ...overrides,
  });

  it('projects the quarantine decision status without a second state machine', () => {
    expect(deriveQuarantineStatus(facts({ workflowState: 'PENDING' }))).toBe('PENDING_INSPECTION');
    expect(deriveQuarantineStatus(facts({ workflowState: 'UNDER_INSPECTION' }))).toBe('UNDER_INSPECTION');
    expect(deriveQuarantineStatus(facts({ workflowState: 'HOLD' }))).toBe('HOLD');
    expect(deriveQuarantineStatus(facts({ inspectionResult: 'HOLD' }))).toBe('HOLD');
    expect(deriveQuarantineStatus(facts({ inspectionResult: 'FAIL' }))).toBe('REJECTED');
    expect(deriveQuarantineStatus(facts({ inspectionResult: 'PASS' }))).toBe('PASS');
    expect(deriveQuarantineStatus(facts({ workflowState: 'EXPIRED' }))).toBe('EXPIRED');
  });

  it('keeps PASS from releasing anything and reports the release boundary', () => {
    expect(
      deriveReleaseStatus(facts({ workflowState: 'RELEASE_PENDING', inspectionResult: 'PASS' })),
    ).toBe('RELEASE_PENDING');
    expect(
      deriveReleaseStatus(
        facts({ workflowState: 'RELEASE_PENDING', inspectionResult: 'PASS', releaseSystem: true }),
      ),
    ).toBe('RELEASED');
    expect(inspectionAcceptanceReleasesMaterial()).toBe(false);
  });

  it('projects the inspection status including RETURNED from the linked report', () => {
    expect(deriveInspectionStatus(facts({ workflowState: 'PENDING' }))).toBe('NOT_STARTED');
    expect(deriveInspectionStatus(facts({ workflowState: 'UNDER_INSPECTION' }))).toBe('IN_PROGRESS');
    expect(
      deriveInspectionStatus(facts({ workflowState: 'INSPECTION_COMPLETE', inspectionResult: 'PASS' })),
    ).toBe('COMPLETED');
    expect(deriveInspectionStatus(facts({ latestInspectionReportState: 'RETURNED' }))).toBe('RETURNED');
  });
});

describe('register filter parser', () => {
  it('parses every supported parameter', () => {
    const { filters, rejected } = parseReceivingFilters(
      new URLSearchParams(
        'q=RM&itemCode=RM-1&lot=L1&supplier=Acme&purchaseOrderNo=PO-1&state=HOLD' +
          '&inspectionStatus=COMPLETED&quarantine=PASS&releaseState=RELEASE_PENDING' +
          '&ownership=mine&receivedOn=today&receivedFrom=2026-09-01&receivedTo=2026-09-30' +
          '&expiryFrom=2026-10-01&expiryTo=2026-12-31',
      ),
    );
    expect(rejected).toEqual([]);
    expect(filters).toMatchObject({
      q: 'RM',
      itemCode: 'RM-1',
      lot: 'L1',
      supplier: 'Acme',
      purchaseOrderNo: 'PO-1',
      state: 'HOLD',
      inspectionStatus: 'COMPLETED',
      quarantine: 'PASS',
      releaseState: 'RELEASE_PENDING',
      ownership: 'mine',
      receivedOn: 'today',
      receivedFrom: '2026-09-01',
      receivedTo: '2026-09-30',
      expiryFrom: '2026-10-01',
      expiryTo: '2026-12-31',
    });
  });

  it('reports unsupported parameters and values instead of ignoring them', () => {
    const { filters, rejected } = parseReceivingFilters(
      new URLSearchParams('state=BOGUS&releaseState=YES&mystery=1&receivedFrom=31-12-2026'),
    );
    expect(filters.state).toBeUndefined();
    expect(filters.releaseState).toBeUndefined();
    expect(filters.receivedFrom).toBeUndefined();
    expect(rejected).toEqual([
      { parameter: 'state', value: 'BOGUS', reason: 'UNSUPPORTED_VALUE' },
      { parameter: 'releaseState', value: 'YES', reason: 'UNSUPPORTED_VALUE' },
      { parameter: 'mystery', value: '1', reason: 'UNKNOWN_PARAMETER' },
      { parameter: 'receivedFrom', value: '31-12-2026', reason: 'UNSUPPORTED_VALUE' },
    ]);
  });
});

