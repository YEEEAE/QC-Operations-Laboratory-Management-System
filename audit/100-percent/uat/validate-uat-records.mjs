#!/usr/bin/env node
/* global console: readonly, process: readonly */
/*
 * UAT record validator — QC-100-CLOSURE-06.
 *
 * Validates the operator-filled UAT session CSV without inventing results.
 * A header-only file is STRUCTURALLY VALID with zero sessions and reports
 * "UAT EXECUTION REQUIRED" instead of fabricating participant evidence.
 *
 * Usage:
 *   node validate-uat-records.mjs --session <sessions.csv> [--release <sha>]
 *
 * Exit codes:
 *   0 — structurally valid (includes the zero-session / not-executed case)
 *   1 — structural or content error (bad header, bad enum, bad timestamps, SHA mismatch)
 *   2 — usage error
 */

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

const TASK_SUCCESS = new Set(['yes', 'no']);
const ASSISTANCE = new Set(['none', 'clarification', 'coaching']);
const SEVERITY = new Set(['BLOCKER', 'CRITICAL', 'MAJOR', 'MINOR', 'COSMETIC', 'NONE']);
const SCENARIO_STATUS = new Set(['PASS', 'FAIL', 'BLOCKED', 'NOT EXECUTED', 'NOT APPLICABLE']);
const ACCEPT_REJECT = new Set(['ACCEPT', 'REJECT', 'BLOCKED', 'NOT EXECUTED']);

function fail(message) {
  console.log(`FAIL: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const out = { mode: null, release: null, files: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--session') {
      out.mode = 'session';
    } else if (arg === '--release') {
      i += 1;
      out.release = argv[i] ?? null;
      if (!out.release) {
        console.log('FAIL: --release requires a value');
        process.exit(2);
      }
    } else if (arg.startsWith('-')) {
      console.log(`FAIL: unknown flag ${arg}`);
      process.exit(2);
    } else {
      out.files.push(arg);
    }
  }
  if (out.mode !== 'session' || out.files.length === 0) {
    console.log('Usage: node validate-uat-records.mjs --session <sessions.csv> [--release <sha>]');
    process.exit(2);
  }
  return out;
}

function parseCsv(text) {
  return text
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .map((line) => line.split(',').map((cell) => cell.trim()));
}

function isInt(value) {
  return /^-?\d+$/.test(value);
}

function main() {
  const { release, files } = parseArgs(process.argv.slice(2));

  for (const file of files) {
    let rows;
    try {
      rows = parseCsv(readFileSync(file, 'utf8'));
    } catch {
      fail(`cannot read file ${file}`);
    }
    if (rows.length === 0) {
      fail(`empty file ${file}: header row is required`);
    }
    const header = rows[0];
    const missing = EXPECTED_HEADER.filter((col) => !header.includes(col));
    const extra = header.filter((col) => !EXPECTED_HEADER.includes(col));
    if (missing.length > 0 || extra.length > 0) {
      fail(
        `invalid header in ${file}: missing [${missing.join(';')}] extra [${extra.join(';')}] — expected ${EXPECTED_HEADER.length} columns`,
      );
    }

    const data = rows.slice(1);
    if (data.length === 0) {
      console.log(
        `UAT EXECUTION REQUIRED: ${file} has a valid header and sessions=0 — no participant evidence recorded yet.`,
      );
      console.log('sessions=0');
      continue;
    }

    let passCount = 0;
    data.forEach((cells, index) => {
      const line = index + 2;
      const record = Object.fromEntries(header.map((col, i) => [col, cells[i] ?? '']));
      const required = [
        'session_id',
        'release_sha',
        'environment',
        'participant_role',
        'task_id',
        'start_time',
        'end_time',
      ];
      for (const col of required) {
        if (!record[col]) fail(`${file}:${line}: required column ${col} is empty`);
      }
      const start = Date.parse(record.start_time);
      const end = Date.parse(record.end_time);
      if (Number.isNaN(start)) fail(`${file}:${line}: start_time is not a valid timestamp`);
      if (Number.isNaN(end)) fail(`${file}:${line}: end_time is not a valid timestamp`);
      if (end < start) fail(`${file}:${line}: end_time is before start_time`);
      for (const col of [
        'time_on_task_seconds',
        'error_count',
        'backtracking_count',
        'wrong_action_attempts',
      ]) {
        if (!isInt(record[col]) || Number(record[col]) < 0)
          fail(`${file}:${line}: ${col} must be a non-negative integer`);
      }
      if (!TASK_SUCCESS.has(record.task_success))
        fail(`${file}:${line}: task_success must be yes|no`);
      if (!ASSISTANCE.has(record.assistance))
        fail(`${file}:${line}: assistance must be none|clarification|coaching`);
      if (!SEVERITY.has(record.severity))
        fail(`${file}:${line}: severity must be BLOCKER|CRITICAL|MAJOR|MINOR|COSMETIC|NONE`);
      if (!SCENARIO_STATUS.has(record.scenario_status)) {
        fail(
          `${file}:${line}: scenario_status must be PASS|FAIL|BLOCKED|NOT EXECUTED|NOT APPLICABLE`,
        );
      }
      if (!ACCEPT_REJECT.has(record.task_accept_reject)) {
        fail(`${file}:${line}: task_accept_reject must be ACCEPT|REJECT|BLOCKED|NOT EXECUTED`);
      }
      if (release && record.release_sha !== release) {
        fail(
          `${file}:${line}: release_sha ${record.release_sha} does not match pinned release ${release}`,
        );
      }
      if (record.scenario_status === 'PASS') passCount += 1;
    });

    console.log(`OK: ${file} structurally valid — sessions=${data.length} pass=${passCount}`);
  }
}

main();
