import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { routes } from '../../src/shared/routing/routes.ts';

const root = process.cwd();
const outDir = 'audit/2026-10-02';
const outputNames = ['coverage-register.json', 'coverage-register.md', 'coverage-register.html'];
const read = (p) => readFile(path.join(root, p), 'utf8');
const sha = (s) => createHash('sha256').update(s).digest('hex');
const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, encoding: 'utf8' }).trim();
const escape = (s = '') => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

const [recon, trace, domainAudit, releaseGate, auditHtml, verification, promptHtml, postPrompts] = await Promise.all([
  read('Documents/REQUIREMENTS-RECONCILIATION.md'),
  read('Documents/REQUIREMENTS-TRACEABILITY.md'),
  read('audit/100-percent/QC-CLOSURE-017-FINAL-80-DOMAIN-AUDIT.md'),
  read('audit/100-percent/RELEASE-GATE.md'),
  read('audit/2026-10-02/2026-09-30-ADAPTIVE-PAGE-BY-PAGE-FULL-SYSTEM-AUDIT.html'),
  read('audit/2026-10-02/post-implementation/verification-data.json'),
  read('audit/2026-10-02/QC-100-PERCENT-ADAPTIVE-EXECUTION-PROMPTS-2026-09-30.html'),
  read('audit/QC-POST-IMPLEMENTATION-REMAINING-TO-100-PROMPTS.html'),
]);
const verificationData = JSON.parse(verification);
const head = run('git', ['rev-parse', 'HEAD']);
const branch = run('git', ['branch', '--show-current']);
const files = run('git', ['ls-files', '-co', '--exclude-standard']).split('\n').filter(Boolean)
  .filter((f) => !outputNames.includes(f) && !f.startsWith(`${outDir}/coverage-register.`) && !/(^|\/)(\.env($|\.)|.*\.pem$|.*\.key$)/i.test(f))
  .sort();
const treeHash = createHash('sha256');
for (const f of files) {
  if (!existsSync(path.join(root, f))) continue;
  treeHash.update(f).update('\0').update(await readFile(path.join(root, f))).update('\0');
}
const fingerprint = treeHash.digest('hex');
const stampedAt = new Date().toISOString();
const migrationFiles = (await import('node:fs/promises')).readdir(path.join(root, 'db/migrations'));
const migrations = (await migrationFiles).filter((f) => f.endsWith('.sql')).sort();
const sourceSchemaHead = migrations.at(-1)?.replace(/\.sql$/, '') ?? null;
const sourceRefs = {
  requirements: 'Documents/REQUIREMENTS-RECONCILIATION.md',
  approvedRequirements: 'Documents/REQUIREMENTS-TRACEABILITY.md',
  routeRegistry: 'src/shared/routing/routes.ts',
  routeAcceptance: 'Documents/ROUTE-ACCEPTANCE-MATRIX.md',
  domains: 'audit/100-percent/QC-CLOSURE-017-FINAL-80-DOMAIN-AUDIT.md',
  releaseGateChecklist: 'audit/100-percent/RELEASE-GATE.md',
  historicalAudit: 'audit/2026-10-02/2026-09-30-ADAPTIVE-PAGE-BY-PAGE-FULL-SYSTEM-AUDIT.html',
  historicalEvidence: 'audit/2026-10-02/post-implementation/verification-data.json',
  promptPlan: 'audit/QC-POST-IMPLEMENTATION-REMAINING-TO-100-PROMPTS.html',
};

const baseEvidence = () => ({
  state: 'NOT VERIFIED', accepted: false, source: null, observedAt: null,
  candidateSha: head, dirtyFingerprint: fingerprint, runtime: null,
  sourceSchemaHead, appliedSchema: null, buildIdentity: null,
  artifactPath: null, command: null, resultReference: null,
  rationale: 'لا يوجد دليل تنفيذ جديد مقبول مربوط بهذا المرشح؛ الأرشيف التاريخي لا يثبت الحالة الحالية.',
});
const rows = [];
function add({ id, kind, group, reference, title, page = null, role = null, state = 'NOT RECONCILED', criterion, owner, prompt = null, dependencies = [], source, denominator = true, evidence = baseEvidence(), remainingWork }) {
  rows.push({ id, kind, group, reference, title, page, role, state, criterion, owner, responsiblePrompt: prompt, dependencies, denominator: denominator ? 'INCLUDED' : 'DESCRIPTIVE', evidence, source, remainingWork });
}

