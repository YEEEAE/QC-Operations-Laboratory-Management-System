/* global console: readonly */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';

const file = resolve(process.cwd(), 'audit/100-percent/TECH-DEBT-REGISTER.md');
const required = [
  'ID',
  'Priority',
  'Domains',
  'Debt / blocker',
  'Owner',
  'Status',
  'Exit evidence',
];
const statuses = new Set(['OPEN', 'IN_PROGRESS', 'BLOCKED', 'ACCEPTED', 'DONE']);
const priorities = new Set(['P0', 'P1', 'P2', 'P3']);

const source = await readFile(file, 'utf8');
const lines = source.split('\n');
const headerIndex = lines.findIndex((line) => line.startsWith('| ID | Priority |'));
if (headerIndex < 0) throw new Error('Technical debt table header is missing.');
const header = lines[headerIndex]
  .split('|')
  .map((value) => value.trim())
  .filter(Boolean);
if (header.join('|') !== required.join('|'))
  throw new Error('Technical debt table columns changed without updating the checker.');

const rows = lines.slice(headerIndex + 2).filter((line) => /^\| TD-\d{3} \|/.test(line));
if (!rows.length) throw new Error('Technical debt register has no machine-readable rows.');
const ids = new Set();
for (const row of rows) {
  const cells = row
    .split('|')
    .map((value) => value.trim())
    .filter(Boolean);
  if (cells.length !== required.length) throw new Error(`Invalid technical debt row: ${row}`);
  const [id, priority, , debt, owner, status, evidence] = cells;
  if (ids.has(id)) throw new Error(`Duplicate technical debt ID: ${id}`);
  ids.add(id);
  if (!/^TD-\d{3}$/.test(id) || !priorities.has(priority) || !statuses.has(status))
    throw new Error(`Invalid debt identity/priority/status in ${id}.`);
  if (!debt || !owner || !evidence)
    throw new Error(`Missing debt, owner, or exit evidence in ${id}.`);
  if (priority === 'P0' && status === 'DONE' && /<[^>]+>/.test(evidence))
    throw new Error(`P0 item ${id} cannot be DONE with placeholder evidence.`);
}
console.log(
  JSON.stringify(
    { status: 'ok', file: 'audit/100-percent/TECH-DEBT-REGISTER.md', items: rows.length },
    null,
    2,
  ),
);
