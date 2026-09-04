export const ACCOUNT_STATES = ['ACTIVE', 'INACTIVE', 'DISABLED'] as const;
export type AccountState = (typeof ACCOUNT_STATES)[number];

export function canAuthenticate(state: AccountState): boolean {
  return state === 'ACTIVE';
}
