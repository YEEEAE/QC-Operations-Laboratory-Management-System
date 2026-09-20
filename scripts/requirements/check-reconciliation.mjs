#!/usr/bin/env node
/* global console, process */

/**
 * QC-100-FINAL-026 — Requirements reconciliation guard.
 *
 * Machine-checkable invariants over the reconciliation register and the gap /
 * risk priority matrix. Documentation-consistency guard only; it proves the
 * register's structure and cross-references, not runtime behavior.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

const trace = read('Documents/REQUIREMENTS-TRACEABILITY.md');
const recon = read('Documents/REQUIREMENTS-RECONCILIATION.md');
const risk = read('Documents/RISK-REGISTER.md');
const prio = read('Documents/GAP-RISK-PRIORITY-MATRIX.md');
const policy = read('audit/100-percent/POLICY-CLOSURE-MATRIX.md');
const decisions = read('Documents/DECISION-ASSUMPTION-REGISTER-026.md');

const failures = [];
const check = (ok, message) => {
  if (!ok) failures.push(message);
};

// --- Collect requirement IDs ---------------------------------------------------
const tableIds = new Set();
for (const line of trace.split('\n')) {
  if (!line.trimStart().startsWith('|')) continue;
  for (const m of line.matchAll(/REQ-[A-Z]+-\d{3}/g)) tableIds.add(m[0]);
}
check(tableIds.size >= 250, `expected >=250 unique REQ table IDs, found ${tableIds.size}`);

const sectionCounts = {};
for (const id of tableIds) {
  const prefix = id.replace(/-\d{3}$/, '');
  sectionCounts[prefix] = (sectionCounts[prefix] ?? 0) + 1;
}
for (const [prefix, count] of Object.entries(sectionCounts)) {
  check(count <= 99, `${prefix} exceeds 2-digit budget (${count})`);
}

// --- Reconciliation register structure ------------------------------------------
const sections = new Map();
const sectionHeader = /^# RC-(\d{2}) — (.+)$/;
let current = null;
const allReconIds = [];
for (const line of recon.split('\n')) {
  const h = line.match(sectionHeader);
  if (h) {
    current = { last: new Map(), seen: new Set() };
    sections.set(h[2].trim(), current);
    continue;
  }
  if (current && line.trimStart().startsWith('| REQ-')) {
    const id = line.match(/REQ-[A-Z]+-\d{3}/)?.[0];
    if (id) {
      if (current.seen.has(id)) failures.push(`duplicate row ${id}`);
      current.seen.add(id);
      const prefix = id.replace(/-\d{3}$/, '');
      const prev = current.last.get(prefix) ?? 0;
      const num = Number(id.slice(-3));
      check(num === prev + 1, `non-sequential ID ${id}`);
      current.last.set(prefix, num);
      allReconIds.push(id);
    }
  }
}

const expectedSections = [
  'Authorization & security of controlled actions',
  'Controlled workflow & scientific integrity',
  'Data & concurrency integrity',
  'Audit, files & disclosure',
  'Availability, recovery & dependency',
  'AI governance',
  'Readiness, UAT & evidence governance',
  'Operations, usability & accessibility',
  'Product scope & governance',
];
for (const s of expectedSections) check(sections.has(s), `missing register section "${s}"`);

const totalRows = allReconIds.length;
check(totalRows === 100, `register must hold 100 requirement IDs, found ${totalRows}`);
check(new Set(allReconIds).size === totalRows, 'duplicate requirement IDs across register');

const idSet = new Set([...recon.matchAll(/REQ-[A-Z]+-\d{3}/g)].map((m) => m[0]));
for (const id of tableIds) {
  const prefix = id.replace(/-\d{3}$/, '');
  check(sectionCounts[prefix] > 99 || idSet.has(id), `${id} must appear verbatim in the register`);
}

const mandatoryCount = (recon.match(/\| MANDATORY \|/g) ?? []).length;
const optionalCount = (recon.match(/\| OPTIONAL \|/g) ?? []).length;
check(
  mandatoryCount + optionalCount === totalRows,
  `capability class count ${mandatoryCount}+${optionalCount} != ${totalRows}`,
);

const SOURCE_RE =
  /(BR-[A-Z]+-\d{3}|PERM-[A-Z-]+|TR-[A-Z-]+|RISK-\d{3}|P-\d{2}|PD-\d{2}|RD-\d{3}|QC-SYSTEM-DESIGN-CONSTITUTION|SYSTEM-INVARIANTS|DOMAIN-MAP|BUSINESS-RULES|ROLE-MATRIX|PERMISSION-MATRIX|STATE-MACHINES|DATA-MODEL|DATA-DICTIONARY|DATABASE-ARCHITECTURE|SECURITY-ARCHITECTURE|ERROR-ARCHITECTURE|OBSERVABILITY-ARCHITECTURE|DEPLOYMENT-ARCHITECTURE|UI-UX-SPECIFICATION|DESIGN-SYSTEM|UX-WRITING-GUIDE|COPY-GLOSSARY|REJECT-REPORTS|AI-PROVIDERS|BACKUP-RECOVERY-PLAN|RESTORE-DRILL-RUNBOOK|RENDER-MIGRATION-RUNBOOK|RENDER-DEPLOYMENT|RENDER-DATABASE-CONNECTION|UAT-ACCEPTANCE-PLAN|TESTING-STRATEGY|PRODUCT-ANALYTICS-MEASUREMENT-PLAN|FIRST-USE-DATA-MANIFEST|MASTER-DATA-STARTING-DATA|ROLE-OPERATING-GUIDES|SUPPORT-OWNERSHIP-REGISTER|INCIDENT-PROBLEM-RUNBOOK|INCIDENT-QUICK-REFERENCE|FIRST-DAY-OPERATING-CHECKLIST|ROUTE-MANIFEST-SPECIFICATION|ROUTE-MATRIX|PRODUCTION-READINESS-CHECKLIST|REQUIREMENTS-TRACEABILITY|AUTHORIZATION-VISIBILITY-DECISION|package\.json|POLICY-CLOSURE-MATRIX|audit\/)/;

for (const line of recon.split('\n')) {
  if (!line.trimStart().startsWith('| REQ-')) continue;
  const cols = line
    .split('|')
    .map((c) => c.trim())
    .filter(Boolean);
  check(
    cols.length === 9,
    `register row has ${cols.length} columns (expected 9): ${line.slice(0, 60)}`,
  );
  check(/QC-100-FINAL-\d{3}/.test(line), `row missing owning task: ${line.slice(0, 60)}`);
  check(/RC-\d{2}-\d{3}/.test(line), `row missing RC ID: ${line.slice(0, 60)}`);
  check(SOURCE_RE.test(line), `row missing source reference: ${line.slice(0, 60)}`);
}

// --- 80 audit domain IDs -----------------------------------------------------------
const audit80 = read('audit/100-percent/QC-CLOSURE-017-FINAL-80-DOMAIN-AUDIT.md');
const domainRows = new Set();
for (const line of audit80.split('\n')) {
  const m = line.match(/^\|\s*(\d{1,2})\s*\|/);
  if (m) domainRows.add(Number(m[1]));
}
for (let i = 1; i <= 80; i += 1) {
  check(domainRows.has(i), `audit domain row ${i} not found in the 80-domain closure audit`);
}
for (const c of [1, 21, 42, 53, 60, 61, 80]) {
  check(domainRows.has(c), `covered audit domain ${c} not present in the 80-domain audit`);
}
check(recon.includes('D01'), 'covered audit domain D01 not cited in register');
check(recon.includes('D21'), 'covered audit domain D21 not cited in register');
check(recon.includes('D42'), 'covered audit domain D42 not cited in register');
check(recon.includes('D53'), 'covered audit domain D53 not cited in register');
check(recon.includes('D60'), 'covered audit domain D60 not cited in register');
check(recon.includes('D61'), 'covered audit domain D61 not cited in register');
check(recon.includes('D80'), 'covered audit domain D80 not cited in register');
check(/80-domain scoring denominator is unchanged/.test(recon), 'denominator statement missing');

// --- Phase B decision/assumption integration -----------------------------------
const decisionSection = decisions.match(/## 3\. Open decision register([\s\S]*?)(?=\n## 4\.)/)?.[1];
check(Boolean(decisionSection), 'phase-B open decision section missing');
const decisionRows = (decisionSection ?? '')
  .split('\n')
  .filter((line) => line.trimStart().startsWith('| PD-'));
const decisionIds = new Set();
for (const line of decisionRows) {
  const cols = line
    .split('|')
    .map((c) => c.trim())
    .filter(Boolean);
  check(cols.length === 8, `decision row has ${cols.length} columns (expected 8)`);
  const ids = [...line.matchAll(/PD-\d{2}/g)].map((m) => m[0]);
  for (const id of ids) decisionIds.add(id);
  check(
    /^(OPEN|PARTIAL)$/.test(cols[1] ?? ''),
    `decision row has invalid current state: ${cols[0]}`,
  );
  check(
    Boolean(cols[2]) && (cols[3] ?? '').includes('?'),
    `decision row missing owner question: ${cols[0]}`,
  );
  check(
    Boolean(cols[4]) && Boolean(cols[5]) && Boolean(cols[6]),
    `decision row missing behavior/dependency/evidence: ${cols[0]}`,
  );
  const linkedRequirements = [...line.matchAll(/REQ-[A-Z]+-\d{3}/g)].map((m) => m[0]);
  check(linkedRequirements.length > 0, `decision row missing requirement linkage: ${cols[0]}`);
  for (const id of linkedRequirements)
    check(idSet.has(id), `decision ${cols[0]} references unknown requirement ${id}`);
}
const canonicalIndex = policy.match(/## Canonical index([\s\S]*?)(?=\n## )/)?.[1] ?? '';
const unresolvedDecisions = new Set();
for (const line of canonicalIndex.split('\n')) {
  if (!line.trimStart().startsWith('| PD-')) continue;
  const cols = line
    .split('|')
    .map((c) => c.trim())
    .filter(Boolean);
  const id = cols[0]?.match(/PD-\d{2}/)?.[0];
  if (id && ['OPEN', 'PARTIAL'].includes(cols[3] ?? '')) unresolvedDecisions.add(id);
}
for (const id of unresolvedDecisions)
  check(decisionIds.has(id), `unresolved policy decision ${id} missing from phase-B register`);
for (const id of decisionIds)
  check(
    unresolvedDecisions.has(id),
    `phase-B register includes non-open/non-partial decision ${id}`,
  );
check(decisionRows.length === 33, `expected 33 decision rows, found ${decisionRows.length}`);

const assumptions = (decisions.match(/^\| A026-\d{2} \|/gm) ?? []).length;
check(assumptions === 5, `expected 5 scoped assumptions, found ${assumptions}`);
const mappingSection =
  decisions.match(
    /## 4\. Extended discipline crosswalk \(traceability only\)([\s\S]*?)(?=\n## 5\.)/,
  )?.[1] ?? '';
const mappingRows = mappingSection
  .split('\n')
  .filter((line) => /^\| (Requirements Engineering|Product Design|Risk Management)/.test(line));
check(
  mappingRows.length === 3,
  `expected 3 extended discipline mappings, found ${mappingRows.length}`,
);
const mappedDomains = new Set();
for (const line of mappingRows) {
  const cols = line
    .split('|')
    .map((c) => c.trim())
    .filter(Boolean);
  check(cols.length === 6, `discipline mapping row has ${cols.length} columns (expected 6)`);
  for (const m of line.matchAll(/#(\d{1,2})\b/g)) mappedDomains.add(Number(m[1]));
  const linkedRisks = [...line.matchAll(/RISK-\d{3}/g)].map((m) => m[0]);
  check(linkedRisks.length > 0, `discipline mapping missing risk linkage: ${cols[0]}`);
  const knownRiskIds = new Set([...risk.matchAll(/RISK-\d{3}/g)].map((m) => m[0]));
  for (const id of linkedRisks)
    check(knownRiskIds.has(id), `discipline mapping references unknown risk ${id}`);
}
const expectedMappedDomains = new Set([1, 21, 42, 53, 60, 61, 80]);
check(
  [...mappedDomains].sort((a, b) => a - b).join(',') ===
    [...expectedMappedDomains].sort((a, b) => a - b).join(','),
  `phase-B discipline crosswalk must use only domains 1,21,42,53,60,61,80; found ${[...mappedDomains].join(',')}`,
);
check(
  /denominator invariant[\s\S]*?80 domains/i.test(decisions),
  'phase-B mapping must explicitly preserve the 80-domain denominator',
);

// --- Gap / risk priority matrix --------------------------------------------------
const gapRows = [];
for (const line of prio.split('\n')) {
  if (line.trimStart().startsWith('| G-026-')) {
    const cols = line
      .split('|')
      .map((c) => c.trim())
      .filter(Boolean);
    check(
      cols.length === 9,
      `gap row has ${cols.length} columns (expected 9): ${line.slice(0, 60)}`,
    );
    gapRows.push(cols);
  }
}
check(gapRows.length === 20, `expected 20 gap rows, found ${gapRows.length}`);
const allowedImpact = new Set(['1', '2', '3', '4', '5']);
for (const cols of gapRows) {
  const [id, , className, impact, likelihood, , band, owner] = cols;
  check(/^G-026-\d{2}$/.test(id), `bad gap id ${id}`);
  check(className === 'MANDATORY' || className === 'OPTIONAL', `bad capability class in ${id}`);
  check(allowedImpact.has(impact), `bad impact in ${id}`);
  check(likelihood === 'ASSESSMENT REQUIRED', `likelihood must stay ASSESSMENT REQUIRED in ${id}`);
  check(band === 'ASSESSMENT REQUIRED', `severity must stay ASSESSMENT REQUIRED in ${id}`);
  check(/QC-100-FINAL-\d{3}/.test(owner), `gap ${id} missing owning task`);
}
for (let i = 1; i < gapRows.length; i += 1) {
  check(
    Number(gapRows[i][3]) <= Number(gapRows[i - 1][3]),
    `gap priority order broken at ${gapRows[i][0]}`,
  );
}

const riskRows = [];
for (const line of prio.split('\n')) {
  if (line.trimStart().startsWith('| RISK-')) {
    const cols = line
      .split('|')
      .map((c) => c.trim())
      .filter(Boolean);
    check(
      cols.length === 9,
      `risk row has ${cols.length} columns (expected 9): ${line.slice(0, 60)}`,
    );
    riskRows.push(cols);
  }
}
check(riskRows.length === 34, `expected 34 risk rows, found ${riskRows.length}`);
const registerRiskIds = new Set();
for (const m of risk.matchAll(/RISK-\d{3}/g)) registerRiskIds.add(m[0]);
const prioRiskIds = new Set(riskRows.map((c) => c[0]));
check(registerRiskIds.size === 34, `expected 34 unique RISK IDs, found ${registerRiskIds.size}`);
for (const id of registerRiskIds)
  check(prioRiskIds.has(id), `risk ${id} missing from priority matrix`);
for (const cols of riskRows) {
  const [id, , , impact, likelihood] = cols;
  check(allowedImpact.has(impact), `bad impact in ${id}`);
  check(
    likelihood === 'ASSESSMENT REQUIRED',
    `risk ${id} likelihood must stay ASSESSMENT REQUIRED`,
  );
}
for (let i = 1; i < riskRows.length; i += 1) {
  check(
    Number(riskRows[i][3]) <= Number(riskRows[i - 1][3]),
    `risk priority order broken at ${riskRows[i][0]}`,
  );
}

// Every gap/risk row links back to register IDs
for (const line of prio.split('\n')) {
  if (!/^\| (G-026-|RISK-)/.test(line.trimStart())) continue;
  const linked = [...line.matchAll(/RC-\d{2}-\d{3}/g)].map((m) => m[0]);
  check(linked.length > 0, `priority row missing register linkage: ${line.slice(0, 60)}`);
}
const reconIds = new Set([...recon.matchAll(/RC-\d{2}-\d{3}/g)].map((m) => m[0]));
for (const m of prio.matchAll(/RC-\d{2}-\d{3}/g)) {
  check(reconIds.has(m[0]), `priority matrix references unknown register ID ${m[0]}`);
}

// --- Result --------------------------------------------------------------------------
if (failures.length > 0) {
  console.error(`reconciliation guard: ${failures.length} failure(s)`);
  for (const f of failures.slice(0, 40)) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(
  `reconciliation guard: PASS (requirements=${totalRows}, risks=${riskRows.length}, gaps=${gapRows.length}, decisions=${decisionRows.length}, assumptions=${assumptions}, mappedDomains=${mappedDomains.size}, domains=80)`,
);
