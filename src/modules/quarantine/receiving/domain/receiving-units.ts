/**
 * QC-DATA-001 — Controlled receiving quantity-unit vocabulary.
 *
 * Quantity and unit are two facts: the quantity is the NUMERIC `qty` column and
 * the unit is this contract. A unit is never inferred from free text on write;
 * legacy text such as "250 PCS" is normalised explicitly (see
 * `receiving-quantity.ts`) and anything ambiguous is reported for review, not
 * guessed.
 *
 * The same list is stored as a CHECK constraint in
 * `db/migrations/0035_receiving_normalization.sql`. Adding a unit is a schema
 * change plus a migration — never a silent application-side value.
 */
export const RECEIVING_QUANTITY_UNITS = [
  'PCS',
  'KG',
  'G',
  'MG',
  'L',
  'ML',
  'M',
  'M2',
  'BOX',
  'PACK',
  'ROLL',
  'SET',
] as const;

export type ReceivingQuantityUnit = (typeof RECEIVING_QUANTITY_UNITS)[number];

/**
 * Legacy spellings mapped onto the canonical unit. Every entry is a spelling of
 * a unit already in the vocabulary above; this table never introduces a new
 * unit and never maps an unknown token onto a guess.
 */
const UNIT_ALIASES: Readonly<Record<string, ReceivingQuantityUnit>> = {
  PCS: 'PCS',
  PC: 'PCS',
  PCE: 'PCS',
  PIECE: 'PCS',
  PIECES: 'PCS',
  NOS: 'PCS',
  NO: 'PCS',
  EA: 'PCS',
  EACH: 'PCS',
  UNIT: 'PCS',
  UNITS: 'PCS',
  UOM: 'PCS',
  KG: 'KG',
  KGS: 'KG',
  KILO: 'KG',
  KILOS: 'KG',
  KILOGRAM: 'KG',
  KILOGRAMS: 'KG',
  G: 'G',
  GM: 'G',
  GMS: 'G',
  GRAM: 'G',
  GRAMS: 'G',
  MG: 'MG',
  L: 'L',
  LT: 'L',
  LTS: 'L',
  LTR: 'L',
  LTRS: 'L',
  LITER: 'L',
  LITERS: 'L',
  LITRE: 'L',
  LITRES: 'L',
  ML: 'ML',
  MLS: 'ML',
  MILLILITER: 'ML',
  MILLILITRE: 'ML',
  M: 'M',
  MTR: 'M',
  MTRS: 'M',
  METER: 'M',
  METERS: 'M',
  METRE: 'M',
  METRES: 'M',
  M2: 'M2',
  SQM: 'M2',
  'M²': 'M2',
  BOX: 'BOX',
  BOXS: 'BOX',
  BOXES: 'BOX',
  BX: 'BOX',
  CTN: 'BOX',
  CARTON: 'BOX',
  CARTONS: 'BOX',
  PACK: 'PACK',
  PACKS: 'PACK',
  PKT: 'PACK',
  PKTS: 'PACK',
  PACKET: 'PACK',
  PACKETS: 'PACK',
  PACKAGE: 'PACK',
  PACKAGES: 'PACK',
  ROLL: 'ROLL',
  ROLLS: 'ROLL',
  SET: 'SET',
  SETS: 'SET',
};

export function isReceivingQuantityUnit(value: unknown): value is ReceivingQuantityUnit {
  return (
    typeof value === 'string' &&
    (RECEIVING_QUANTITY_UNITS as readonly string[]).includes(value)
  );
}

/** Canonical unit for a legacy spelling, or `undefined` when it is unknown. */
export function canonicalReceivingUnit(raw: string): ReceivingQuantityUnit | undefined {
  const token = raw.trim().toUpperCase().replace(/\.+$/, '');
  if (!token) return undefined;
  return UNIT_ALIASES[token];
}

/** Server-side unit check for a write path: never falls back to a default. */
export function assertReceivingQuantityUnit(value: string | null | undefined): ReceivingQuantityUnit {
  const unit = value?.trim().toUpperCase() ?? '';
  if (!isReceivingQuantityUnit(unit)) {
    throw new Error(`Unsupported receiving quantity unit: ${JSON.stringify(value ?? null)}`);
  }
  return unit;
}
