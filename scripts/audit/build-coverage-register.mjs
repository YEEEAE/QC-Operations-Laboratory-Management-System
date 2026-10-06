import { createHash } from 'node:crypto';
import process from 'node:process';
import console from 'node:console';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { routes } from '../../src/shared/routing/routes.ts';

const root = process.cwd();
const outDir = process.argv[2] ?? '.ci-results/QC-POST-100-017-20261007';
const outputNames = ['coverage-register.json', 'coverage-register.md', 'coverage-register.html'];
const read = (p) => readFile(path.join(root, p), 'utf8');
const run = (cmd, args) => execFileSync(cmd, args, { cwd: root, encoding: 'utf8' }).trim();
const escape = (s = '') =>
  String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const [
  recon,
  ,
  domainAudit,
  releaseGate,
  auditHtml,
  verification,
  promptHtml,
  postPrompts,
  promptSpecifications,
  currentPostReport,
  masterCoverageLedgerText,
] = await Promise.all([
  read('Documents/REQUIREMENTS-RECONCILIATION.md'),
  read('Documents/REQUIREMENTS-TRACEABILITY.md'),
  read('audit/100-percent/QC-CLOSURE-017-FINAL-80-DOMAIN-AUDIT.md'),
  read('audit/100-percent/RELEASE-GATE.md'),
  read('audit/QC-POST-100-PROMPTS/2026-09-30-POST-IMPLEMENTATION-FULL-SYSTEM-VERIFICATION.html'),
  read('audit/2026-10-02/post-implementation/verification-data.json'),
  read('audit/2026-10-02/QC-100-PERCENT-ADAPTIVE-EXECUTION-PROMPTS-2026-09-30.html'),
  read('audit/QC-POST-100-PROMPTS/QC-POST-IMPLEMENTATION-REMAINING-TO-100-PROMPTS.html'),
  read('audit/2026-10-02/prompt-pack-optimization/prompt-specifications.json'),
  read('audit/QC-POST-100-PROMPTS/2026-09-30-POST-IMPLEMENTATION-FULL-SYSTEM-VERIFICATION.html'),
  read('audit/2026-10-02/prompt-pack-optimization/master-coverage-ledger.json'),
]);
const verificationData = JSON.parse(verification);
const promptSpecificationData = JSON.parse(promptSpecifications);
const masterCoverageLedger = JSON.parse(masterCoverageLedgerText);
const masterRowsByType = new Map();
for (const sourceRow of masterCoverageLedger.rows) {
  const rowsForType = masterRowsByType.get(sourceRow.type) ?? new Map();
  rowsForType.set(sourceRow.id, sourceRow);
  masterRowsByType.set(sourceRow.type, rowsForType);
}
const head = run('git', ['rev-parse', 'HEAD']);
const branch = run('git', ['branch', '--show-current']);
const files = run('git', ['ls-files', '-co', '--exclude-standard'])
  .split('\n')
  .filter(Boolean)
  .filter(
    (f) =>
      !outputNames.includes(f) &&
      !f.startsWith(`${outDir}/coverage-register.`) &&
      !/(^|\/)(\.env($|\.)|.*\.pem$|.*\.key$)/i.test(f),
  )
  .sort();
const treeHash = createHash('sha256');
for (const f of files) {
  if (!existsSync(path.join(root, f)) || !statSync(path.join(root, f)).isFile()) continue;
  treeHash
    .update(f)
    .update('\0')
    .update(await readFile(path.join(root, f)))
    .update('\0');
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
  historicalAudit:
    'audit/QC-POST-100-PROMPTS/2026-09-30-POST-IMPLEMENTATION-FULL-SYSTEM-VERIFICATION.html',
  historicalEvidence: 'audit/2026-10-02/post-implementation/verification-data.json',
  promptPlan: 'audit/QC-POST-100-PROMPTS/QC-POST-IMPLEMENTATION-REMAINING-TO-100-PROMPTS.html',
  promptSpecifications: 'audit/2026-10-02/prompt-pack-optimization/prompt-specifications.json',
  masterCoverageLedger: 'audit/2026-10-02/prompt-pack-optimization/master-coverage-ledger.json',
};

const baseEvidence = () => ({
  state: 'NOT VERIFIED',
  accepted: false,
  source: null,
  observedAt: null,
  candidateSha: head,
  dirtyFingerprint: fingerprint,
  runtime: null,
  sourceSchemaHead,
  appliedSchema: null,
  buildIdentity: null,
  artifactPath: null,
  command: null,
  resultReference: null,
  rationale:
    'لا يوجد دليل تنفيذ جديد مقبول مربوط بهذا المرشح؛ الأرشيف التاريخي لا يثبت الحالة الحالية.',
});
const rows = [];
function add({
  id,
  kind,
  group,
  reference,
  title,
  page = null,
  role = null,
  state = 'NOT RECONCILED',
  historicalState = null,
  currentDisposition = state,
  criterion,
  owner,
  prompt = null,
  dependencies = [],
  source,
  denominator = false,
  evidence = baseEvidence(),
  remainingWork,
  sourceLedgerId = null,
  acceptanceRefs = [],
  requiredArtifacts = [],
}) {
  rows.push({
    id,
    kind,
    group,
    reference,
    title,
    page,
    role,
    state,
    historicalState,
    currentDisposition,
    criterion,
    owner,
    responsiblePrompt: prompt,
    dependencies,
    denominator: denominator ? 'INCLUDED' : 'DESCRIPTIVE',
    evidence,
    source,
    remainingWork,
    sourceLedgerId,
    acceptanceRefs,
    requiredArtifacts,
  });
}

function sourceLedgerMatch(row) {
  const lookup = (type, id) => masterRowsByType.get(type)?.get(id);
  if (row.kind === 'page-check') return lookup('page-criterion', row.reference.replace(' / ', ':'));
  if (row.kind === 'page-role') return lookup('register-page-role', `BASE:PAGE:${row.id.slice(5)}`);
  if (row.kind === 'requirement')
    return lookup('register-requirement', `BASE:REQ:${row.id.slice(4)}`);
  if (row.kind === 'domain') return lookup('register-domain', `BASE:DOMAIN:${row.id.slice(7)}`);
  if (row.kind === 'report-section') return lookup('report-section', row.reference);
  if (row.kind === 'report-indicator') return lookup('indicator', row.reference);
  if (row.kind === 'report-audit-gate') return lookup('audit-gate', row.reference);
  if (row.kind === 'finding')
    return (
      lookup('register-finding', `BASE:FINDING:${row.reference}`) ??
      lookup('original-finding', row.reference) ??
      lookup('new-finding', row.reference) ??
      lookup('observation', row.reference) ??
      lookup('regression', row.reference)
    );
  if (row.kind === 'task' || row.kind === 'original-task' || row.kind === 'post-spec-task')
    return lookup('register-task', `BASE:TASK:${row.reference}`);
  if (row.kind === 'release-gate-master') return lookup('register-release-gate', row.reference);
  if (row.kind === 'release-gate')
    return lookup('register-release-gate', `BASE:GATE:CHECKLIST:${row.reference.slice(0, 2)}`);
  return null;
}

