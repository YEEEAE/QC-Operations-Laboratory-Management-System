import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('integration delivery and business decision UX contract', () => {
  it('explains that failed delivery cannot complete a QC business decision', () => {
    const page = readFileSync('src/pages/system/health.astro', 'utf8');
    expect(page).toContain('data-testid="delivery-business-separation"');
    expect(page).toContain('Delivery is not a business decision');
    expect(page).toContain(
      'It does not mark an inspection, laboratory result, approval, or release complete',
    );
  });

  it('keeps delivery status and business decision separate in the adapter audit contract', () => {
    const adapter = readFileSync('src/shared/integrations/instrument-sandbox-adapter.ts', 'utf8');
    expect(adapter).toContain('deliveryStatus: DeliveryStatus');
    expect(adapter).toContain("businessDecision: 'UNDECIDED'");
    expect(adapter).toContain("failureCode: 'SANDBOX_UNAVAILABLE'");
  });

  it('does not connect the offline instrument adapter to laboratory execution actions', () => {
    const page = readFileSync('src/pages/laboratory/tests/[labTestId]/execute.astro', 'utf8');
    const actions = readFileSync('src/actions/laboratory.ts', 'utf8');
    expect(page).not.toContain('instrument-sandbox-adapter');
    expect(actions).not.toContain('instrument-sandbox-adapter');
    expect(actions).not.toContain('createInstrumentSandboxAdapter');
  });
});