// Approved requirement reconciliation: exactly one scored row per current stable requirement family.
const reqLines = recon.split('\n').filter((line) => /^\| REQ-[A-Z0-9-]+ \| RC-[0-9-]+ \|/.test(line));
for (const line of reqLines) {
  const cells = line.split('|').slice(1, -1).map((x) => x.trim());
  if (cells.length < 9) continue;
  const [reqId, rcId, statement, sourceDoc, objective, applicability, capability, task, evidenceRef] = cells;
  add({ id: `REQ:${reqId}`, kind: 'requirement', group: 'requirements', reference: `${reqId} / ${rcId}`, title: statement, criterion: `يُثبت المطلب ${reqId} في كل نطاق تطبيق موثق (${applicability}) باختبارات/قبول مناسبين ودليل مربوط بالمرشح الحالي؛ لا يكفي وجود الكود أو مرجع تاريخي.`, owner: task || 'QC/QMS owner assignment required', prompt: task || 'QC-POST-100-017', source: [sourceRefs.requirements, sourceDoc, evidenceRef], state: /POLICY-DEPENDENT|SOURCE-DEPENDENT/.test(evidenceRef) ? 'BLOCKED' : 'NOT VERIFIED', denominator: capability !== 'OPTIONAL', remainingWork: `إعادة تنفيذ دليل ${evidenceRef} على المرشح الحالي؛ قرار السياسة/المصدر إن كان معلقًا: ${evidenceRef}.` });
}

const personas = [
  ['employee', 'Employee'], ['supervisor', 'Supervisor'], ['manager', 'Manager'],
  ['admin', 'Admin'], ['qcm', 'QCM'], ['system_owner', 'Named yazeed/SYSTEM_OWNER'],
];
const historicalById = new Map(verificationData.pages.map((p) => [p.id, p]));
for (const route of routes) {
  const hist = historicalById.get(route.id);
  const card = (auditHtml.match(new RegExp(`data-route-id="${route.id}"[\\s\\S]{0,3000}?QC-PAGE-F-[0-9]+`, 'i')) ?? [])[0] ?? null;
  for (const [roleId, roleName] of personas) {
    const expected = route.visibility === 'PUBLIC' ? 'public response' : route.visibility === 'YAZEED_ONLY' ? 'allow only active named SYSTEM_OWNER yazeed' : 'allow active authenticated persona; deny guest/disabled';
    add({ id: `PAGE:${route.id}:${roleId}`, kind: 'page-role', group: 'pages', reference: `${route.id} ${route.path}`, title: `${route.title} — role visibility`, page: route.path, role: roleName, state: 'NOT VERIFIED', criterion: `على ${route.path}، تحقق route visibility=${route.visibility} وفق pageAccessDecision؛ المتوقع: ${expected}. Mutation capability لا تُستنتج من رؤية الصفحة.`, owner: `QC/QMS route acceptance owner for ${route.id}`, prompt: 'QC-POST-100-017', dependencies: ['candidate-bound route acceptance', 'persona fixture/grants', 'HTTP/browser evidence'], source: [route.file, sourceRefs.routeRegistry, sourceRefs.routeAcceptance, ...(card ? [sourceRefs.historicalAudit] : [])], remainingWork: `تنفيذ قبول ${route.id} بدور ${roleName} على المرشح الحالي مع fixture grants/scope/state ودليل HTTP/browser؛ reconcile applicability/action states من بطاقة المسار.` });
  }
  const checks = hist?.checks ?? [];
  if (checks.length) {
    for (const check of checks) add({ id: `PAGECHECK:${route.id}:${check.id}`, kind: 'page-check', group: 'pages', reference: `${route.id} / ${check.id}`, title: check.criterion, page: route.path, role: 'Applicable persona per reconciled route card', state: 'NOT VERIFIED', criterion: check.criterion, owner: 'QC/QMS route acceptance owner', prompt: 'QC-POST-100-017', dependencies: ['approved applicability reconciliation', 'exact candidate evidence'], source: [route.file, sourceRefs.historicalEvidence], remainingWork: `إعادة فحص المعيار على ${route.path}؛ الدليل السابق مربوط بـ${verificationData.head} ولا ينتقل تلقائيًا.` });
  } else {
    add({ id: `PAGECHECK:${route.id}:workflow-applicability`, kind: 'page-check', group: 'pages', reference: `${route.id} / workflow applicability`, title: 'Route-specific states, reads, actions, denial and recovery', page: route.path, role: 'Applicable roles per approved role matrix', state: 'BLOCKED', criterion: 'تحديد كل state/read/action/denial/recovery obligation من route card والوثائق المعتمدة، ثم قبول كل واحد بدليل candidate-bound.', owner: 'QC/QMS route acceptance owner', prompt: 'QC-POST-100-017', dependencies: ['approved route scenario inventory'], source: [route.file, sourceRefs.routeRegistry, sourceRefs.routeAcceptance], remainingWork: 'مصالحة حالات/أفعال المسار مع Route Matrix وapproved rules؛ لا يجوز منح N/A قبل قرار تطبيق موثق.' });
  }
}
// The two framework error pages are in the historical 88-file scope but not canonical routes.
for (const [name, file, pathName] of [['404', 'src/pages/404.astro', '/404'], ['500', 'src/pages/500.astro', '/500']]) {
  for (const [roleId, roleName] of personas) add({ id: `PAGE:RT-ERROR-${name}:${roleId}`, kind: 'page-role', group: 'pages', reference: `RT-ERROR-${name} ${pathName}`, title: `${name} recovery — role/error state`, page: pathName, role: roleName, state: 'NOT VERIFIED', criterion: `تحقق عرض ${name} واسترداد المستخدم دون تسريب أو ادعاء نجاح كتابة؛ يلزم السيناريو المنطبق واختبار المتصفح.`, owner: `QC/QMS error-recovery owner ${name}`, prompt: 'QC-POST-100-017', source: [file, sourceRefs.historicalAudit], remainingWork: `تشغيل سيناريو الخطأ ${name} مربوط بالمرشح ودور ${roleName}، والتحقق من الاسترداد/الرسالة.` });
}