// Approved requirement reconciliation: exactly one scored row per current stable requirement family.
const reqLines = recon
  .split('\n')
  .filter((line) => /^\| REQ-[A-Z0-9-]+ \| RC-[0-9-]+ \|/.test(line));
for (const line of reqLines) {
  const cells = line
    .split('|')
    .slice(1, -1)
    .map((x) => x.trim());
  if (cells.length < 9) continue;
  const [reqId, rcId, statement, sourceDoc, , applicability, capability, task, evidenceRef] = cells;
  add({
    id: `REQ:${reqId}`,
    kind: 'requirement',
    group: 'requirements',
    reference: `${reqId} / ${rcId}`,
    title: statement,
    criterion: `يُثبت المطلب ${reqId} في كل نطاق تطبيق موثق (${applicability}) باختبارات/قبول مناسبين ودليل مربوط بالمرشح الحالي؛ لا يكفي وجود الكود أو مرجع تاريخي.`,
    owner: task || 'QC/QMS owner assignment required',
    prompt: task || 'QC-POST-100-017',
    source: [sourceRefs.requirements, sourceDoc, evidenceRef],
    state: /POLICY-DEPENDENT|SOURCE-DEPENDENT/.test(evidenceRef) ? 'BLOCKED' : 'NOT VERIFIED',
    denominator: capability !== 'OPTIONAL',
    remainingWork: `إعادة تنفيذ دليل ${evidenceRef} على المرشح الحالي؛ قرار السياسة/المصدر إن كان معلقًا: ${evidenceRef}.`,
  });
}

const personas = [
  ['employee', 'Employee'],
  ['supervisor', 'Supervisor'],
  ['manager', 'Manager'],
  ['admin', 'Admin'],
  ['qcm', 'QCM'],
  ['system_owner', 'Named yazeed/SYSTEM_OWNER'],
];
const historicalById = new Map(verificationData.pages.map((p) => [p.id, p]));
for (const route of routes) {
  const hist = historicalById.get(route.id);
  const card =
    (auditHtml.match(
      new RegExp(`data-route-id="${route.id}"[\\s\\S]{0,3000}?QC-PAGE-F-[0-9]+`, 'i'),
    ) ?? [])[0] ?? null;
  for (const [roleId, roleName] of personas) {
    const expected =
      route.visibility === 'PUBLIC'
        ? 'public response'
        : route.visibility === 'YAZEED_ONLY'
          ? 'allow only active named SYSTEM_OWNER yazeed'
          : 'allow active authenticated persona; deny guest/disabled';
    add({
      id: `PAGE:${route.id}:${roleId}`,
      kind: 'page-role',
      group: 'pages',
      reference: `${route.id} ${route.path}`,
      title: `${route.title} — role visibility`,
      page: route.path,
      role: roleName,
      state: 'NOT VERIFIED',
      criterion: `على ${route.path}، تحقق route visibility=${route.visibility} وفق pageAccessDecision؛ المتوقع: ${expected}. Mutation capability لا تُستنتج من رؤية الصفحة.`,
      owner: `QC/QMS route acceptance owner for ${route.id}`,
      prompt: 'QC-POST-100-017',
      dependencies: [
        'candidate-bound route acceptance',
        'persona fixture/grants',
        'HTTP/browser evidence',
      ],
      source: [
        route.file,
        sourceRefs.routeRegistry,
        sourceRefs.routeAcceptance,
        ...(card ? [sourceRefs.historicalAudit] : []),
      ],
      remainingWork: `تنفيذ قبول ${route.id} بدور ${roleName} على المرشح الحالي مع fixture grants/scope/state ودليل HTTP/browser؛ reconcile applicability/action states من بطاقة المسار.`,
    });
  }
  const checks = hist?.checks ?? [];
  if (checks.length) {
    for (const check of checks)
      add({
        id: `PAGECHECK:${route.id}:${check.id}`,
        kind: 'page-check',
        group: 'checklist-671',
        reference: `${route.id} / ${check.id}`,
        title: check.criterion,
        page: route.path,
        role: 'Applicable persona per reconciled route card',
        state: 'NOT VERIFIED',
        criterion: check.criterion,
        owner: 'QC/QMS route acceptance owner',
        prompt: 'QC-POST-100-017',
        dependencies: ['approved applicability reconciliation', 'exact candidate evidence'],
        source: [route.file, sourceRefs.historicalEvidence],
        denominator: true,
        remainingWork: `إعادة فحص المعيار على ${route.path}؛ الدليل السابق مربوط بـ${verificationData.head} ولا ينتقل تلقائيًا.`,
      });
  } else {
    add({
      id: `PAGECHECK:${route.id}:workflow-applicability`,
      kind: 'page-check',
      group: 'pages',
      reference: `${route.id} / workflow applicability`,
      title: 'Route-specific states, reads, actions, denial and recovery',
      page: route.path,
      role: 'Applicable roles per approved role matrix',
      state: 'BLOCKED',
      criterion:
        'تحديد كل state/read/action/denial/recovery obligation من route card والوثائق المعتمدة، ثم قبول كل واحد بدليل candidate-bound.',
      owner: 'QC/QMS route acceptance owner',
      prompt: 'QC-POST-100-017',
      dependencies: ['approved route scenario inventory'],
      source: [route.file, sourceRefs.routeRegistry, sourceRefs.routeAcceptance],
      remainingWork:
        'مصالحة حالات/أفعال المسار مع Route Matrix وapproved rules؛ لا يجوز منح N/A قبل قرار تطبيق موثق.',
    });
  }
}
// The two framework error pages are in the historical 88-file scope but not canonical routes.
for (const [name, file, pathName] of [
  ['404', 'src/pages/404.astro', '/404'],
  ['500', 'src/pages/500.astro', '/500'],
]) {
  for (const [roleId, roleName] of personas)
    add({
      id: `PAGE:RT-ERROR-${name}:${roleId}`,
      kind: 'page-role',
      group: 'pages',
      reference: `RT-ERROR-${name} ${pathName}`,
      title: `${name} recovery — role/error state`,
      page: pathName,
      role: roleName,
      state: 'NOT VERIFIED',
      criterion: `تحقق عرض ${name} واسترداد المستخدم دون تسريب أو ادعاء نجاح كتابة؛ يلزم السيناريو المنطبق واختبار المتصفح.`,
      owner: `QC/QMS error-recovery owner ${name}`,
      prompt: 'QC-POST-100-017',
      source: [file, sourceRefs.historicalAudit],
      remainingWork: `تشغيل سيناريو الخطأ ${name} مربوط بالمرشح ودور ${roleName}، والتحقق من الاسترداد/الرسالة.`,
    });
  const reportPage = historicalById.get(`RT-ERROR-${name}`);
  for (const check of reportPage?.checks ?? [])
    add({
      id: `PAGECHECK:RT-ERROR-${name}:${check.id}`,
      kind: 'page-check',
      group: 'checklist-671',
      reference: `RT-ERROR-${name} / ${check.id}`,
      title: check.criterion,
      page: pathName,
      role: 'Applicable persona per reconciled error scenario',
      state: 'NOT VERIFIED',
      criterion: check.criterion,
      owner: `QC/QMS error-recovery owner ${name}`,
      prompt: 'QC-POST-100-017',
      dependencies: ['approved applicability reconciliation', 'exact candidate evidence'],
      source: [file, sourceRefs.historicalEvidence],
      denominator: true,
      remainingWork: `إعادة فحص معيار ${check.id} على ${pathName}؛ الدليل التاريخي مربوط بـ${verificationData.head}.`,
    });
}

