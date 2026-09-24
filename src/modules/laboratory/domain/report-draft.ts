import { z } from 'zod';

export const reportTypes = {
  SUBATMOSPHERIC_AIR_LEAKAGE: 'Subatmospheric Pressure Air Leakage Test Report',
  PRESSURE_DECAY: 'Pressure Decay Test Report',
} as const;

export type ReportType = keyof typeof reportTypes;

export const reportFields = [
  ['companyName', 'Company / facility'],
  ['recordCategory', 'Record category'],
  ['documentNo', 'Document number'],
  ['revision', 'Revision'],
  ['documentDate', 'Document date'],
  ['pageNo', 'Page number'],
  ['productDescription', 'Product / description'],
  ['testingDate', 'Testing date'],
  ['sampleCount', 'Number of samples tested'],
  ['lotNumber', 'Lot number'],
  ['testingArea', 'Testing area'],
  ['mediumName', 'Medium name'],
  ['mediumUsed', 'Medium used'],
  ['actualForce', 'Actual force'],
  ['torque', 'Torque'],
  ['assemblyTime', 'Assembly time'],
  ['assemblyAngle', 'Assembly angle'],
  ['temperature', 'Temperature'],
  ['humidity', 'Humidity'],
  ['standardCondition', 'Standard condition'],
  ['remainingDifference', 'Remaining difference'],
  ['timePreset', 'Time preset (sec)'],
  ['remarks', 'Remarks'],
  ['testedBy', 'Tested by'],
  ['reviewedBy', 'Reviewed by QC/E'],
  ['approvedBy', 'Approved by QA/E'],
] as const;

export const sampleFields = [
  ['sampleIdentifier', 'Sample identifier (as recorded)'],
  ['partName', 'Part name'],
  ['setPressure', 'Set pressure'],
  ['appliedPressure', 'Applied pressure'],
  ['volume', 'Volume'],
  ['pressureDifference', 'Pressure difference'],
  ['holdingTime', 'Holding time'],
  ['leakageRate', 'Leakage rate'],
  ['result', 'Result recorded on source report'],
] as const;

const sampleSchema = z
  .object({
    ...(Object.fromEntries(sampleFields.map(([key]) => [key, z.string().max(500)])) as Record<
      (typeof sampleFields)[number][0],
      z.ZodString
    >),
    result: z.string().max(500),
  })
  .strict();
export const reportDraftSchema = z
  .object({
    reportType: z.enum(['SUBATMOSPHERIC_AIR_LEAKAGE', 'PRESSURE_DECAY']),
    connectorType: z.string().max(500),
    overallResult: z.enum(['', 'PASS', 'FAIL', 'HOLD_FURTHER_EVALUATION']),
    ...(Object.fromEntries(reportFields.map(([key]) => [key, z.string().max(2000)])) as Record<
      (typeof reportFields)[number][0],
      z.ZodString
    >),
    samples: z.array(sampleSchema).length(12),
  })
  .strict();
export type ReportDraftData = z.infer<typeof reportDraftSchema>;

export function emptyReportDraft(reportType: ReportType): ReportDraftData {
  const fields = Object.fromEntries(reportFields.map(([key]) => [key, '']));
  const sample = Object.fromEntries(sampleFields.map(([key]) => [key, '']));
  return reportDraftSchema.parse({
    reportType,
    connectorType: '',
    overallResult: '',
    ...fields,
    samples: Array.from({ length: 12 }, () => ({ ...sample })),
  });
}