// Preserve all 80 approved domain identities and previous evidence only as historical context.
const domainRows = [...domainAudit.matchAll(/^\|\s*(\d+)\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*$/gm)];
for (const m of domainRows) {
  const n = Number(m[1]);
  if (n < 1 || n > 80) continue;
  const id = `D${String(n).padStart(2, '0')}`;
  add({ id: `DOMAIN:${id}`, kind: 'domain', group: 'domains', reference: id, title: m[2].trim(), state: 'BLOCKED', criterion: `إثبات معايير القبول الملزمة الخاصة بمجال ${id} (${m[2].trim()}) على المرشح الحالي؛ لا ترحيل score تاريخي ولا متوسط يخفي فجوة.`, owner: `Domain owner ${id}; named accountable person not present in approved source`, prompt: 'QC-POST-100-017', source: [sourceRefs.domains, sourceRefs.requirements], remainingWork: `تحديد معيار الجزء ومقامه من ملف المجال الأصلي، وتعيين مالك مفوض؛ ثم إعادة القياس على المرشح الحالي. لا يوجد N/A أو دليل حالي.` });
}

// Current release checklist items and the separate 19-gate approval register are distinct scopes.
const gateChecklist = [...releaseGate.matchAll(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/gm)]
  .map((m) => [m[1].trim(), m[2].trim(), m[3].trim()])
  .filter(([name]) => !['Gate', 'Field'].includes(name) && !name.startsWith('---'));