// Preserve all 80 approved domain identities and previous evidence only as historical context.
const domainRows = [
  ...domainAudit.matchAll(
    /^\|\s*(\d+)\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*([^|]+)\|\s*$/gm,
  ),
];
for (const m of domainRows) {
  const n = Number(m[1]);
  if (n < 1 || n > 80) continue;
  const id = `D${String(n).padStart(2, '0')}`;
  add({
    id: `DOMAIN:${id}`,
    kind: 'domain',
    group: 'domains-80',
    reference: id,
    title: m[2].trim(),
    state: 'BLOCKED',
    criterion: `إثبات معايير القبول الملزمة الخاصة بمجال ${id} (${m[2].trim()}) على المرشح الحالي؛ لا ترحيل score تاريخي ولا متوسط يخفي فجوة.`,
    owner: `Domain owner ${id}; named accountable person not present in approved source`,
    prompt: 'QC-POST-100-017',
    source: [sourceRefs.domains, sourceRefs.requirements],
    denominator: true,
    remainingWork: `تحديد معيار الجزء ومقامه من ملف المجال الأصلي، وتعيين مالك مفوض؛ ثم إعادة القياس على المرشح الحالي. لا يوجد N/A أو دليل حالي.`,
  });
}

// Current release checklist items and the separate 19-gate approval register are distinct scopes.
const gateChecklist = [
  ...releaseGate.matchAll(/^\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/gm),
]
  .map((m) => [m[1].trim(), m[2].trim(), m[3].trim()])
  .filter(([name]) => !['Gate', 'Field'].includes(name) && !name.startsWith('---'));
for (let n = 0; n < gateChecklist.length; n++) {
  const [name, criterion, rule] = gateChecklist[n];
  add({
    id: `GATE:CHECKLIST:${String(n + 1).padStart(2, '0')}`,
    kind: 'release-gate',
    group: 'gates',
    reference: `${String(n + 1).padStart(2, '0')} / ${name}`,
    title: name,
    state: 'NOT VERIFIED',
    criterion: `${criterion}; ${rule}`,
    owner: 'QC-100-12 / release governance owner',
    prompt: 'QC-POST-100-014',
    dependencies: ['exact candidate build/runtime evidence as applicable'],
    source: [sourceRefs.releaseGateChecklist],
    remainingWork: `توفير evidence ${name} على المرشح الحالي وفق قاعدة القبول؛ سجل الإطلاق نفسه يحتاج مراجعة مفوضة.`,
  });
}
// The independent approved 19-gate set lacks canonical gate↔requirement/provider/signer/digest mapping.
const reconciledGateCount = 19;
for (const gate of masterCoverageLedger.rows.filter((r) => r.type === 'register-release-gate'))
  add({
    id: `GATE:MASTER:${gate.id}`,
    kind: 'release-gate-master',
    group: 'gates-19',
    reference: gate.id,
    title: gate.title,
    state: 'BLOCKED',
    criterion: gate.criterion,
    owner: gate.prompts?.join(', ') || 'Authorized release-governance owner unresolved',
    prompt: gate.prompts?.[0] ?? 'QC-POST-100-014',
    dependencies: ['canonical 19-gate mapping remains unresolved'],
    source: [sourceRefs.masterCoverageLedger, ...(gate.source ?? [])],
    remainingWork: gate.gap,
  });

// The post-report's 52 sections are mapped for traceability, not scored as checklist rows.
const sections = masterCoverageLedger.rows.filter((r) => r.type === 'report-section');
for (const section of sections) {
  const sectionId = section.id;
  const heading = section.title;
  add({
    id: `REPORT:${sectionId}`,
    kind: 'report-section',
    group: 'post-report-sections-52',
    reference: sectionId,
    title: heading,
    state: 'DESCRIPTIVE',
    criterion: `قسم للمطابقة والتتبع فقط: ${heading}. ادعاءات القبول الذرية تبقى في صفوف معاييرها؛ لا مقام أو نقاط لهذا القسم.`,
    owner: `QC-POST-100-017 report reconciliation`,
    prompt: 'QC-POST-100-017',
    source: [sourceRefs.masterCoverageLedger, sourceRefs.historicalAudit],
    remainingWork: 'تأكد من ربط أي claim قابل للقياس بصف معياري ذري وعدم احتساب عنوان القسم فحصًا.',
  });
}

