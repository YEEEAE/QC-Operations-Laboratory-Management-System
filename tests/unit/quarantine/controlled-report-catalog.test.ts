import { describe, expect, it } from 'vitest';
import master from '../../../src/modules/quarantine/catalog/master-rev14.json';
import evidence from '../../../src/modules/quarantine/catalog/source-evidence.json';
import drafts from '../../../src/modules/quarantine/catalog/digitized-forms.json';
import { matchControlledSource } from '../../../src/modules/quarantine/catalog/domain/source-match.js';
import {
  controlledFormSchema,
  validateControlledFormValues,
  type ControlledFormValues,
} from '../../../src/modules/quarantine/catalog/domain/controlled-form.js';
import { decodeControlledFormPost } from '../../../src/modules/quarantine/inspection/application/controlled-form-post.js';
import { ResolveInspectionTemplateUseCase } from '../../../src/modules/quarantine/inspection/application/resolve-inspection-template.js';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
const actor: ActorContext = {
  id: '01900000-0000-7000-8000-000000000111',
  accountState: 'ACTIVE',
  roles: ['EMPLOYEE'],
  permissions: [],
};
const form = (code: string) => controlledFormSchema.parse(drafts.find((f) => f.docCode === code));
// Isolated schema mechanics fixture, not approved scientific criteria.
const mechanics = () =>
  controlledFormSchema.parse({
    schemaVersion: 1,
    docCode: 'SYNTHETIC',
    reportRevision: 'test',
    sourceTitle: 'Synthetic mechanics',
    sourceDate: null,
    headerFields: [
      {
        key: 'supplier',
        label: 'Supplier',
        dataType: 'TEXT',
        required: true,
        receivingKey: 'supplier',
      },
    ],
    sections: [{ code: 'test', title: 'Synthetic', points: [] }],
    aqlFields: [],
    resultVocabulary: 'PASS_FAIL_REMARK_NA',
    finalDisposition: ['Accepted', 'Rejected'],
    reviewResponsibilities: [],
  });