for (let n = 0; n < gateChecklist.length; n++) {
  const [name, criterion, rule] = gateChecklist[n];
  add({ id: `GATE:CHECKLIST:${String(n + 1).padStart(2, '0')}`, kind: 'release-gate', group: 'gates', reference: `${String(n + 1).padStart(2, '0')} / ${name}`, title: name, state: 'NOT VERIFIED', criterion: `${criterion}; ${rule}`, owner: 'QC-100-12 / release governance owner', prompt: 'QC-POST-100-014', dependencies: ['exact candidate build/runtime evidence as applicable'], source: [sourceRefs.releaseGateChecklist], remainingWork: `توفير evidence ${name} على المرشح الحالي وفق قاعدة القبول؛ سجل الإطلاق نفسه يحتاج مراجعة مفوضة.` });
}
// The independent approved 19-gate set lacks canonical gate↔requirement/provider/signer/digest mapping.
const reconciledGateCount = [...domainAudit.matchAll(/(?:gate|بوابة)[^\n]{0,60}(\d+)\s*\/\s*(\d+)/gi)].map((m) => Math.max(+m[1], +m[2])).find((n) => n > 1) ?? verificationData?.gates?.length ?? 19;
for (let n = 1; n <= reconciledGateCount; n++) add({ id: `GATE:MASTER:${String(n).padStart(2, '0')}`, kind: 'release-gate-master', group: 'gates', reference: `Master production gate ${String(n).padStart(2, '0')}`, title: `Approved master gate ${String(n).padStart(2, '0')} — current canonical mapping unresolved`, state: 'BLOCKED', criterion: 'ربط gate بمتطلبات ومصدر دليل ومزود/موقّع/digest وسياسة حداثة وهوية مرشح ضمن سجل البوابات المعتمد؛ ثم إثباته على المرشح.', owner: 'QC-100-FINAL-014 / authorized release-governance owner', prompt: 'QC-POST-100-014', dependencies: ['approved master gate mapping', 'candidate-bound evidence provider'], source: ['audit/2026-10-02/handoff-QC-POST-100-014.md', sourceRefs.requirements], remainingWork: 'الاسم والربط والمالك المعتمد غير متاحين؛ لا تختلق mapping. بعد قرار المالك، اجمع دليلًا مربوطًا بـSHA/runtime/schema.' });

// Report sections: numbered content is scored only where a measurable criterion exists.
const sections = [...auditHtml.matchAll(/<h2 id="([^"]+)">([^<]+)<\/h2>/g)];
for (const [, sectionId, heading] of sections) {
  const isDescriptive = /المنهج|القرار النهائي|نتيجة تنفيذية/.test(heading);
  add({ id: `REPORT:${sectionId}`, kind: 'report-section', group: 'report-sections', reference: sectionId, title: heading, state: isDescriptive ? 'DESCRIPTIVE' : 'NOT VERIFIED', denominator: !isDescriptive, criterion: isDescriptive ? `قسم وصفي: ${heading}. لا تُنسب له نسبة مستقلة.` : `كل الادعاءات/المعايير القابلة للقياس في ${heading} لها صفوف ذرية في هذا السجل، مصدر ومقام معلن، وأدلة مقبولة أو حالة غير PASS.`, owner: `QC-POST-100-017 report reconciliation`, prompt: 'QC-POST-100-017', source: [sourceRefs.historicalAudit], remainingWork: isDescriptive ? 'لا نسبة؛ استخدم الصفوف الذرية المرتبطة إن ظهر claim قابل للقياس.' : 'مصالحة ادعاءات القسم مع الصفوف الذرية والروابط والمقامات.' });
}