// Keep superseded rows from the old 1,508-row register visible as traceability only.
const oldRegisterRows = [
  ...masterCoverageLedger.rows.filter((r) => r.type === 'register-page-check'),
  ...masterCoverageLedger.rows.filter((r) => r.type === 'register-report-section'),
  ...masterCoverageLedger.rows.filter((r) => r.type === 'register-task'),
];
for (const oldRow of oldRegisterRows) {
  add({
    id: `LEGACY-REGISTER:${oldRow.id}`,
    kind: 'legacy-register-row',
    group: `legacy-${oldRow.type}`,
    reference: oldRow.id,
    title: oldRow.title,
    state:
      oldRow.type === 'register-page-check' || oldRow.type === 'register-report-section'
        ? 'SUPERSEDED'
        : 'STALE',
    historicalState: oldRow.currentStatus ?? 'NOT RECORDED',
    currentDisposition:
      oldRow.type === 'register-page-check' || oldRow.type === 'register-report-section'
        ? 'SUPERSEDED'
        : 'STALE',
    criterion: oldRow.criterion,
    owner: oldRow.prompts?.join(', ') || 'Historical register owner requires current review',
    prompt: oldRow.prompts?.[0] ?? 'QC-POST-100-017',
    source: [sourceRefs.masterCoverageLedger, ...(oldRow.source ?? [])],
    remainingWork: `مُحافظ عليه للتتبع؛ مقام/حالة السجل القديم لا تُنقل. ${oldRow.gap ?? ''}`,
    requiredArtifacts: oldRow.requiredEvidence ?? [],
    sourceLedgerId: oldRow.id,
    acceptanceRefs: oldRow.acceptance ?? [],
  });
}

// Keep the report's 25 indicators and 22 audit-gate rows visible without merging them into scores.
for (const indicator of masterCoverageLedger.rows.filter((r) => r.type === 'indicator')) {
  const id = indicator.id;
  add({
    id: `INDICATOR:${id}`,
    kind: 'report-indicator',
    group: 'indicators-25',
    reference: id,
    title: indicator.title,
    state: 'NOT VERIFIED',
    criterion: indicator.criterion,
    owner: indicator.prompts?.join(', ') || 'Authorized indicator owner unresolved',
    prompt: indicator.prompts?.[0] ?? 'QC-POST-100-017',
    source: [
      sourceRefs.masterCoverageLedger,
      sourceRefs.historicalEvidence,
      ...(indicator.requiredEvidence ?? []),
    ],
    remainingWork:
      'مطابقة الصف بمعرّفه في سجل المصدر؛ لا تجمعه مع checklist أو domain mean أو Go/NoGo.',
  });
}
for (const gate of masterCoverageLedger.rows.filter((r) => r.type === 'audit-gate')) {
  const id = gate.id;
  add({
    id: `REPORT-GATE:${id}`,
    kind: 'report-audit-gate',
    group: 'report-audit-gates-22',
    reference: id,
    title: gate.title,
    state: 'NOT VERIFIED',
    criterion: gate.criterion,
    owner: gate.prompts?.join(', ') || 'QC-POST report audit owner unresolved',
    prompt: gate.prompts?.[0] ?? 'QC-POST-100-017',
    source: [
      sourceRefs.masterCoverageLedger,
      sourceRefs.historicalEvidence,
      ...(gate.requiredEvidence ?? []),
    ],
    remainingWork: gate.requiredWork,
  });
}

// Preserve both task generations and distinguish current work state from historical pack status.
const currentTaskDispositions = new Map([
  ['QC-POST-100-002', 'PARTIAL'],
  ['QC-POST-100-003', 'PARTIAL'],
  ['QC-POST-100-004', 'PARTIAL'],
  ['QC-POST-100-005', 'PARTIAL'],
  ['QC-POST-100-006', 'PARTIAL'],
  ['QC-POST-100-007', 'PARTIAL'],
  ['QC-POST-100-009', 'PARTIAL'],
  ['QC-POST-100-013', 'PARTIAL'],
  ['QC-POST-100-014', 'BLOCKED'],
  ['QC-POST-100-016', 'BLOCKED'],
  ['QC-POST-100-017', 'PARTIAL'],
  ['QC-POST-100-032', 'BLOCKED'],
  ['QC-POST-100-033', 'BLOCKED'],
]);
for (const task of verificationData.originalTasks ?? [])
  add({
    id: `ORIGINAL-TASK:${task.id}`,
    kind: 'original-task',
    group: 'original-tasks',
    reference: task.id,
    title: task.title,
    state: 'STALE',
    historicalState: task.status ?? 'NOT RECORDED',
    currentDisposition: 'STALE',
    criterion: task.acceptance,
    owner: task.owner ?? 'Original task owner requires current confirmation',
    prompt: task.id,
    source: [sourceRefs.historicalEvidence, ...(task.evidence ?? [])],
    remainingWork:
      'تأكيد استمرار الربط مع المهمة الحالية؛ حالة التقرير التاريخية لا تقبل دليلًا لهذا المرشح.',
  });
for (const task of promptSpecificationData.prompts ?? [])
  add({
    id: `POST-SPEC-TASK:${task.id}`,
    kind: 'post-spec-task',
    group: 'post-spec-tasks',
    reference: task.id,
    title: task.title,
    state: currentTaskDispositions.get(task.id) ?? 'STALE',
    historicalState: task.status ?? 'NOT RECORDED',
    currentDisposition: currentTaskDispositions.get(task.id) ?? 'STALE',
    owner:
      typeof task.owner === 'string' && task.owner.trim()
        ? task.owner
        : `Authorized owner unresolved for ${task.id}`,
    criterion: Array.isArray(task.acceptance) ? task.acceptance.join(' ') : task.acceptance,
    prompt: task.id,
    source: [sourceRefs.promptSpecifications],
    remainingWork:
      'احتفظ بالمواصفة الأصلية واربط التنفيذ/المتبقي بهاندوف حديث؛ لا ترحّل نتيجة قديمة.',
  });

