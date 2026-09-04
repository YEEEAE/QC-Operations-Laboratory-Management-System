import { stableSeedUuid } from '../../db/seeds/common.js';

type Override<T> = Partial<T>;

export interface UserFactoryRecord {
  id: string;
  login_identity: string;
  display_name: string;
  account_state: 'ACTIVE' | 'INACTIVE' | 'DISABLED';
}

export interface TaskFactoryRecord {
  id: string;
  task_no: string;
  title: string;
  priority: string;
  state: 'DRAFT' | 'OPEN' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
  version: number;
  current_assignee_id: string | null;
  scope?: string;
}

export interface ReceivingFactoryRecord {
  id: string;
  receiving_no: string;
  workflow_state:
    | 'PENDING'
    | 'READY_FOR_INSPECTION'
    | 'UNDER_INSPECTION'
    | 'INSPECTION_COMPLETE'
    | 'RELEASE_PENDING'
    | 'RELEASED'
    | 'HOLD'
    | 'EXPIRED'
    | 'CANCELLED';
  inspection_result: 'NOT_STARTED' | 'IN_PROGRESS' | 'PASS' | 'FAIL' | 'HOLD';
  release_system: boolean;
  version: number;
  scope?: string;
}

export function userFactory(
  index = 1,
  overrides: Override<UserFactoryRecord> = {},
): UserFactoryRecord {
  return {
    id: stableSeedUuid(`user-${index}`),
    login_identity: `fixture-user-${index}`,
    display_name: `Fixture User ${index}`,
    account_state: 'ACTIVE',
    ...overrides,
  };
}

export function taskFactory(
  index = 1,
  overrides: Override<TaskFactoryRecord> = {},
): TaskFactoryRecord {
  return {
    id: stableSeedUuid(`task-${index}`),
    task_no: `FIX-TASK-${index}`,
    title: `Fixture Task ${index}`,
    priority: 'UNSPECIFIED',
    state: 'DRAFT',
    version: 1,
    current_assignee_id: null,
    ...overrides,
  };
}

export function receivingFactory(
  index = 1,
  overrides: Override<ReceivingFactoryRecord> = {},
): ReceivingFactoryRecord {
  return {
    id: stableSeedUuid(`receiving-${index}`),
    receiving_no: `FIX-RCV-${index}`,
    workflow_state: 'PENDING',
    inspection_result: 'NOT_STARTED',
    release_system: false,
    version: 1,
    ...overrides,
  };
}