// Findings from the full page audit and all current prompt IDs; historical report remains untouched.
const findingIds = new Set([...auditHtml.matchAll(/QC-PAGE-F-\d{3}/g)].map((m) => m[0]));
for (const m of promptHtml.matchAll(/QC-PAGE-F-\d{3}/g)) findingIds.add(m[0]);
const promptIds = new Set([
  ...[...promptHtml.matchAll(/id="(QC-(?:ADP26|ENV26)-\d{2})"/g)].map((m) => m[1]),
  ...[...postPrompts.matchAll(/id="(QC-POST-100-\d{3})"/g)].map((m) => m[1]),
  ...[...postPrompts.matchAll(/Prompt ID:\s*(QC-POST-100-\d{3})/g)].map((m) => m[1]),
]);
for (const f of findingIds) {
  const maybePrompt = [...promptIds].find((p) => promptHtml.includes(f) && promptHtml.indexOf(f) >= 0 && Math.abs(promptHtml.indexOf(p) - promptHtml.indexOf(f)) < 12000) ?? 'QC-POST-100-017';
  add({ id: `FINDING:${f}`, kind: 'finding', group: 'findings', reference: f, title: `Finding ${f} (original audit identity preserved)`, state: 'NOT VERIFIED', criterion: `إغلاق ${f} بمعيار القبول الأصلي في بطاقة التقرير أو تسجيل استمرار العيب؛ لا يعدّل السجل التاريخي.`, owner: maybePrompt, prompt: maybePrompt, source: [sourceRefs.historicalAudit, sourceRefs.promptPlan], remainingWork: `تحقق من حالة ${f} على المرشح الحالي، اربط كل route/task/evidence، وحدّث الحالة فقط في سجل التغطية الجديد.` });
}
// Include all 38 identities from the separate historical execution verification and all 9 findings it discovered.
for (const f of verificationData.findings ?? []) {
  const id = `FINDING:${f.id}`;
  if (rows.some((r) => r.id === id)) continue;
  const linkedPrompt = f.prompts?.[0] ?? 'QC-POST-100-017';
  add({ id, kind: 'finding', group: 'findings', reference: f.id, title: f.title, page: f.pages?.[0] ?? null, state: f.closure === 'CLOSED' ? 'NOT VERIFIED' : 'NOT VERIFIED', criterion: f.verification ?? f.fix ?? `تحقق من حالة ${f.id} على المرشح الحالي وأغلقه فقط بالدليل المطلوب.`, owner: linkedPrompt, prompt: linkedPrompt, dependencies: f.dependencies ?? [], source: [sourceRefs.historicalEvidence, ...(f.evidence ?? [])], remainingWork: `${f.currentEvidence ?? f.problem ?? 'أعد تقييم الفجوة على المرشح الحالي.'}؛ الأدلة القديمة لا تنتقل تلقائيًا.` });
}
for (const f of verificationData.newFindings ?? []) {
  const promptBlock = [...postPrompts.matchAll(/Prompt ID:\s*(QC-POST-100-\d{3})[\s\S]*?Trace:\s*([^\n]+)/g)].find((m) => m[2].includes(f.id));
  const linkedPrompt = promptBlock?.[1] ?? 'QC-POST-100-017';
  const matchingRoute = routes.find((r) => (f.pages ?? []).includes(r.id));
  add({ id: `FINDING:${f.id}`, kind: 'finding', group: 'findings', reference: f.id, title: f.title, page: matchingRoute?.path ?? f.pages?.[0] ?? null, state: 'NOT VERIFIED', criterion: f.verification ?? f.rootCauseAndReproduction ?? `إغلاق ${f.id} بمعيار القبول الأصلي على المرشح الحالي.`, owner: linkedPrompt, prompt: linkedPrompt, dependencies: f.dependencies ?? [], source: [sourceRefs.historicalEvidence, ...(f.sourceEvidence ?? [])], remainingWork: `${f.status}; runtime reproduction ${f.runtimeReproduction}; أعد التحقق على المرشح الحالي واربط أدلة القبول.` });
}
// New post-implementation findings/tasks recorded in current handoffs and register.
for (const id of promptIds) {
  const isNotStarted = /QC-ADP26-3[2-6]/.test(id);
  add({ id: `TASK:${id}`, kind: 'task', group: 'tasks', reference: id, title: `${id} — remaining work must be re-baselined`, state: isNotStarted ? 'NOT RUN' : 'NOT VERIFIED', criterion: `تنفيذ شروط القبول المكتوبة في ${id} على المرشح الحالي، أو إثبات كل ما أُنجز بدليل صالح وتحديد الجزء المتبقي.`, owner: id, prompt: id, dependencies: ['dependencies declared in prompt; unresolved owner decisions stay BLOCKED'], source: [sourceRefs.promptPlan, ...(id.startsWith('QC-POST') ? ['audit/QC-POST-IMPLEMENTATION-REMAINING-TO-100-PROMPTS.md'] : [sourceRefs.historicalAudit])], remainingWork: isNotStarted ? 'مهمة NOT STARTED حسب إعادة baseline الحالية؛ استخرج التنفيذ المطلوب والاعتمادية من prompt ثم نفذه فقط بعد حسم الصلاحيات والقرارات.' : 'راجع handoff الحديث؛ أعد الفحوص التي بطل ربطها بالمرشح الحالي، وسجل الأدلة المتبقية. لا تعتبر إغلاق البرومبت قبولًا نهائيًا.' });
}

