import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = fileURLToPath(new URL('../../..', import.meta.url));
const read = (file: string) => readFileSync(join(root, file), 'utf8');

describe('record journey linkage contract (QC-100-FINAL-024)', () => {
  it('lists current NCR, RCA, and CAPA records through their scoped use cases', () => {
    const ncrRegister = read('src/pages/quality/ncr/index.astro');
    const rcaRegister = read('src/pages/quality/rca/index.astro');
    const capaRegister = read('src/pages/quality/capa/index.astro');
    expect(ncrRegister).toContain('ncrReadDependencies().list.execute({ actor, state })');
    expect(ncrRegister).toContain('rcaReadDependencies().list.execute({ actor })');
    expect(ncrRegister).toContain('PD-15');
    expect(ncrRegister).toContain('PD-16');
    expect(ncrRegister).toContain('QC owner');
    expect(rcaRegister).toContain('rcaReadDependencies().list.execute({ actor, ncrId })');
    expect(rcaRegister).toContain('ncrReadDependencies().list.execute({ actor })');
    expect(capaRegister).toContain('capaReadDependencies().list.execute({ actor, state })');
    expect(capaRegister).toContain('PD-18');
    for (const page of [ncrRegister, rcaRegister, capaRegister]) {
      expect(page).toContain('ProviderUnavailableState');
      expect(page).toContain('<caption>');
      expect(page).toContain('scope="row"');
    }
  });

  it('keeps quality primary reads independent and withholds failed relationship counts', () => {
    const finding = read('src/pages/quality/findings/[findingId].astro');
    const ncr = read('src/pages/quality/ncr/index.astro');
    const rca = read('src/pages/quality/rca/index.astro');
    const capa = read('src/pages/quality/capa/index.astro');
    const templates = read('src/pages/quarantine/admin/index.astro');

    expect(finding).toContain("relatedNcrsStatus === 'AVAILABLE'");
    expect(finding).toContain("relatedNcrsStatus === 'UNAVAILABLE'");
    expect(ncr).toContain("rcaCount: rcaResult.status === 'AVAILABLE'");
    expect(ncr).toContain('Count unavailable');
    expect(ncr).toContain("findingResult.status === 'UNAVAILABLE'");
    expect(rca).toContain("ncrResult.status === 'UNAVAILABLE'");
    expect(rca).toContain('RCA records remain available');
    expect(capa).toContain("ncrResult.status === 'UNAVAILABLE'");
    expect(capa).toContain('CAPA records remain available');
    expect(templates).toContain('listUnavailable ?');
    expect(templates).toContain('Retry this page before treating the list as empty');
    for (const page of [finding, ncr, rca, capa, templates]) expect(page).toContain('readOutcome');
  });

  it('classifies each detail relationship separately so one outage cannot hide its primary record', () => {
    const ncr = read('src/pages/quality/ncr/[ncrId].astro');
    const rca = read('src/pages/quality/rca/[rcaId].astro');
    const capa = read('src/pages/quality/capa/[capaId].astro');
    expect(ncr).toContain("findingResult.status === 'UNAVAILABLE'");
    expect(ncr).toContain("rcaResult.status === 'UNAVAILABLE'");
    expect(ncr).toContain("capaResult.status === 'UNAVAILABLE'");
    expect(rca).toContain("ncrStatus === 'UNAVAILABLE'");
    expect(rca).toContain("capaStatus === 'UNAVAILABLE'");
    expect(capa).toContain("sourceStatus === 'UNAVAILABLE'");
    expect(capa).toContain('capa ? <>');
  });

  it('loads an RCA by its route id and distinguishes not-found from provider outage', () => {
    const page = read('src/pages/quality/rca/[rcaId].astro');
    expect(page).toContain('rcaReadDependencies().get.execute({ actor, id: rcaId })');
    expect(page).toContain("classifyReadFailure(error) === 'UNAVAILABLE'");
    expect(page).toContain('Astro.response.status = 404');
    expect(page).toContain('Astro.response.status = 503');
    expect(page).toContain('ncrReadDependencies().get.execute({ actor, id: rca!.ncrId })');
    expect(page).toContain('PD-17 decision owner: QMS process owner');
    expect(page).toContain('PD-18 · Quality-policy owner');
  });

  it('keeps denied quality detail reads separate from provider outages without exposing record existence', () => {
    const pages = [
      ['src/pages/quality/findings/[findingId].astro', 'providerUnavailable'],
      ['src/pages/quality/ncr/[ncrId].astro', 'providerUnavailable'],
      ['src/pages/quality/rca/[rcaId].astro', 'unavailable'],
      ['src/pages/quality/capa/[capaId].astro', 'providerUnavailable'],
    ] as const;

    for (const [path, outageFlag] of pages) {
      const page = read(path);
      expect(page, path).toContain('import { classifyReadFailure }');
      expect(page, path).toContain("classifyReadFailure(error) === 'UNAVAILABLE'");
      expect(page, path).toContain(`${outageFlag} = true`);
      expect(page, path).toContain('Astro.response.status = 404');
    }
  });

  it('does not present Findings review links that merely return to the same register', () => {
    const page = read('src/pages/quality/findings/[findingId].astro');
    expect(page).toContain('nextAction={undefined}');
    expect(page).toContain('PD-15 decision owner: QC-approved NCR initiation criteria');
    expect(page).toContain('providerUnavailable');
    expect(page).toContain('relatedNcrs.map');
  });

  it('exposes the audit reason without payload leakage on /audit', () => {
    const page = read('src/pages/audit.astro');
    // The immutable-history surface shows the recorded reason (correction
    // semantics) but never selects or renders the raw payload column.
    expect(page).toContain('Reason');
    expect(page).toContain('event.reason');
    expect(page).toContain('Not recorded');
    expect(page).not.toContain('event.payload');
    expect(page).not.toContain('payload');
  });

  it('resolves finding -> NCR linkage through the NCR domain scoped read', () => {
    const helper = read('src/modules/quality/findings/application/list-related-ncrs.ts');
    expect(helper).toContain('PostgresNcrRepository');
    expect(helper).toContain('repository.list({ actor })');
    // Provenance stays with the owning domain; no direct table access here.
    expect(helper).not.toContain("selectFrom('ncrs')");
    expect(helper).toContain('presentation only');
  });

  it('renders the NCR detail page with real reads and related finding/CAPA linkages', () => {
    const page = read('src/pages/quality/ncr/[ncrId].astro');
    expect(page).toContain('JourneyContextPanel');
    expect(page).toContain('ncrReadDependencies()');
    expect(page).toContain('capaReadDependencies()');
    expect(page).not.toContain('infrastructure/postgres-');
    expect(page).toContain('listFindingsForActor');
    expect(page).toContain('audit?subjectType=NCR');
    expect(page).toContain('read-only linkage');
    // Scope protection: a missing/forbidden source finding is stated, never
    // silently hidden and never guessed.
    expect(page).toContain('not visible in your authorized scope');
  });

  it('keeps the CAPA page read-only toward NCR state and links the source NCR', () => {
    const page = read('src/pages/quality/capa/[capaId].astro');
    expect(page).toContain('capaRead.listRelatedNcrs.execute');
    expect(page).not.toContain('infrastructure/postgres-');
    expect(page).toContain('Source NCR');
    expect(page).toMatch(/holds no mutation\s+\/\/ authority over NCR state/);
    expect(page).toContain('audit?subjectType=CAPA');
  });

  it('maps CAPA closure copy to the narrow P-04 exception and keeps effectiveness unresolved', () => {
    const register = read('src/pages/quality/capa/index.astro');
    const create = read('src/pages/quality/capa/new.astro');
    const detail = read('src/pages/quality/capa/[capaId].astro');
    const matrix = read('Documents/PERMISSION-MATRIX.md');
    for (const page of [register, create, detail]) {
      expect(page).toContain('active Supervisor');
      expect(page).toContain('close grant');
      expect(page).toContain('reauthentication');
      expect(page).toContain('e-signature');
      expect(page).toContain('effectiveness');
      expect(page).not.toMatch(/closure authority and effectiveness policy are unresolved/i);
    }
    expect(matrix).toContain('Close CAPA (P-04)');
    expect(matrix).toContain('نسخة مطابقة');
    expect(matrix).toContain('نطاق صالح، حساب ACTIVE');
  });

  it('uses the approved equipment eligibility decision for calibration detail copy', () => {
    const page = read('src/pages/assets/calibrations/[calibrationId].astro');
    const policy = read('Documents/BUSINESS-RULES.md');
    expect(page).toContain('read.equipment.assessEligibility.assess(actor, record.equipmentId)');
    expect(page).toContain('Eligibility could not be confirmed');
    expect(page).toContain('Not eligible for laboratory or inspection use');
    expect(page).toContain('Do not use this equipment');
    expect(page).not.toContain('overdue equipment-use consequence is not approved');
    expect(page).toContain("error.code==='RESOURCE_NOT_FOUND'");
    expect(page).toContain('recordUnavailable ? <ProviderUnavailableState');
    expect(page).toContain('historyUnavailable ?');
    expect(page).toContain('No calibration history entries are recorded');
    expect(policy).toContain('## BR-CAL-004 — Equipment Use While Overdue');
    expect(policy).toContain('لا يوجد استثناء تجاوز ضمن هذا المسار');
  });

  it('links the lab test to its source receiving record with scope preserved', () => {
    const helper = read('src/modules/laboratory/application/get-source-receiving.ts');
    expect(helper).toContain('source_receiving_item_id');
    expect(helper).toContain('PERM-LAB-VIEW');
    expect(helper).toContain('testRow.author_id !== actor.id');
    expect(helper).not.toContain('UPDATE');
    const page = read('src/pages/laboratory/tests/[labTestId]/index.astro');
    expect(page).toContain('getSourceReceivingForLabTest');
    expect(page).toContain('Source receiving');
    // Provenance framing: the receiving link never carries receiving mutation
    // authority into the laboratory page.
    expect(page).toContain('does\n// not transfer any receiving mutation authority');
  });

  it('states the retest path as policy-derived instead of declaring it unavailable', () => {
    const page = read('src/pages/laboratory/tests/[labTestId]/index.astro');
    expect(page).toContain('P-05 policy');
    expect(page).not.toContain('currently unavailable until the approved laboratory retest policy');
  });

  it('keeps handoff queue contracts authoritative — no invented escalation policy', () => {
    // The workspace queue (QC-100-FINAL-022) remains the only queue surface;
    // its definitions carry no SLA/target/escalation promise that no approved
    // policy defines.
    const definitions = read('src/modules/dashboard/application/my-work-definitions.ts');
    expect(definitions).not.toMatch(/\bsla\b|\bescalat(e|ion|ing)\b/i);
  });
});