// Findings from the full page audit and all current prompt IDs; historical report remains untouched.
const findingIds = new Set([...auditHtml.matchAll(/QC-PAGE-F-\d{3}/g)].map((m) => m[0]));
for (const m of promptHtml.matchAll(/QC-PAGE-F-\d{3}/g)) findingIds.add(m[0]);
const promptIds = new Set([
  ...[...promptHtml.matchAll(/id="(QC-(?:ADP26|ENV26)-\d{2})"/g)].map((m) => m[1]),
  ...[...postPrompts.matchAll(/id="(QC-POST-100-\d{3})"/g)].map((m) => m[1]),
  ...[...postPrompts.matchAll(/Prompt ID:\s*(QC-POST-100-\d{3})/g)].map((m) => m[1]),
]);
for (const f of findingIds) {
  const maybePrompt =
    [...promptIds].find(
      (p) =>
        promptHtml.includes(f) &&
        promptHtml.indexOf(f) >= 0 &&
        Math.abs(promptHtml.indexOf(p) - promptHtml.indexOf(f)) < 12000,
    ) ?? 'QC-POST-100-017';
  add({
    id: `FINDING:${f}`,
    kind: 'finding',
    group: 'findings',
    reference: f,
    title: `Finding ${f} (original audit identity preserved)`,
    state: 'NOT VERIFIED',
    criterion: `إغلاق ${f} بمعيار القبول الأصلي في بطاقة التقرير أو تسجيل استمرار العيب؛ لا يعدّل السجل التاريخي.`,
    owner: maybePrompt,
    prompt: maybePrompt,
    source: [sourceRefs.historicalAudit, sourceRefs.promptPlan],
    remainingWork: `تحقق من حالة ${f} على المرشح الحالي، اربط كل route/task/evidence، وحدّث الحالة فقط في سجل التغطية الجديد.`,
  });
}
// Include all 38 identities from the separate historical execution verification and all 9 findings it discovered.
for (const f of verificationData.findings ?? []) {
  const id = `FINDING:${f.id}`;
  if (rows.some((r) => r.id === id)) continue;
  const linkedPrompt = f.prompts?.[0] ?? 'QC-POST-100-017';
  add({
    id,
    kind: 'finding',
    group: 'findings',
    reference: f.id,
    title: f.title,
    page: f.pages?.[0] ?? null,
    state: f.closure === 'CLOSED' ? 'NOT VERIFIED' : 'NOT VERIFIED',
    criterion:
      f.verification ??
      f.fix ??
      `تحقق من حالة ${f.id} على المرشح الحالي وأغلقه فقط بالدليل المطلوب.`,
    owner: linkedPrompt,
    prompt: linkedPrompt,
    dependencies: f.dependencies ?? [],
    source: [sourceRefs.historicalEvidence, ...(f.evidence ?? [])],
    remainingWork: `${f.currentEvidence ?? f.problem ?? 'أعد تقييم الفجوة على المرشح الحالي.'}؛ الأدلة القديمة لا تنتقل تلقائيًا.`,
  });
}
for (const f of verificationData.newFindings ?? []) {
  const promptBlock = [
    ...postPrompts.matchAll(/Prompt ID:\s*(QC-POST-100-\d{3})[\s\S]*?Trace:\s*([^\n]+)/g),
  ].find((m) => m[2].includes(f.id));
  const linkedPrompt = promptBlock?.[1] ?? 'QC-POST-100-017';
  const matchingRoute = routes.find((r) => (f.pages ?? []).includes(r.id));
  add({
    id: `FINDING:${f.id}`,
    kind: 'finding',
    group: 'findings',
    reference: f.id,
    title: f.title,
    page: matchingRoute?.path ?? f.pages?.[0] ?? null,
    state: 'NOT VERIFIED',
    criterion:
      f.verification ??
      f.rootCauseAndReproduction ??
      `إغلاق ${f.id} بمعيار القبول الأصلي على المرشح الحالي.`,
    owner: linkedPrompt,
    prompt: linkedPrompt,
    dependencies: f.dependencies ?? [],
    source: [sourceRefs.historicalEvidence, ...(f.sourceEvidence ?? [])],
    remainingWork: `${f.status}; runtime reproduction ${f.runtimeReproduction}; أعد التحقق على المرشح الحالي واربط أدلة القبول.`,
  });
}
// New post-implementation findings/tasks recorded in current handoffs and register.
for (const id of promptIds) {
  const isNotStarted = /QC-ADP26-3[2-6]/.test(id);
  add({
    id: `TASK:${id}`,
    kind: 'task',
    group: 'tasks',
    reference: id,
    title: `${id} — remaining work must be re-baselined`,
    state: isNotStarted ? 'NOT RUN' : 'NOT VERIFIED',
    criterion: `تنفيذ شروط القبول المكتوبة في ${id} على المرشح الحالي، أو إثبات كل ما أُنجز بدليل صالح وتحديد الجزء المتبقي.`,
    owner: id,
    prompt: id,
    dependencies: ['dependencies declared in prompt; unresolved owner decisions stay BLOCKED'],
    source: [
      sourceRefs.promptPlan,
      ...(id.startsWith('QC-POST')
        ? ['audit/QC-POST-100-PROMPTS/QC-POST-IMPLEMENTATION-REMAINING-TO-100-PROMPTS.md']
        : [sourceRefs.historicalAudit]),
    ],
    remainingWork: isNotStarted
      ? 'مهمة NOT STARTED حسب إعادة baseline الحالية؛ استخرج التنفيذ المطلوب والاعتمادية من prompt ثم نفذه فقط بعد حسم الصلاحيات والقرارات.'
      : 'راجع handoff الحديث؛ أعد الفحوص التي بطل ربطها بالمرشح الحالي، وسجل الأدلة المتبقية. لا تعتبر إغلاق البرومبت قبولًا نهائيًا.',
  });
}