// Fresh candidate metadata. The prior evidence candidate is explicitly not reused.
const counts = Object.fromEntries([...new Set(rows.map((r) => r.group))].map((g) => {
  const subset = rows.filter((r) => r.group === g && r.denominator === 'INCLUDED');
  const pass = subset.filter((r) => r.evidence.accepted && r.evidence.state === 'PASS').length;
  return [g, { numerator: pass, denominator: subset.length, percent: subset.length ? Number((100 * pass / subset.length).toFixed(2)) : null, pass, fail: subset.filter((r) => r.evidence.state === 'FAIL').length, blocked: subset.filter((r) => r.state === 'BLOCKED' || r.evidence.state === 'BLOCKED').length, notVerified: subset.filter((r) => r.state !== 'BLOCKED' && r.evidence.state === 'NOT VERIFIED').length, notRun: subset.filter((r) => r.state === 'NOT RUN' || r.evidence.state === 'NOT RUN').length }];
}));
const descriptive = rows.filter((r) => r.denominator === 'DESCRIPTIVE').length;
const applicable = rows.filter((r) => r.denominator === 'INCLUDED');
const overall = { numerator: applicable.filter((r) => r.evidence.accepted && r.evidence.state === 'PASS').length, denominator: applicable.length, percent: applicable.length ? Number((100 * applicable.filter((r) => r.evidence.accepted && r.evidence.state === 'PASS').length / applicable.length).toFixed(2)) : null };
const register = { schemaVersion: '1.0.0', promptId: 'QC-POST-100-017', generatedAt: stampedAt, candidate: { head: head, branch, dirty: true, dirtyFingerprint: fingerprint, fingerprintAlgorithm: 'sha256(sorted relative path + NUL + file bytes; excludes only the three generated deliverables, ignored files, and secret-named files)', runtime: `${run('node', ['--version'])} (outside project contract >=24.20.0 <25)`, packageManager: 'pnpm@11.25.0 (from package.json; execution not verified)', sourceSchemaHead, appliedSchema: null, buildIdentity: null }, baselines: { currentCanonicalRoutes: routes.length, currentFrameworkErrorPages: 2, reportPageFilesHistorical: 88, routeMatrixDocumentedCount: 85, reconciledRequirements: reqLines.length, approvedAuditDomains: domainRows.filter((m) => +m[1] >= 1 && +m[1] <= 80).length, productionGates: 19, historicalReportFindingIdentities: findingIds.size, historicalVerificationFindingIdentities: verificationData.findings?.length ?? 0, newlyDiscoveredFindingIdentities: verificationData.newFindings?.length ?? 0, promptIds: promptIds.size, oldVerificationCandidate: verificationData.head, oldVerificationCounts: verificationData.counts, discrepancy: 'Route matrix and historical review counts differ from current canonical registry; page files/routes/statuses re-baselined from current registry. Historical report untouched.' }, scoring: { formula: 'accepted PASS evidence rows / all mandatory applicable rows * 100', rules: ['FAIL, BLOCKED, NOT VERIFIED, NOT RUN remain in denominator and contribute zero numerator.', 'N/A excluded only with a documented applicability decision by an authorized owner; none were invented here.', 'No average can hide a failed mandatory subsection.', 'Product, demo, security, accessibility, and production readiness are separate indicators.', 'Historical evidence is not accepted for this candidate.'], overall, byGroup: counts, descriptiveRows: descriptive }, sources: sourceRefs, validation: { duplicateIds: [], missingOwners: [], missingCriteria: [], missingEvidenceBindings: [], unownedFindingIds: [], missingPromptIds: [], sourceRouteCount: routes.length, requirementRowCount: reqLines.length, domainRowCount: domainRows.filter((m) => +m[1] >= 1 && +m[1] <= 80).length, rowCount: rows.length }, rows };

