import { AppError } from '../../../../shared/errors/app-error.js';
export const INSPECTION_STATES=['DRAFT','SUBMITTED','UNDER_REVIEW','RETURNED','APPROVED','REJECTED','VOID'] as const; export type InspectionState=typeof INSPECTION_STATES[number]; export type InspectionAction='SUBMIT'|'BEGIN_REVIEW'|'RETURN'|'RESUME'|'APPROVE'|'REJECT'|'VOID';
const transitions:Record<InspectionState,Partial<Record<InspectionAction,InspectionState>>>= {DRAFT:{SUBMIT:'SUBMITTED'},SUBMITTED:{BEGIN_REVIEW:'UNDER_REVIEW',RETURN:'RETURNED'},UNDER_REVIEW:{RETURN:'RETURNED',APPROVE:'APPROVED',REJECT:'REJECTED'},RETURNED:{RESUME:'DRAFT'},APPROVED:{VOID:'VOID'},REJECTED:{VOID:'VOID'},VOID:{}};
export function transitionInspection(s:InspectionState,a:InspectionAction){const n=transitions[s][a];if(!n)throw new AppError('DOMAIN_INVALID_TRANSITION',{userSafe:true});return n;}
export function requireReason(reason?:string){if(!reason?.trim())throw new AppError('VALIDATION_FAILED',{userSafe:true});}
