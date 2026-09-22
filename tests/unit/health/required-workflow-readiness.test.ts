import { describe, expect, it, vi } from 'vitest';

import { RequiredWorkflowReadinessProbe } from '../../../src/shared/health/required-workflow-readiness.js';

describe('required workflow machine readiness', () => {
  it('requires both database reachability and the workflow schema probe', async () => {
    const database = { isReady: vi.fn().mockResolvedValue(true) };
    const workflow = { availability: vi.fn().mockResolvedValue({ available: true }) };

    await expect(new RequiredWorkflowReadinessProbe(database, [workflow]).isReady()).resolves.toBe(
      true,
    );
    expect(database.isReady).toHaveBeenCalledOnce();
    expect(workflow.availability).toHaveBeenCalledOnce();
  });

  it('fails readiness when a required workflow schema is unavailable', async () => {
    const database = { isReady: vi.fn().mockResolvedValue(true) };
    const workflow = { availability: vi.fn().mockResolvedValue({ available: false }) };

    await expect(new RequiredWorkflowReadinessProbe(database, [workflow]).isReady()).resolves.toBe(
      false,
    );
  });

  it('fails readiness when the workflow schema check throws without exposing the failure', async () => {
    const database = { isReady: vi.fn().mockResolvedValue(true) };
    const workflow = {
      availability: vi.fn().mockRejectedValue(new Error('private database endpoint')),
    };

    await expect(new RequiredWorkflowReadinessProbe(database, [workflow]).isReady()).resolves.toBe(
      false,
    );
  });

  it('does not continue to schema checks when PostgreSQL is unavailable', async () => {
    const database = { isReady: vi.fn().mockResolvedValue(false) };
    const workflow = { availability: vi.fn().mockResolvedValue({ available: true }) };

    await expect(new RequiredWorkflowReadinessProbe(database, [workflow]).isReady()).resolves.toBe(
      false,
    );
    expect(workflow.availability).not.toHaveBeenCalled();
  });
});
