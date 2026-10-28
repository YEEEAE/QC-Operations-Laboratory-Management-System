import type { DocumentRepository } from '../ports/repository.js';

/** Durable worker entry point. It processes only requests carrying an approved,
 * versioned policy decision; the worker has no authority to approve requests. */
export class ActivateApprovedDocumentSchedulesUseCase {
  constructor(private readonly repository: DocumentRepository, private readonly now = () => new Date()) {}

  execute(input: { limit?: number } = {}) {
    return this.repository.activateApprovedSchedules({ now: this.now(), limit: Math.min(Math.max(input.limit ?? 25, 1), 100) });
  }
}