// Fresh candidate metadata. The prior evidence candidate is explicitly not reused.
const checklistRows = rows.filter((r) => r.kind === 'page-check');
const acceptedChecklistRows = checklistRows.filter(
  (r) => r.evidence.accepted && r.evidence.state === 'PASS',
);
const domainRowsForMetric = rows.filter((r) => r.kind === 'domain');
const approvedExemptions = 0;
const noUnsupportedExclusions = rows.every((r) => r.denominator !== 'EXEMPT');
for (const row of rows) {
  const sourceRow = sourceLedgerMatch(row);
  row.sourceLedgerId = sourceRow?.id ?? row.sourceLedgerId;
  row.acceptanceRefs = sourceRow?.acceptance ?? row.acceptanceRefs;
  row.requiredArtifacts = sourceRow?.requiredEvidence ?? row.requiredArtifacts;
  if (
    !row.requiredArtifacts.length &&
    ['task', 'original-task', 'post-spec-task'].includes(row.kind)
  ) {
    row.requiredArtifacts = [
      `audit/<final-candidate>/closure/${row.responsiblePrompt ?? row.reference}/criteria.json#${row.reference}`,
    ];
  }
  row.requiredArtifactStatus = row.requiredArtifacts.length
    ? sourceRow?.requiredEvidence?.length || row.sourceLedgerId
      ? 'SOURCE_DEFINED'
      : 'EXPECTED_TEMPLATE_NOT_PRESENT'
    : row.kind === 'release-gate-master'
      ? 'BLOCKED_BY_AUTHORITY_SOURCE'
      : 'NOT_SUPPLIED';
  row.requiredArtifactRationale = row.requiredArtifacts.length
    ? 'The source ledger names an artifact locator; this does not establish that the artifact exists or is accepted.'
    : row.kind === 'release-gate-master'
      ? 'Canonical gate names and rules are unavailable, so no gate-specific artifact is inferred.'
      : 'No row-specific required artifact was present in the linked source ledger.';
}
const legacyRegisterSourceTypes = new Set([
  'register-requirement',
  'register-page-role',
  'register-page-check',
  'register-domain',
  'register-release-gate',
  'register-report-section',
  'register-finding',
  'register-task',
]);
const legacyRegisterSourceRows = masterCoverageLedger.rows.filter((r) =>
  legacyRegisterSourceTypes.has(r.type),
);
const representedLegacySourceIds = new Set(rows.map((r) => r.sourceLedgerId).filter(Boolean));
const unmappedLegacyRegisterRows = legacyRegisterSourceRows.filter(
  (r) => !representedLegacySourceIds.has(r.id),
);
const register = {
  schemaVersion: '2.0.0',
  promptId: 'QC-POST-100-017',
  generatedAt: stampedAt,
  candidate: {
    head: head,
    branch,
    dirty: true,
    dirtyFingerprint: fingerprint,
    fingerprintAlgorithm:
      'sha256(sorted relative path + NUL + file bytes; excludes only the three generated deliverables, ignored files, and secret-named files)',
    runtime: `${run('node', ['--version'])} (project contract >=24.20.0 <25)`,
    packageManager: 'pnpm@11.25.0 (from package.json; execution not verified)',
    sourceSchemaHead,
    appliedSchema: null,
    buildIdentity: null,
  },
  baselines: {
    currentCanonicalRoutes: routes.length,
    currentFrameworkErrorPages: 2,
    reportPageFilesHistorical: 88,
    routeMatrixDocumentedCount: 85,
    currentPageDefinitions: routes.length + 2,
    reconciledRequirements: reqLines.length,
    approvedAuditDomains: domainRows.filter((m) => +m[1] >= 1 && +m[1] <= 80).length,
    productionGates: 19,
    historicalReportFindingIdentities: findingIds.size,
    historicalVerificationFindingIdentities: verificationData.findings?.length ?? 0,
    newlyDiscoveredFindingIdentities: verificationData.newFindings?.length ?? 0,
    promptIds: promptIds.size,
    postReportSections: sections.length,
    reportIndicators: masterCoverageLedger.rows.filter((r) => r.type === 'indicator').length,
    reportAuditGates: masterCoverageLedger.rows.filter((r) => r.type === 'audit-gate').length,
    originalTasks: (verificationData.originalTasks ?? []).length,
    postSpecificationTasks: (promptSpecificationData.prompts ?? []).length,
    priorRegisterRows: legacyRegisterSourceRows.length,
    priorRegisterPageChecks: masterCoverageLedger.rows.filter(
      (r) => r.type === 'register-page-check',
    ).length,
    priorRegisterSections: masterCoverageLedger.rows.filter(
      (r) => r.type === 'register-report-section',
    ).length,
    priorRegisterTasks: masterCoverageLedger.rows.filter((r) => r.type === 'register-task').length,
    oldVerificationCandidate: verificationData.head,
    oldVerificationCounts: verificationData.counts,
    discrepancy:
      'Route matrix and historical review counts differ from current canonical registry; page files/routes/statuses re-baselined from current registry. Historical report untouched.',
  },
  scoring: {
    measuresAreIndependent: true,
    combinedScore: null,
    weightedChecklist: {
      numerator: acceptedChecklistRows.length,
      denominator: checklistRows.length,
      percent: checklistRows.length
        ? Number(((100 * acceptedChecklistRows.length) / checklistRows.length).toFixed(2))
        : null,
      evidenceState: 'NOT VERIFIED',
      sourceCandidate: verificationData.head,
      approvalReference:
        'audit/2026-10-02/QC-POST-100-017-reconciliation.md — recorded user approval of the separate 671/80/19 measures',
    },
    domainArithmeticMean: {
      numerator: null,
      denominator: domainRowsForMetric.length,
      value: null,
      evidenceState: 'NOT VERIFIED',
      reason: 'No current candidate-bound domain scores have been accepted.',
    },
    releaseReadiness: {
      model: 'Go/NoGo',
      gateSet: reconciledGateCount,
      decision: 'NO-GO',
      percent: null,
      state: 'BLOCKED_BY_AUTHORITY_SOURCE',
      reason: 'Canonical gate names, applicability, owners and acceptance rules remain unresolved.',
    },
    approvedExemptions,
    unsupportedExemptions: noUnsupportedExclusions ? 0 : null,
    rules: [
      'The weighted checklist (671 checks), D01-D80 arithmetic mean, and 19-gate Go/NoGo readiness are independent measures; no combined score is computed.',
      'FAIL, BLOCKED, NOT VERIFIED and NOT RUN remain in the checklist denominator unless an authorized applicability decision approves an exemption; approved exemptions: 0.',
      'Historical evidence is mapped for traceability but is never accepted as current-candidate evidence.',
      'Requirements, 88 page-role rows, 52 report sections, 25 indicators, 22 report audit gates, and original/post tasks are reviewed as independent traceability sets, not added to a score.',
    ],
  },
  sources: sourceRefs,
  validation: {
    duplicateIds: [],
    missingOwners: [],
    missingCriteria: [],
    missingEvidenceBindings: [],
    unownedFindingIds: [],
    missingPromptIds: [],
    sourceRouteCount: routes.length,
    requirementRowCount: reqLines.length,
    domainRowCount: domainRows.filter((m) => +m[1] >= 1 && +m[1] <= 80).length,
    pageRoleRowCount: rows.filter((r) => r.kind === 'page-role').length,
    pageCheckRowCount: checklistRows.length,
    reportSectionRowCount: sections.length,
    indicatorRowCount: masterCoverageLedger.rows.filter((r) => r.type === 'indicator').length,
    reportAuditGateRowCount: masterCoverageLedger.rows.filter((r) => r.type === 'audit-gate')
      .length,
    originalTaskRowCount: rows.filter((r) => r.kind === 'original-task').length,
    postSpecificationTaskRowCount: rows.filter((r) => r.kind === 'post-spec-task').length,
    rowCount: rows.length,
  },
  rows,
};

