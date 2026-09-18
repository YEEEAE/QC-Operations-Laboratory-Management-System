/**
 * Where the subject of a notification lives.
 *
 * One mapper for every consumer (the notifications register and the dashboard
 * attention queue) so a notification link can never point somewhere different
 * depending on which surface rendered it. An unknown or missing subject stays
 * on the notifications register instead of guessing a route.
 */
const DESTINATIONS: Readonly<Record<string, (id: string) => string>> = {
  TASK: (id) => `/tasks/${id}`,
  INSPECTION_REPORT: (id) => `/quarantine/inspections/${id}`,
  LAB_TEST: (id) => `/laboratory/tests/${id}`,
  NCR: (id) => `/quality/ncr/${id}`,
  CAPA: (id) => `/quality/capa/${id}`,
  DOCUMENT: (id) => `/documents/${id}`,
  CHANGE_REQUEST: (id) => `/change-requests/${id}`,
};

export const NOTIFICATIONS_DESTINATION = '/notifications';

export function notificationDestination(subjectType?: string, subjectId?: string): string {
  if (!subjectType || !subjectId) return NOTIFICATIONS_DESTINATION;
  return DESTINATIONS[subjectType]?.(subjectId) ?? NOTIFICATIONS_DESTINATION;
}