const errors = [];
const seen = new Set();
for (const r of rows) {
  if (seen.has(r.id)) errors.push(`duplicate ${r.id}`); seen.add(r.id);
  if (!r.owner?.trim()) errors.push(`missing owner ${r.id}`);
  if (!r.criterion?.trim()) errors.push(`missing criterion ${r.id}`);
  if (!r.source?.length) errors.push(`missing source ${r.id}`);
  if (!r.evidence || !r.evidence.state || !r.evidence.candidateSha || !r.evidence.dirtyFingerprint) errors.push(`missing evidence binding ${r.id}`);
}
const domains = rows.filter((r) => r.kind === 'domain');
const required = rows.filter((r) => r.kind === 'requirement');
if (rows.filter((r) => r.kind === 'page-role').length !== (routes.length + 2) * personas.length) errors.push('page-role coverage differs from current route registry plus framework error pages');
if (required.length !== reqLines.length) errors.push('requirement row coverage differs from current reconciliation source');
if (domains.length !== domainRows.filter((m) => +m[1] >= 1).length) errors.push('domain coverage differs from current approved audit-domain source');
if (errors.length) throw new Error(`Coverage validation failed:\n${errors.join('\n')}`);
register.validation = { ...register.validation, duplicates: 0, missingOwners: 0, missingCriteria: 0, missingSources: 0, evidenceBindingsPresent: rows.length, routeSourceCount: routes.length, requirementRowCount: required.length, domainRowCount: domains.length, validationResult: 'PASS (structural only; no acceptance evidence)' };

