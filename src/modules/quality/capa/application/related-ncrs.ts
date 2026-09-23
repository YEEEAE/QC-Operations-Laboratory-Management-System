import type { ActorContext } from '../../../../shared/authorization/types.js';
import type { Ncr } from '../../ncr/domain/ncr.js';
import type { NcrRepository } from '../../ncr/ports/repository.js';

/** Read NCR linkage through NCR's actor-scoped repository, preserving repository order. */
export class ListRelatedNcrsForCapaUseCase {
  constructor(private readonly ncrs: NcrRepository) {}

  async execute(input: { actor: ActorContext; ncrId: string }): Promise<readonly Ncr[]> {
    const records = await this.ncrs.list({ actor: input.actor });
    return records.filter((ncr) => ncr.id === input.ncrId);
  }
}
