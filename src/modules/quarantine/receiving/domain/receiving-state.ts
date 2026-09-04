import { AppError } from '../../../../shared/errors/app-error.js';
export const RECEIVING_WORKFLOW_STATES = ['PENDING','READY_FOR_INSPECTION','UNDER_INSPECTION','INSPECTION_COMPLETE','RELEASE_PENDING','RELEASED','HOLD','EXPIRED','CANCELLED'] as const;
export type ReceivingWorkflowState = typeof RECEIVING_WORKFLOW_STATES[number];
export const INSPECTION_RESULTS = ['NOT_STARTED','IN_PROGRESS','PASS','FAIL','HOLD'] as const;
export type InspectionResult = typeof INSPECTION_RESULTS[number];
export type ReceivingAction = 'MARK_READY'|'START_INSPECTION'|'COMPLETE_INSPECTION'|'MOVE_TO_RELEASE_PENDING'|'HOLD'|'REMOVE_HOLD'|'MARK_EXPIRED'|'CANCEL';
const transitions: Record<ReceivingWorkflowState, Partial<Record<ReceivingAction, ReceivingWorkflowState>>> = { PENDING:{MARK_READY:'READY_FOR_INSPECTION',HOLD:'HOLD',MARK_EXPIRED:'EXPIRED',CANCEL:'CANCELLED'}, READY_FOR_INSPECTION:{START_INSPECTION:'UNDER_INSPECTION',HOLD:'HOLD',MARK_EXPIRED:'EXPIRED'}, UNDER_INSPECTION:{COMPLETE_INSPECTION:'INSPECTION_COMPLETE',HOLD:'HOLD'}, INSPECTION_COMPLETE:{MOVE_TO_RELEASE_PENDING:'RELEASE_PENDING',HOLD:'HOLD'}, RELEASE_PENDING:{HOLD:'HOLD'}, RELEASED:{}, HOLD:{}, EXPIRED:{}, CANCELLED:{} };
export function transitionReceiving(state: ReceivingWorkflowState, action: ReceivingAction): ReceivingWorkflowState { const next=transitions[state][action]; if(!next) throw new AppError('DOMAIN_INVALID_TRANSITION',{userSafe:true}); return next; }
export function assertReason(reason:string|undefined){if(!reason?.trim())throw new AppError('VALIDATION_FAILED',{userSafe:true});}
