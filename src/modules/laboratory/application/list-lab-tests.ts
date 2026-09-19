import type { ActorContext } from '../../../shared/authorization/types.js';
import type { LabListFilter, LabRepository } from '../ports/repository.js';

/**
 * The laboratory register read.
 *
 * The filter is applied by the register itself (one predicate per workflow
 * state, plus the same owner dimension the dashboard counts), so a link that
 * carries `state`/`ownership` opens exactly the set its count was taken from.
 */
export class ListLabTestsUseCase {
  constructor(private readonly repository: LabRepository) {}
  execute(input: { actor: ActorContext; filter?: LabListFilter; limit: number }) {
    return this.repository.list(input);
  }
}
