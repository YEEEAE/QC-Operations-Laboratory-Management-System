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
  ['actualForce', 'Actual force (N)'],
  ['torque', 'Torque (N·m)'],
  ['assemblyTime', 'Assembly time (sec)'],
  ['assemblyAngle', 'Assembly angle (°)'],
  ['temperature', 'Temperature (°C)'],
  ['humidity', 'Humidity (%)'],
  ['standardCondition', 'Standard condition'],
  ['remainingDifference', 'Remaining difference'],
  ['timePreset', 'Time preset (sec)'],
  ['remarks', 'Remarks'],
  ['testedBy', 'Tested by'],
  ['reviewedBy', 'Reviewed by QC/E'],
  ['approvedBy', 'Approved by QA/E'],
] as const;

export const sampleFields = [
  ['partName', 'Part name'],
  ['setPressure', 'Set pressure (kPa)'],
  ['appliedPressure', 'Applied pressure (kPa)'],
  ['volume', 'Volume (litre)'],
  ['pressureDifference', 'Pressure difference (kPa)'],
  ['holdingTime', 'Holding time (sec)'],
  ['leakageRate', 'Leakage rate (Pa·cm³/s)'],
  ['result', 'Result (Pass / Fail)'],
] as const;

const sampleSchema = z.object({
  ...(Object.fromEntries(sampleFields.map(([key]) => [key, z.string().max(500)])) as Record<
    (typeof sampleFields)[number][0],
    z.ZodString
  >),
  result: z.enum(['', 'PASS', 'FAIL']),
});
export const reportDraftSchema = z.object({
  reportType: z.enum(['SUBATMOSPHERIC_AIR_LEAKAGE', 'PRESSURE_DECAY']),
  connectorType: z.enum(['', 'NON_LOCKING_RIGID', 'FLOATING_COLLAR', 'LOCKING_FIXED_THREADS']),
  overallResult: z.enum(['', 'PASS', 'FAIL', 'HOLD_FURTHER_EVALUATION']),
  ...(Object.fromEntries(reportFields.map(([key]) => [key, z.string().max(2000)])) as Record<
    (typeof reportFields)[number][0],
    z.ZodString
  >),
  samples: z.array(sampleSchema).length(12),
});
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