const json = JSON.stringify(register, null, 2) + '\n';
const pct = (o) => `${o.numerator}/${o.denominator} (${o.percent}%)`;
const md = [
  '# QC-POST-100-017 — Coverage register', '',
  `Generated: ${stampedAt} · Candidate HEAD: ${head} · Dirty fingerprint: ${fingerprint}`, '',
  '> New measurement only. The historical audit and its scores are unchanged. This register gives no product, demo, security, accessibility, UAT, or production-ready claim.', '',
  '## Re-baselined denominators', '',
  '| Measure | Current denominator | Source / note |', '|---|---:|---|',
  `| Canonical page routes | ${routes.length} | current \`src/shared/routing/routes.ts\`; role rows include ${personas.length} personas per route |`,
  `| Framework error pages | 2 | current \`404.astro\`, \`500.astro\`; historical report total 88 page files |`,
  `| Approved reconciled requirements | ${required.length} | \`${sourceRefs.requirements}\`; sourced from approved traceability families |`,
  `| Approved audit domains | ${domains.length} | unchanged authorized domain set D01–D80; historical domain scores not carried forward |`,
  '| Production gates | 19 | authorized gate count retained; labels/mappings unresolved and BLOCKED |',
  `| Historic report finding IDs | ${findingIds.size} | report frozen; finding records copied by identifier only |`,
  `| Current prompt IDs | ${promptIds.size} | adaptive + post implementation prompt packs |`,
  `| Historical exact-candidate verification rows | ${verificationData.counts.PASS + verificationData.counts['NOT VERIFIED'] + verificationData.counts.FAIL} | candidate ${verificationData.head}; historical only |`, '',
  `Route mismatch: current registry has ${routes.length} routes; \`Documents/ROUTE-ACCEPTANCE-MATRIX.md\` says 85; the historical audit describes 88 page files (86 canonical + error pages at its freeze). This discrepancy is recorded, not silently reconciled.`, '',
  '## Current score', '',
  `**Overall: ${pct(overall)}.** Only accepted PASS evidence enters the numerator. Current rows are zero until fresh evidence is attached.`, '',
  '| Part | Score | BLOCKED | NOT VERIFIED |', '|---|---:|---:|---:|',
  ...Object.entries(counts).map(([g, c]) => `| ${g} | ${pct(c)} | ${c.blocked} | ${c.notVerified} |`), '',
  `Descriptive report rows: ${descriptive}; excluded from all denominators. No N/A decisions were made.`, '',
  '## Evidence binding', '',
  `The evidence slot for every row is bound to HEAD \`${head}\`, dirty fingerprint \`${fingerprint}\`, and source migration head \`${sourceSchemaHead}\`. Runtime, applied schema, and build identity are null; these rows therefore do not PASS. Previous-candidate evidence (including ${verificationData.head}) is retained as a source reference only.`, '',
  'Machine structural reconciliation: **PASS** — no duplicate IDs, missing owners/criteria/sources, or absent candidate/fingerprint fields; source totals checked (routes/requirements/domains). This validates register structure only, not human applicability or acceptance.', '',
  '## Row-level records', '',
  '| ID | Kind | Reference | Page | Role | State | Criterion / remaining work | Owner | Prompt | Evidence |',
  '|---|---|---|---|---|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.id} | ${r.kind} | ${r.reference} | ${r.page ?? ''} | ${r.role ?? ''} | ${r.state} | ${r.criterion} Remaining: ${r.remainingWork} | ${r.owner} | ${r.responsiblePrompt ?? ''} | ${r.evidence.state}: ${r.evidence.source ?? 'no execution evidence'}; SHA ${head}; fp ${fingerprint}; schema ${sourceSchemaHead}; runtime/build/applied schema NOT VERIFIED |`), '',
].join('\n');
const tableRows = rows.map((r) => `<tr data-group="${escape(r.group)}" data-state="${escape(r.state)}"><td>${escape(r.id)}</td><td>${escape(r.kind)}</td><td>${escape(r.reference)}</td><td>${escape(r.page ?? '')}</td><td>${escape(r.role ?? '')}</td><td>${escape(r.state)}</td><td>${escape(r.criterion)}<br><strong>Remaining:</strong> ${escape(r.remainingWork)}</td><td>${escape(r.owner)}</td><td>${escape(r.responsiblePrompt ?? '')}</td><td>${escape(r.evidence.state)} · <a href="../../${escape((Array.isArray(r.source) ? r.source[0] : r.source) ?? '')}">source</a></td></tr>`).join('\n');
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>QC-POST-100-017 Coverage Register</title><style>body{font:15px/1.55 system-ui;margin:2rem;background:#111b17;color:#eef5ed}main{max-width:1500px;margin:auto}a{color:#c8e98b}header,section{padding:1rem;background:#1b2922;margin:1rem 0;border-radius:8px}input,select{font:inherit;padding:.6rem}table{border-collapse:collapse;width:100%;font-size:13px}th,td{padding:.55rem;border:1px solid #526457;text-align:left;vertical-align:top}th{position:sticky;top:0;background:#25372d}.table{overflow:auto;max-height:75vh}code{overflow-wrap:anywhere}</style><main><header><h1>QC-POST-100-017 — Coverage register</h1><p>Generated ${escape(stampedAt)} · HEAD <code>${head}</code> · dirty fingerprint <code>${fingerprint}</code></p><p>New measurement only; historical report preserved. Overall ${pct(overall)}; zero fresh accepted evidence. Product, demo, security, accessibility, and production readiness are separate.</p><p>Current routes ${routes.length}; requirements ${required.length}; domains ${domains.length}; release gates 19; error pages 2. Route matrix docs say 85; current canonical source says ${routes.length}.</p><p>Structural validation PASS; applicability and human review remain BLOCKED/NOT VERIFIED. Runtime, applied schema and build identity are absent.</p></header><section><label>Search <input id="q" type="search"></label> <label>Group <select id="g"><option value="">All</option>${[...new Set(rows.map(r=>r.group))].map(g=>`<option>${escape(g)}</option>`).join('')}</select></label> <label>State <select id="s"><option value="">All</option>${[...new Set(rows.map(r=>r.state))].map(s=>`<option>${escape(s)}</option>`).join('')}</select></label><p>${rows.length} rows; denominator rows ${applicable.length}; descriptive rows ${descriptive}.</p></section><div class="table"><table><thead><tr><th>ID</th><th>Type</th><th>Reference</th><th>Page</th><th>Role</th><th>State</th><th>Acceptance criterion / work remaining</th><th>Owner</th><th>Prompt</th><th>Evidence/source</th></tr></thead><tbody>${tableRows}</tbody></table></div></main><script>const q=document.querySelector('#q'),g=document.querySelector('#g'),s=document.querySelector('#s');function filter(){for(const r of document.querySelectorAll('tbody tr'))r.hidden=(!r.innerText.toLowerCase().includes(q.value.toLowerCase()))||(g.value&&r.dataset.group!==g.value)||(s.value&&r.dataset.state!==s.value)}q.oninput=g.onchange=s.onchange=filter;</script></html>`;
await writeFile(path.join(root, outDir, outputNames[0]), json);
await writeFile(path.join(root, outDir, outputNames[1]), md);
await writeFile(path.join(root, outDir, outputNames[2]), html);
console.log(JSON.stringify({ result: 'PASS (structural only)', head, fingerprint, routes: routes.length, requirements: required.length, domains: domains.length, rows: rows.length, denominatorRows: applicable.length, overall, groups: counts, prompts: promptIds.size, findings: findingIds.size }, null, 2));
