import { uuidv7 } from '../../../shared/id/uuid.js';
import { authorize } from '../../../shared/authorization/authorize.js';
import type { ActorContext } from '../../../shared/authorization/types.js';
import { assertContext, type LabTest } from '../domain/lab-test.js';
import type { ControlledLabSources } from '../ports/controlled-sources.js';
import type { LabRepository } from '../ports/repository.js';
export class CreateLabTestUseCase {
  constructor(private readonly repository: LabRepository, private readonly sources: ControlledLabSources, private readonly now = () => new Date()) {}
  async execute(input: { actor:ActorContext; templateVersionId:string; labTestNo:string; requestId:string }) {
    const context = await this.sources.resolve(input.templateVersionId, input.actor); assertContext(context);
    authorize({actor:input.actor,permission:'PERM-LAB-CREATE',action:'CREATE',entity:{type:'LAB_TEST',id:'new',state:'DRAFT',authorId:input.actor.id},scope:{ownerId:input.actor.id},currentVersion:1n,expectedVersion:1n,businessCondition:true},{throwOnDeny:true});
    const now=this.now(); const test:LabTest={id:uuidv7(),labTestNo:input.labTestNo,state:'DRAFT',scientificResult:null,authorId:input.actor.id,createdBy:input.actor.id,version:1n,context,samples:[],measurements:[],originalTestId:null,retestSequence:0,retestReason:null,createdAt:now.toISOString(),updatedAt:now.toISOString(),submittedAt:null,reviewStartedAt:null,approvedAt:null};
    return this.repository.create(test,{actor:input.actor,requestId:input.requestId,action:'CREATE'});
  }
}
