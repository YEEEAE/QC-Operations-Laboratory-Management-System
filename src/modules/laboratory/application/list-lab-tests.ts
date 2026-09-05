import type { ActorContext } from '../../../shared/authorization/types.js';
import type { LabRepository } from '../ports/repository.js';
export class ListLabTestsUseCase { constructor(private readonly repository:LabRepository) {} execute(actor:ActorContext) { return this.repository.list(actor); } }