const values = (): ControlledFormValues => ({ headers: {}, points: {}, disposition: 'Accepted' });
describe('Rev14 controlled identities and photographed sources', () => {
  it('extracts the entire 194-entry master without blank T175', () => {
    expect(master.entries).toHaveLength(194);
    expect(new Set(master.entries.map((e) => e.docCode)).size).toBe(194);
    expect(master.entries.some((e) => e.docCode === 'F-823-T175')).toBe(false);
    expect(master.excluded[0]?.reason).toBe('BLANK_MASTER_TITLE');
  });
  it('preserves official misspellings and whitespace', () => {
    expect(master.entries.find((e) => e.docCode === 'F-823-T90')?.officialTitle).toContain(
      'Genrel',
    );
    expect(master.entries.find((e) => e.docCode === 'F-823-T50')?.officialTitle).toContain(
      'Papper',
    );
    expect(master.entries.find((e) => e.docCode === 'F-823-T141')?.officialTitle).toBe(
      'Inspection & Test Report for Uretheral Catheter ',
    );
  });
  it.each(evidence.map((e) => [e.sourcePage, e] as const))(
    'classifies source page %s independently against full master',
    (_page, e) => {
      expect(
        matchControlledSource(master.entries, {
          docCode: e.docCode,
          sourceTitle: e.sourceTitle,
          sourceRevision: e.sourceRevision,
          readable: e.status !== 'NEEDS_SOURCE_RESCAN',
        }),
      ).toBe(e.status);
    },
  );
  it('never title-matches a conflicting code', () => {
    expect(
      matchControlledSource(master.entries, {
        docCode: 'F-823-T132',
        sourceTitle: master.entries[0]!.officialTitle,
        sourceRevision: '2',
        readable: true,
      }),
    ).toBe('NOT_IN_MASTER_LIST');
  });
  it.each(drafts.map((f) => [f.docCode, f] as const))(
    'parses complete product-specific schema %s',
    (_code, f) => {
      const parsed = controlledFormSchema.parse(f);
      expect(master.entries.find((e) => e.docCode === parsed.docCode)?.masterRevision).toBe(
        parsed.reportRevision,
      );
      expect(parsed.sections.length).toBeGreaterThan(0);
    },
  );
  it('retains both syringe and bottle measurement accuracy and readings', () => {
    for (const code of ['F-823-T61', 'F-823-T189']) {
      const p = form(code)
        .sections.flatMap((s) => s.points)
        .find((p) => p.dataType === 'TABLE');
      expect(p?.accuracyText).toContain('%');
      expect(p?.columns?.map((c) => c.key)).toContain('standard');
    }
  });
  it('retains Blood Line component columns and no fabricated fixed criteria', () => {
    const p = form('F-823-T76').sections.flatMap((s) => s.points);
    expect(p).toHaveLength(1);
    expect(p[0]?.dataType).toBe('TABLE');
    expect(p[0]?.columns?.map((c) => c.label).join(' ')).toContain('Colour');
  });
  it('does not fabricate general/liquid/white-label source transcriptions', () => {
    for (const code of ['F-823-T90', 'F-823-T5', 'F-823-T186'])
      expect(drafts.find((f) => f.docCode === code)).toBeUndefined();
  });
});
describe('controlled selection and form validation', () => {
  const candidate = {
    templateId: 't',
    templateCode: 'F-823-T40',
    templateVersionId: 'v',
    versionNo: '3',
    name: 'Controlled',
  };
  it('auto-resolves the unique allowed mapping', async () =>
    expect(
      (
        await new ResolveInspectionTemplateUseCase({
          listCandidates: async () => [candidate],
        }).resolve({ actor, itemCode: 'i' })
      ).unique,
    ).toEqual(candidate));
  it('requires explicit selection from ambiguous candidates', async () => {
    const resolver = new ResolveInspectionTemplateUseCase({
      listCandidates: async () => [
        candidate,
        { ...candidate, templateId: 't2', templateVersionId: 'v2' },
      ],
    });
    expect((await resolver.resolve({ actor, itemCode: 'i' })).unique).toBeNull();
    await expect(
      resolver.verifyExplicitSelection({ actor, itemCode: 'i', templateVersionId: 'v2' }),
    ).resolves.toMatchObject({ templateVersionId: 'v2' });
    await expect(
      resolver.verifyExplicitSelection({ actor, itemCode: 'i', templateVersionId: 'arbitrary' }),
    ).rejects.toThrow();
  });
  it('rejects missing mapping and disabled actor', async () => {
    const r = new ResolveInspectionTemplateUseCase({ listCandidates: async () => [] });
    await expect(
      r.verifyExplicitSelection({ actor, itemCode: 'i', templateVersionId: 'v' }),
    ).rejects.toThrow();
    await expect(
      r.resolve({ actor: { ...actor, accountState: 'DISABLED' }, itemCode: 'i' }),
    ).rejects.toThrow();
  });
  it('rejects editable Receiving data in native and JSON payloads', () => {
    const s = mechanics();
    expect(() =>
      validateControlledFormValues(s, { ...values(), headers: { supplier: 'forged' } }),
    ).toThrow();
    const data = new FormData();
    data.set('header:supplier', 'forged');
    expect(() => decodeControlledFormPost(s, data)).toThrow();
  });
  it('rejects unknown point, column, result and duplicate native names', () => {
    const s = mechanics();
    expect(() =>
      validateControlledFormValues(s, { ...values(), points: { fake: { result: 'PASS' } } }),
    ).toThrow();
    const data = new FormData();
    data.append('header:fake', 'a');
    data.append('header:fake', 'b');
    expect(() => decodeControlledFormPost(s, data)).toThrow();
  });
  it('requires all fixed point results, sampling fields and disposition at submit', () => {
    const s = form('F-823-T40');
    expect(() => validateControlledFormValues(s, values(), true)).toThrow();
  });
  it.each([
    'OPTION',
    'INTEGER',
    'DECIMAL',
    'MEASUREMENT',
    'YES_NO',
    'TEXT',
    'REMARK',
    'PASS_FAIL_NA',
    'READ_ONLY_SPECIFICATION',
  ] as const)('validates scalar type %s without altering values', (type) => {
    const s = mechanics();
    s.sections[0]!.points.push({
      key: 'p',
      label: 'Synthetic',
      dataType: type,
      required: false,
      resultRequired: false,
      remarksAllowed: true,
      requirementText: null,
      criticalInspectionPoint: null,
      allowedValues: ['allowed'],
    });
    const raw =
      type === 'YES_NO'
        ? true
        : ['DECIMAL', 'MEASUREMENT'].includes(type)
          ? '5.4000000000000000001'
          : type === 'INTEGER'
            ? '120000000000000000001'
            : 'allowed';
    const entry = ['PASS_FAIL_NA', 'READ_ONLY_SPECIFICATION'].includes(type) ? {} : { value: raw };
    expect(validateControlledFormValues(s, { ...values(), points: { p: entry } }).points.p).toEqual(
      entry,
    );
    if (type === 'OPTION')
      expect(() =>
        validateControlledFormValues(s, { ...values(), points: { p: { value: 'unallowed' } } }),
      ).toThrow();
  });
  it('requires remarks for REMARK result', () => {
    const s = mechanics();
    s.sections[0]!.points.push({
      key: 'p',
      label: 'Synthetic',
      dataType: 'PASS_FAIL_NA',
      required: true,
      resultRequired: true,
      remarksAllowed: true,
      requirementText: null,
      criticalInspectionPoint: true,
    });
    expect(() =>
      validateControlledFormValues(s, { ...values(), points: { p: { result: 'REMARK' } } }),
    ).toThrow();
    expect(
      validateControlledFormValues(s, {
        ...values(),
        points: { p: { result: 'FAIL', remarks: 'critical defect' } },
      }).points.p?.result,
    ).toBe('FAIL');
  });
  it('preserves repeatable decimal readings and rejects unknown table column', () => {
    const s = mechanics();
    s.sections[0]!.points.push({
      key: 'p',
      label: 'Synthetic',
      dataType: 'TABLE',
      required: true,
      resultRequired: false,
      remarksAllowed: true,
      requirementText: null,
      criticalInspectionPoint: null,
      columns: [{ key: 'reading', label: 'Reading', dataType: 'DECIMAL', required: true }],
    });
    const v = {
      ...values(),
      points: { p: { rows: [{ reading: '0.1000000000000000001' }, { reading: '0.2' }] } },
    };
    expect(validateControlledFormValues(s, v, true)).toEqual(v);
    expect(() =>
      validateControlledFormValues(s, { ...values(), points: { p: { rows: [{ fake: '1' }] } } }),
    ).toThrow();
    expect(() =>
      validateControlledFormValues(s, { ...values(), points: { p: { rows: [{}] } } }, true),
    ).toThrow();
  });
});
