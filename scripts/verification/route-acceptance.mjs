import { createHash } from 'node:crypto';

/** A result is candidate-bound only when all identities match, including dirty source. */
export function evaluateEvidence(scenario, result, candidate) {
  const nv = (reason) => ({ status: 'NOT VERIFIED', reason });
  if (!result) return nv('No execution evidence');
  if (result.status === 'NOT APPLICABLE') {
    if (
      scenario.applicability !== 'NOT APPLICABLE' ||
      result.contractReference !== scenario.applicabilityReference ||
      !result.applicabilityDecisionOwner
    )
      return nv('N/A requires a contractual rationale and decision owner');
    return { status: 'NOT APPLICABLE', reason: result.contractReference };
  }
  if (scenario.applicability === 'NOT VERIFIED')
    return nv('Route-specific applicability decision unresolved');
  if (!scenario.expectedOutcome || result.expectedOutcome !== scenario.expectedOutcome)
    return nv('Expected outcome is not reconciled with the scenario');
  for (const key of ['gitSha', 'sourceFingerprint', 'migrationHead', 'schemaDigest', 'buildId']) {
    if (!candidate[key] || result.candidate?.[key] !== candidate[key])
      return nv(`Missing or stale ${key}`);
  }
  if (result.scenarioId !== scenario.id || result.routeId !== scenario.routeId)
    return nv('Route/scenario mismatch');
  if (!scenario.personas.includes(result.personaId)) return nv('Persona mismatch');
  if (
    result.appliedSchema?.head !== candidate.migrationHead ||
    result.appliedSchema?.digest !== candidate.schemaDigest
  )
    return nv('Applied schema binding is absent or differs from source');
  if (
    !result.fixture?.reference ||
    !result.fixture?.state ||
    !result.fixture?.permissions ||
    !result.fixture?.scopes ||
    !result.expectedOutcome ||
    !result.actualOutcome ||
    !result.command ||
    !result.evidenceReference ||
    !result.executedAt
  )
    return nv('Missing fixture, grant, state, outcome, command or evidence binding');
  if (scenario.kind === 'human-uat')
    return nv(
      'Human acceptance requires governed server-side signature verification; this inventory cannot close it',
    );
  if (
    scenario.kind === 'direct-denial' &&
    (!result.positiveReadControl ||
      !result.validExistingRecord ||
      !/^AUTHZ_(?:DENIED|SCOPE_DENIED|SOD_VIOLATION|PERMISSION_MISSING)$/.test(
        result.authorizationDenialCode ?? '',
      ) ||
      result.beforeDigest !== result.afterDigest ||
      !result.beforeDigest ||
      !result.auditUnchanged ||
      !result.outboxUnchanged)
  )
    return nv('Denial needs positive read, existing record and unchanged row/audit/outbox');
  if (result.status === 'PASS' && result.expectedOutcome !== result.actualOutcome)
    return { status: 'FAIL', reason: 'Observed outcome differs from expectation' };
  if (!['PASS', 'FAIL', 'BLOCKED', 'NOT VERIFIED'].includes(result.status))
    return nv('Unknown evidence status');
  return { status: result.status, reason: result.evidenceReference };
}

const plain = (value) =>
  value
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .trim();

/** Read the current audit cards rather than inventing domain states/transactions. */
export function readAuditCards(html) {
  const finding = html.match(/<summary>QC-PAGE-F-001[^]*?<\/details>/)?.[0];
  if (!finding) throw new Error('Missing QC-PAGE-F-001');
  const target = JSON.parse(plain(finding.match(/<strong>الصفحات:<\/strong>\s*([^]*?)<\/li>/)[1]));
  const cards = [
    ...html.matchAll(/<summary>(RT-[A-Z0-9-]+) — ([^<]+)<\/summary>([^]*?)<\/details>/g),
  ]
    .map((match) => {
      const fields = Object.fromEntries(
        [...match[3].matchAll(/<strong>([^<]+):<\/strong>([^]*?)<\/li>/g)].map((field) => [
          plain(field[1]),
          plain(field[2])
            .replace(/\n\|[^]*/, '')
            .trim(),
        ]),
      );
      return { id: match[1], path: plain(match[2]), fields };
    })
    .filter((card) => target.includes(card.path));
  if (
    cards.length !== target.length ||
    new Set(cards.map((card) => card.path)).size !== target.length
  )
    throw new Error('Audit target/card coverage mismatch');
  for (const card of cards) {
    for (const field of [
      'الملف',
      'States/workflow',
      'Reads/data source',
      'Writes/actions',
      'Transaction/audit/outbox',
    ])
      if (!card.fields[field]) throw new Error(`${card.id}: missing ${field}`);
  }
  return cards;
}

/** Inventory fingerprints exclude generated evidence and cover explicit verification inputs. */
export function digestInputs(entries) {
  const hash = createHash('sha256');
  for (const [path, bytes] of [...entries].sort(([a], [b]) => a.localeCompare(b))) {
    hash.update(path);
    hash.update('\0');
    hash.update(bytes);
    hash.update('\0');
  }
  return hash.digest('hex');
}

export function buildScenarios(card, personas) {
  const specs = [
    [
      'page-access',
      'Applicable',
      'Server pageAccessDecision; rendered protected data stays denied when session/identity is invalid',
    ],
    ['state-outcome', 'NOT VERIFIED', card.fields['States/workflow']],
    [
      'direct-denial',
      'NOT VERIFIED',
      'Existing valid record: positive read then denied direct POST; row/version/results/audit/outbox unchanged',
    ],
    ['transaction-replay', 'NOT VERIFIED', card.fields['Transaction/audit/outbox']],
    [
      'browser-recovery',
      'Applicable',
      card.fields['إعادةإدخالالبيانات'] ??
        'Loading/empty/missing/denied/provider/stale/unknown commit stay distinct',
    ],
    [
      'accessibility',
      'NOT VERIFIED',
      card.fields.Accessibility ?? 'Keyboard/AT; 320/375/768/1440 CSSpx and 200%',
    ],
    [
      'human-uat',
      'Applicable',
      'Real participant completes approved page task; authorized human acceptance remains separate',
    ],
  ];
  return personas.flatMap((persona) =>
    specs.map(([kind, applicability, expectedOutcome]) => ({
      id: `${card.id}:${kind}:${persona}`,
      routeId: card.id,
      kind,
      personas: [persona],
      applicability,
      applicabilityReference: `audit/2026-09-30-ADAPTIVE-PAGE-BY-PAGE-FULL-SYSTEM-AUDIT.html#${card.id}`,
      documentedStates: card.fields['States/workflow'],
      expectedOutcome,
      status: 'NOT VERIFIED',
      evidence: null,
      decisionOwner:
        applicability === 'NOT VERIFIED'
          ? 'QC/QMS: reconcile route-specific applicability; do not infer N/A'
          : null,
    })),
  );
}