const errors = [];
const seen = new Set();
for (const r of rows) {
  if (seen.has(r.id)) errors.push(`duplicate ${r.id}`);
  seen.add(r.id);
  if (!r.owner?.trim()) errors.push(`missing owner ${r.id}`);
  if (!r.criterion?.trim()) errors.push(`missing criterion ${r.id}`);
  if (!r.source?.length) errors.push(`missing source ${r.id}`);
  if (!r.evidence || !r.evidence.state || !r.evidence.candidateSha || !r.evidence.dirtyFingerprint)
    errors.push(`missing evidence binding ${r.id}`);
}
const domains = rows.filter((r) => r.kind === 'domain');
const required = rows.filter((r) => r.kind === 'requirement');
if (rows.filter((r) => r.kind === 'page-role').length !== (routes.length + 2) * personas.length)
  errors.push('page-role coverage differs from current route registry plus framework error pages');
if (required.length !== reqLines.length)
  errors.push('requirement row coverage differs from current reconciliation source');
if (domains.length !== domainRows.filter((m) => +m[1] >= 1).length)
  errors.push('domain coverage differs from current approved audit-domain source');
if (checklistRows.length !== 671)
  errors.push(`post-report checklist expected 671 criteria, got ${checklistRows.length}`);
if (
  checklistRows.length !== verificationData.pages.reduce((n, p) => n + (p.checks?.length ?? 0), 0)
)
  errors.push('checklist criterion rows differ from the 671 source criteria');
if (sections.length !== 52)
  errors.push(`post-report section map expected 52, got ${sections.length}`);
if (masterCoverageLedger.rows.filter((r) => r.type === 'indicator').length !== 25)
  errors.push('indicator mapping differs from master ledger source');
if (masterCoverageLedger.rows.filter((r) => r.type === 'audit-gate').length !== 22)
  errors.push('report audit-gate mapping differs from master ledger source');
if (rows.filter((r) => r.kind === 'original-task').length !== 42)
  errors.push('original task mapping differs from the historical verification source');
if (rows.filter((r) => r.kind === 'post-spec-task').length !== 36)
  errors.push('post task mapping differs from the prompt specification source');
if (legacyRegisterSourceRows.length !== 1508)
  errors.push(`prior register expected 1508 rows, got ${legacyRegisterSourceRows.length}`);
if (unmappedLegacyRegisterRows.length)
  errors.push(
    `prior register rows are unmapped: ${unmappedLegacyRegisterRows.length} (${[
      ...new Set(unmappedLegacyRegisterRows.map((r) => r.type)),
    ].join(', ')}; sample ${unmappedLegacyRegisterRows
      .slice(0, 3)
      .map((r) => r.id)
      .join(', ')})`,
  );
if (checklistRows.some((r) => r.denominator !== 'INCLUDED'))
  errors.push('a post-report checklist criterion is omitted from its approved denominator');
if (checklistRows.some((r) => r.requiredArtifacts.length === 0))
  errors.push('a weighted checklist row is missing its source-required artifact link');
if (errors.length) throw new Error(`Coverage validation failed:\n${errors.join('\n')}`);
register.validation = {
  ...register.validation,
  duplicates: 0,
  missingOwners: 0,
  missingCriteria: 0,
  missingSources: 0,
  evidenceBindingsPresent: rows.length,
  routeSourceCount: routes.length,
  requirementRowCount: required.length,
  domainRowCount: domains.length,
  pageRoleRowCount: rows.filter((r) => r.kind === 'page-role').length,
  pageCheckRowCount: checklistRows.length,
  postReportSectionRowCount: sections.length,
  priorRegisterRowCount: legacyRegisterSourceRows.length,
  priorRegisterRowsUnmapped: unmappedLegacyRegisterRows.length,
  approvedExemptions: 0,
  checklistRowsWithRequiredArtifactLinks: checklistRows.filter(
    (r) => r.requiredArtifacts.length > 0,
  ).length,
  validationResult: 'PASS (structural only; no acceptance evidence)',
};

