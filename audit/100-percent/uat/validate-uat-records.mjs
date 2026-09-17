#!/usr/bin/env node
/* global console:readonly, process:readonly */
/* Fail-closed validator: validates operator-entered UAT evidence; never invents results. */
import { readFileSync } from 'node:fs';

const EXPECTED_HEADER = [
  'session_id',
  'release_sha',
  'environment',
  'participant_role',
  'task_id',
  'start_time',
  'end_time',
  'time_on_task_seconds',
  'task_success',
  'error_count',
  'backtracking_count',
  'failed_navigation_count',
  'form_correction_count',
  'assistance',
  'wrong_action_attempts',
  'confidence_1_to_5',
  'seq_1_to_7',
  'observations',
  'severity',
  'participant_comments',
  'scenario_status',
  'task_accept_reject',
];
const TASK_IDS = new Set([
  'T-UAT-01',
  'T-UAT-02',
  'T-UAT-03',
  'T-UAT-04',
  'T-UAT-05',
  'T-UAT-06',
  'T-UAT-07',
  'T-UAT-08',
  'T-UAT-09',
  'T-UAT-10',
  'T-UAT-11',
  'T-UAT-12',
  'T-UAT-13',
  'T-UAT-14',
  'T-UAT-15',
  'T-UAT-16',
  'T-UAT-17',
  'T-UAT-18',
  'T-UAT-19',
  'N-UAT-01',
  'N-UAT-02',
  'N-UAT-03',
  'N-UAT-04',
  'N-UAT-05',
  'N-UAT-06',
  'N-UAT-07',
  'A-UAT-01',
  'A-UAT-02',
  'A-UAT-03',
  'A-UAT-04',
]);
const ENVIRONMENTS = new Set(['test', 'staging', 'staging-uastest']);
const ROLES = new Set([
  'QC Employee',
  'QC Inspector',
  'Laboratory User',
  'Supervisor',
  'Manager',
  'Administrator',
  'Auditor',
  'SYSTEM_OWNER',
]);
const SHA = /^[0-9a-f]{40}$/i;
const ENUMS = {
  task_success: new Set(['yes', 'no']),
  assistance: new Set(['none', 'clarification', 'coaching']),
  severity: new Set(['BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR', 'COSMETIC', 'NONE']),
  scenario_status: new Set(['PASS', 'FAIL', 'BLOCKED', 'NOT EXECUTED', 'NOT APPLICABLE']),
  task_accept_reject: new Set(['ACCEPT', 'REJECT', 'BLOCKED', 'NOT EXECUTED']),
};
function fail(message) {
  console.log(`FAIL: ${message}`);
  process.exit(1);
}
function parseArgs(argv) {
  const out = { file: null, release: null };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--session') continue;
    else if (argv[i] === '--release') out.release = argv[++i];
    else if (argv[i]?.startsWith('-')) {
      console.log(`FAIL: unknown flag ${argv[i]}`);
      process.exit(2);
    } else if (!out.file) out.file = argv[i];
  }
  if (!out.file) {
    console.log('Usage: node validate-uat-records.mjs --session <sessions.csv> [--release <SHA>]');
    process.exit(2);
  }
  return out;
}
function parseCsv(text) {
  const rows = [];
  let row = [],
    cell = '',
    quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (ch === '"') {
      if (quoted && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else quoted = !quoted;
    } else if (ch === ',' && !quoted) {
      row.push(cell.trim());
      cell = '';
    } else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(cell.trim());
      cell = '';
      if (row.some((v) => v !== '')) rows.push(row);
      row = [];
    } else cell += ch;
  }
  if (quoted) fail('unterminated quoted CSV field');
  if (cell.length || row.length) {
    row.push(cell.trim());
    rows.push(row);
  }
  return rows;
}
function isInt(value) {
  return /^\d+$/.test(value);
}
function main() {
  const { file, release } = parseArgs(process.argv.slice(2));
  let rows;
  try {
    rows = parseCsv(readFileSync(file, 'utf8'));
  } catch {
    fail(`cannot read file ${file}`);
  }
  if (!rows.length) fail(`empty file ${file}: header row is required`);
  if (rows[0].length !== EXPECTED_HEADER.length || rows[0].some((v, i) => v !== EXPECTED_HEADER[i]))
    fail('invalid header: columns must match the controlled UAT contract exactly');
  const data = rows.slice(1);
  if (!data.length) {
    console.log(
      `UAT EXECUTION REQUIRED: ${file} has a valid header and sessions=0 — no participant evidence recorded yet.`,
    );
    console.log('sessions=0');
    return;
  }
  const seen = new Set();
  let passCount = 0;
  data.forEach((cells, index) => {
    const line = `${file}:${index + 2}`;
    if (cells.length !== EXPECTED_HEADER.length)
      fail(`${line}: expected ${EXPECTED_HEADER.length} columns, got ${cells.length}`);
    const record = Object.fromEntries(EXPECTED_HEADER.map((col, i) => [col, cells[i]]));
    for (const field of [
      'session_id',
      'release_sha',
      'environment',
      'participant_role',
      'task_id',
      'start_time',
      'end_time',
      'observations',
      'participant_comments',
    ])
      if (!record[field]) fail(`${line}: required column ${field} is empty`);
    if (!SHA.test(record.release_sha))
      fail(`${line}: release_sha must be an exact 40-character Git SHA`);
    if (release && record.release_sha.toLowerCase() !== release.toLowerCase())
      fail(`${line}: release_sha does not match pinned release`);
    if (!ENVIRONMENTS.has(record.environment))
      fail(`${line}: environment is not a UAT environment`);
    if (!ROLES.has(record.participant_role)) fail(`${line}: participant_role is not controlled`);
    if (!TASK_IDS.has(record.task_id)) fail(`${line}: unknown task_id ${record.task_id}`);
    const key = `${record.session_id}\u0000${record.task_id}`;
    if (seen.has(key)) fail(`${line}: duplicate session_id/task_id evidence`);
    seen.add(key);
    const start = Date.parse(record.start_time),
      end = Date.parse(record.end_time);
    if (Number.isNaN(start) || Number.isNaN(end))
      fail(`${line}: start_time/end_time are invalid timestamps`);
    if (end < start) fail(`${line}: end_time is before start_time`);
    for (const field of [
      'time_on_task_seconds',
      'error_count',
      'backtracking_count',
      'failed_navigation_count',
      'form_correction_count',
      'wrong_action_attempts',
    ])
      if (!isInt(record[field])) fail(`${line}: ${field} must be a non-negative integer`);
    if (Number(record.time_on_task_seconds) !== Math.round((end - start) / 1000))
      fail(`${line}: time_on_task_seconds must match start/end timestamps`);
    if (
      !isInt(record.confidence_1_to_5) ||
      Number(record.confidence_1_to_5) < 1 ||
      Number(record.confidence_1_to_5) > 5
    )
      fail(`${line}: confidence_1_to_5 must be 1..5`);
    if (!isInt(record.seq_1_to_7) || Number(record.seq_1_to_7) < 1 || Number(record.seq_1_to_7) > 7)
      fail(`${line}: seq_1_to_7 must be 1..7`);
    for (const [field, values] of Object.entries(ENUMS))
      if (!values.has(record[field])) fail(`${line}: ${field} has invalid value`);
    if (
      record.scenario_status === 'PASS' &&
      (record.task_success !== 'yes' || record.task_accept_reject !== 'ACCEPT')
    )
      fail(`${line}: PASS requires success=yes and acceptance=ACCEPT`);
    if (record.scenario_status === 'FAIL' && record.task_accept_reject !== 'REJECT')
      fail(`${line}: FAIL requires acceptance=REJECT`);
    if (record.scenario_status === 'BLOCKED' && record.task_accept_reject !== 'BLOCKED')
      fail(`${line}: BLOCKED requires acceptance=BLOCKED`);
    if (record.scenario_status === 'PASS') passCount += 1;
  });
  console.log(`OK: ${file} structurally valid — sessions=${data.length} pass=${passCount}`);
}
main();
