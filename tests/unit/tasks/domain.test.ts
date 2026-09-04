import { describe, expect, it } from 'vitest';
import { createDraftTask, assertCompletable } from '../../../src/modules/tasks/domain/model.js';
import { transitionTask } from '../../../src/modules/tasks/domain/state.js';

const draft = () => createDraftTask({ id: '01900000-0000-7000-8000-000000000001', taskNo: 'TASK-1', title: 'Inspect label', priority: 'HIGH', createdBy: '01900000-0000-7000-8000-000000000002', now: new Date('2026-01-01T00:00:00Z'), checklist: [{ id: '01900000-0000-7000-8000-000000000003', label: 'Verify', required: true, position: 1 }] });

describe('Tasks domain', () => {
  it('creates only a DRAFT and preserves required checklist', () => { const task = draft(); expect(task.state).toBe('DRAFT'); expect(task.version).toBe(1n); expect(task.checklist[0]?.required).toBe(true); });
  it('rejects undeclared transitions and missing hold reason', () => { expect(() => transitionTask(draft(), 'COMPLETE', new Date())).toThrow(); expect(() => transitionTask(draft(), 'HOLD', new Date())).toThrow(); });
  it('requires required checklist completion before COMPLETE', () => { const task = { ...draft(), state: 'IN_PROGRESS' as const }; expect(() => assertCompletable(task)).toThrow(); const complete = { ...task, checklist: task.checklist.map((item) => ({ ...item, completed: true })) }; expect(() => assertCompletable(complete)).not.toThrow(); });
  it('requires reasons for reopen', () => { const task = { ...draft(), state: 'COMPLETED' as const }; expect(() => transitionTask(task, 'REOPEN', new Date())).toThrow(); expect(transitionTask(task, 'REOPEN', new Date(), 'Corrective follow-up').state).toBe('IN_PROGRESS'); });
});
