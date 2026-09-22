import type { ReadinessProbe } from './readiness.js';

export interface RequiredWorkflowAvailabilityProbe {
  availability(): Promise<{ available: boolean }>;
}

/** Machine readiness combines database reachability with the exact capability probes used by required workflows. */
export class RequiredWorkflowReadinessProbe implements ReadinessProbe {
  constructor(
    private readonly database: ReadinessProbe,
    private readonly workflows: readonly RequiredWorkflowAvailabilityProbe[],
  ) {}

  async isReady(): Promise<boolean> {
    try {
      if (!(await this.database.isReady())) return false;
      const results = await Promise.all(this.workflows.map((workflow) => workflow.availability()));
      return results.every((result) => result.available);
    } catch {
      return false;
    }
  }
}
