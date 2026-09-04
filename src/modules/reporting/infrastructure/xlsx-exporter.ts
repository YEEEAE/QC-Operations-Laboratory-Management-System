import type { ReportColumn } from '../domain/report-definition.js';
import type { ReportRow } from '../ports/report-query.js';
import { sanitizeSpreadsheetCell } from './csv-exporter.js';

const esc = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
function crc32(buffer: Buffer): number { let crc = 0xffffffff; for (const byte of buffer) { crc ^= byte; for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0); } return (crc ^ 0xffffffff) >>> 0; }
function zip(entries: readonly { name: string; data: Buffer }[]): Buffer {
  const local: Buffer[] = [], central: Buffer[] = []; let offset = 0;
  for (const entry of entries) { const name = Buffer.from(entry.name), crc = crc32(entry.data), head = Buffer.alloc(30); head.writeUInt32LE(0x04034b50, 0); head.writeUInt16LE(20, 4); head.writeUInt16LE(0, 6); head.writeUInt16LE(0, 8); head.writeUInt32LE(crc, 14); head.writeUInt32LE(entry.data.length, 18); head.writeUInt32LE(entry.data.length, 22); head.writeUInt16LE(name.length, 26); head.writeUInt16LE(0, 28); const record = Buffer.concat([head, name, entry.data]); local.push(record); const dir = Buffer.alloc(46); dir.writeUInt32LE(0x02014b50, 0); dir.writeUInt16LE(20, 4); dir.writeUInt16LE(20, 6); dir.writeUInt16LE(0, 8); dir.writeUInt16LE(0, 10); dir.writeUInt32LE(crc, 16); dir.writeUInt32LE(entry.data.length, 20); dir.writeUInt32LE(entry.data.length, 24); dir.writeUInt16LE(name.length, 28); dir.writeUInt32LE(offset, 42); central.push(Buffer.concat([dir, name])); offset += record.length; }
  const body = Buffer.concat(local), directory = Buffer.concat(central), end = Buffer.alloc(22); end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(8, 8); end.writeUInt16LE(8, 10); end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(body.length, 16); return Buffer.concat([body, directory, end]);
}
export function xlsxBytes(rows: readonly ReportRow[], columns: readonly ReportColumn[]): Buffer {
  const all = [columns.map((c) => c.label), ...rows.map((row) => columns.map((c) => row[c.key] === null || row[c.key] === undefined ? '' : String(row[c.key])))];
  const sheet = `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${all.map((line, r) => `<row r="${r + 1}">${line.map((value, c) => `<c r="${String.fromCharCode(65 + c)}${r + 1}" t="inlineStr"><is><t>${esc(sanitizeSpreadsheetCell(value))}</t></is></c>`).join('')}</row>`).join('')}</sheetData></worksheet>`;
  const content = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  return zip([
    { name: '[Content_Types].xml', data: Buffer.from(`${content}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`) },
    { name: '_rels/.rels', data: Buffer.from(`${content}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`) },
    { name: 'xl/workbook.xml', data: Buffer.from(`${content}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Report" sheetId="1" r:id="rId1"/></sheets></workbook>`) },
    { name: 'xl/_rels/workbook.xml.rels', data: Buffer.from(`${content}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`) },
    { name: 'xl/worksheets/sheet1.xml', data: Buffer.from(`${content}${sheet}`) },
  ]);
}

