import { AppError } from '../../../shared/errors/app-error.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { assertComplete } from '../domain/lab-test.js';
import { transitionLab } from '../domain/lab-state.js';
import type { AssetsEligibility, ControlledLabSources } from '../ports/controlled-sources.js';
import type { LabRepository } from '../ports/repository.js';
import { authorizeLab } from './lab-authorization.js';
export class SubmitLabTestUseCase { constructor(private readonly repository:LabRepository,private readonly sources:ControlledLabSources,private readonly assets:AssetsEligibility,private readonly now=()=>new Date()) {} async execute(input:{actor:ActorContext;id:string;expectedVersion:bigint;requestId:string}) {const test=await this.repository.get(input.id,input.actor);if(!test)throw new AppError('RESOURCE_NOT_FOUND',{userSafe:true});authorizeLab(input.actor,test,'PERM-LAB-SUBMIT','SUBMIT',input.expectedVersion);assertComplete(test);await this.assets.verify({actor:input.actor,equipment:test.context.equipment,context:test.context});await this.sources.validateExecution(test,input.actor);const at=this.now().toISOString();return this.repository.save(test,{...test,state:transitionLab(test.state,'SUBMIT'),version:test.version+1n,updatedAt:at,submittedAt:at},{actor:input.actor,requestId:input.requestId,action:'SUBMIT'});}}
