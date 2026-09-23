import { describe, expect, it, vi } from 'vitest';
import type { ActorContext } from '../../../src/shared/authorization/types.js';
import type { Ncr } from '../../../src/modules/quality/ncr/domain/ncr.js';
import type { NcrRepository } from '../../../src/modules/quality/ncr/ports/repository.js';
import { ListRelatedNcrsForCapaUseCase } from '../../../src/modules/quality/capa/application/related-ncrs.js';

const actor = { id: 'actor-1' } as ActorContext;
const ncr = (id: string): Ncr => ({ id, findingId: 'finding-1', version: 1n }) as Ncr;

describe('CAPA related NCR read', () => {
  it('uses actor-scoped NCR reads and preserves repository order', async () => {
    const visible = [ncr('ncr-2'), ncr('ncr-other'), ncr('ncr-1')];
    const list = vi.fn(async (input: { actor: ActorContext }) => {
      expect(input.actor).toBe(actor);
      return visible;
    });
    const useCase = new ListRelatedNcrsForCapaUseCase({ list } as unknown as NcrRepository);

    await expect(useCase.execute({ actor, ncrId: 'ncr-1' })).resolves.toEqual([ncr('ncr-1')]);
    expect(list).toHaveBeenCalledOnce();
  });

  it('returns no linked NCR when it is outside the actor-scoped read result', async () => {
    const useCase = new ListRelatedNcrsForCapaUseCase({
      list: vi.fn(async () => [ncr('visible-ncr')]),
    } as unknown as NcrRepository);

    await expect(useCase.execute({ actor, ncrId: 'hidden-ncr' })).resolves.toEqual([]);
  });
});
