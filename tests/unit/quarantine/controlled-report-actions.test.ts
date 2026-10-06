import { it, expect, describe } from 'vitest';
import { quarantineTemplates } from '../../../src/actions/quarantine-templates.js';
import { quarantine } from '../../../src/actions/quarantine.js';
const context = { locals: {}, cookies: { get: () => undefined, set: () => undefined } };
Reflect.set(context, Symbol.for('astro.actionAPIContext'), true);
const invoke = (action: unknown, payload: unknown) =>
  Reflect.apply(action as (...args: unknown[]) => unknown, context, [payload]);
const id = '01900000-0000-7000-8000-000000000111';
describe('real Astro controlled-report action boundary', () => {
  it.each([
    { templateCode: 'arbitrary', versionNo: '99', name: 'free text' },
    { catalogId: id, name: 'forged' },
    { catalogId: 'F-823-T132' },
    { catalogId: id, revision: '99' },
  ])('rejects free-text/forged identity payload %# before any database work', async (payload) => {
    const result = await invoke(quarantineTemplates.createTemplate, payload);
    expect(result).toHaveProperty('error');
  });
  it('requires authenticated context for stable catalogue ID', async () => {
    expect(await invoke(quarantineTemplates.createTemplate, { catalogId: id })).toHaveProperty(
      'error',
    );
  });
  it('rejects arbitrary report title alongside valid receiving/version IDs', async () => {
    expect(
      await invoke(quarantine.createInspectionFromReceiving, {
        receivingId: id,
        templateVersionId: id,
        inspectionNo: 'test',
        reportTitle: 'free text',
      }),
    ).toHaveProperty('error');
  });
  it('rejects client-supplied equipment snapshot/certificate', async () => {
    expect(
      await invoke(quarantine.linkInspectionEquipment, {
        id,
        expectedVersion: '1',
        usage: {
          equipmentId: id,
          calibrationRecordId: id,
          equipmentSnapshot: { forged: true },
          calibrationSnapshot: { certificateNo: 'forged' },
        },
      }),
    ).toHaveProperty('error');
  });
});
