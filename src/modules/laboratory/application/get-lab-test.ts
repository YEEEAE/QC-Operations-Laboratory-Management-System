import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import type { LabRepository } from '../ports/repository.js';
export class GetLabTestUseCase { constructor(private readonly repository:LabRepository) {} async execute(input:{actor:ActorContext;id:string}) { const test=await this.repository.get(input.id,input.actor); if(!test) throw new AppError('RESOURCE_NOT_FOUND',{userSafe:true}); return test; } }