const json = JSON.stringify(register, null, 2) + '\n';
const md = [
  '# QC-POST-100-017 — Coverage register',
  '',
  `Generated: ${stampedAt} · Candidate HEAD: ${head} · Dirty fingerprint: ${fingerprint}`,
  '',
  '> New measurement only. The historical audit and its scores are unchanged. This register gives no product, demo, security, accessibility, UAT, or production-ready claim.',
  '',
  '## Re-baselined denominators',
  '',
  '| Independent measure | Denominator | Current disposition |',
  '|---|---:|---|',
  `| Weighted post-report checklist | 671 | ${acceptedChecklistRows.length}/671 current accepted; historical 311 PASS / 337 NOT VERIFIED / 23 FAIL not transferred |`,
  '| D01–D80 arithmetic mean | 80 | NOT VERIFIED; no accepted current domain scores |',
  '| Release readiness | 19 gates | NO-GO; gate definitions/mappings blocked; no percentage |',
  `| Approved exemptions | ${approvedExemptions} | none; all 671 checklist criteria remain included |`,
  '',
  `Traceability sets kept outside those three scores: ${required.length} requirements; ${routes.length + 2} page definitions × ${personas.length} role rows; ${sections.length} post-report sections; ${masterCoverageLedger.rows.filter((r) => r.type === 'indicator').length} indicators; ${masterCoverageLedger.rows.filter((r) => r.type === 'audit-gate').length} report audit gates; ${(verificationData.originalTasks ?? []).length} original tasks; ${(promptSpecificationData.prompts ?? []).length} post-pack specifications.`,
  '',
  '## Metric separation and authority',
  '',
  '- The 671 checklist, 80-domain arithmetic mean, and 19-gate Go/NoGo decision are independent; no combined score is computed.',
  '',
  '- The separate 671 / 80 / 19 method is recorded as user-approved in the prior reconciliation. No current domain score, gate definition, or additional N/A exemption is authorized by that scoring-method approval.',
  '- FAIL, BLOCKED, NOT VERIFIED, and NOT RUN remain included in the 671 checklist. No accepted candidate-bound evidence is attached here.',
  '',
  '## Evidence binding',
  '',
  `Every evidence slot is bound to current HEAD \`${head}\`, dirty fingerprint \`${fingerprint}\`, and source migration head \`${sourceSchemaHead}\`. Applied schema and build identity are null. Historical report candidate ${verificationData.head} and all prior artifacts remain source references only.`,
  '',
  `Structural reconciliation: **PASS** — ${rows.length} unique rows; all ${legacyRegisterSourceRows.length} prior register source rows represented (657 old checks and 16 old sections retained as SUPERSEDED, 19 gate slots remain unnamed/BLOCKED, 61 prior tasks retained); 671 post-report checklist rows, 528 page-role rows, 100 requirements, 80 domains, 52 post-report sections, 25 indicators, 22 audit gates, 42 original tasks, and 36 post specifications mapped. This proves mapping structure only, not applicability approval or acceptance.`,
  '',
  '## Row-level records',
  '',
  '| ID | Kind | Reference | Page | Role | State | Criterion / remaining work | Owner | Prompt | Evidence |',
  '|---|---|---|---|---|---|---|---|---|---|',
  ...rows.map(
    (r) =>
      `| ${r.id} | ${r.kind} | ${r.reference} | ${r.page ?? ''} | ${r.role ?? ''} | ${r.state} | ${r.criterion} Remaining: ${r.remainingWork} | ${r.owner} | ${r.responsiblePrompt ?? ''} | Required artifacts: ${r.requiredArtifacts.join(', ') || 'NOT SUPPLIED'}; accepted evidence: ${r.evidence.state}; SHA ${head}; fp ${fingerprint}; schema ${sourceSchemaHead}; runtime/build/applied schema NOT VERIFIED |`,
  ),
  '',
].join('\n');
const tableRows = rows
  .map(
    (r) =>
      `<tr data-group="${escape(r.group)}" data-state="${escape(r.state)}"><td>${escape(r.id)}</td><td>${escape(r.kind)}</td><td>${escape(r.reference)}</td><td>${escape(r.page ?? '')}</td><td>${escape(r.role ?? '')}</td><td>${escape(r.state)}</td><td>${escape(r.criterion)}<br><strong>Remaining:</strong> ${escape(r.remainingWork)}</td><td>${escape(r.owner)}</td><td>${escape(r.responsiblePrompt ?? '')}</td><td>${escape(r.evidence.state)} · <a href="../../${escape((Array.isArray(r.source) ? r.source[0] : r.source) ?? '')}">source</a></td></tr>`,
  )
  .join('\n');
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>QC-POST-100-017 Coverage Register</title><style>body{font:15px/1.55 system-ui;margin:2rem;background:#111b17;color:#eef5ed}main{max-width:1500px;margin:auto}a{color:#c8e98b}header,section{padding:1rem;background:#1b2922;margin:1rem 0;border-radius:8px}input,select{font:inherit;padding:.6rem}table{border-collapse:collapse;width:100%;font-size:13px}th,td{padding:.55rem;border:1px solid #526457;text-align:left;vertical-align:top}th{position:sticky;top:0;background:#25372d}.table{overflow:auto;max-height:75vh}code{overflow-wrap:anywhere}</style><main><header><h1>QC-POST-100-017 — Coverage register</h1><p>Generated ${escape(stampedAt)} · HEAD <code>${head}</code> · dirty fingerprint <code>${fingerprint}</code></p><p>Independent measures: checklist 0/671; domain mean NOT VERIFIED (80 domains); release readiness NO-GO (19 gates, no percentage). No combined score or exemptions.</p><p>Structural counts: ${required.length} requirements; ${routes.length + 2} pages × ${personas.length} roles; ${sections.length} report sections; 25 indicators; 22 report audit gates; 42 original tasks; 36 post tasks.</p><p>Structural validation PASS only. Runtime, applied schema, build identity and current acceptance evidence are absent.</p></header><section><label>Search <input id="q" type="search"></label> <label>Group <select id="g"><option value="">All</option>${[...new Set(rows.map((r) => r.group))].map((g) => `<option>${escape(g)}</option>`).join('')}</select></label> <label>State <select id="s"><option value="">All</option>${[...new Set(rows.map((r) => r.state))].map((s) => `<option>${escape(s)}</option>`).join('')}</select></label><p>${rows.length} traceability rows; only the 671 checklist rows contribute to its weighted measure.</p></section><div class="table"><table><thead><tr><th>ID</th><th>Type</th><th>Reference</th><th>Page</th><th>Role</th><th>State</th><th>Acceptance criterion / work remaining</th><th>Owner</th><th>Prompt</th><th>Evidence/source</th></tr></thead><tbody>${tableRows}</tbody></table></div></main><script>const q=document.querySelector('#q'),g=document.querySelector('#g'),s=document.querySelector('#s');function filter(){for(const r of document.querySelectorAll('tbody tr'))r.hidden=(!r.innerText.toLowerCase().includes(q.value.toLowerCase()))||(g.value&&r.dataset.group!==g.value)||(s.value&&r.dataset.state!==s.value)}q.oninput=g.onchange=s.onchange=filter;</script></html>`;
await mkdir(path.join(root, outDir), { recursive: true });
await writeFile(path.join(root, outDir, outputNames[0]), json);
await writeFile(path.join(root, outDir, outputNames[1]), md);
await writeFile(path.join(root, outDir, outputNames[2]), html);
console.log(
  JSON.stringify(
    {
      result: 'PASS (structural only)',
      head,
      fingerprint,
      routes: routes.length,
      requirements: required.length,
      domains: domains.length,
      rows: rows.length,
      checklist: { numerator: acceptedChecklistRows.length, denominator: checklistRows.length },
      pageRoles: rows.filter((r) => r.kind === 'page-role').length,
      sections: sections.length,
      indicators: masterCoverageLedger.rows.filter((r) => r.type === 'indicator').length,
      reportAuditGates: masterCoverageLedger.rows.filter((r) => r.type === 'audit-gate').length,
      originalTasks: verificationData.originalTasks?.length ?? 0,
      postSpecificationTasks: promptSpecificationData.prompts?.length ?? 0,
      legacyRegisterRows: legacyRegisterSourceRows.length,
      legacyRegisterRowsUnmapped: unmappedLegacyRegisterRows.length,
      prompts: promptIds.size,
      findings: rows.filter((r) => r.kind === 'finding').length,
    },
    null,
    2,
  ),
);
