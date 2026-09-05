import type { ActorContext } from '../../../shared/authorization/types.js';
import type { LabTest } from '../domain/lab-test.js';
export interface Mutation { actor:ActorContext; requestId:string; action:string; reason?:string }
export interface LabRepository {
  get(id:string,actor:ActorContext):Promise<LabTest|undefined>;
  list(actor:ActorContext):Promise<LabTest[]>;
  create(test:LabTest,mutation:Mutation):Promise<LabTest>;
  save(previous:LabTest,next:LabTest,mutation:Mutation):Promise<LabTest>;
  history(id:string,actor:ActorContext):Promise<readonly {stage:string;hash:string;record:LabTest}[]>;
}
