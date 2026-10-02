import type { SearchResult, SearchableEntityType } from './search-result.js';

const destinations: Record<SearchableEntityType, (result: SearchResult) => string> = {
  TASK: (result) => `/tasks/${result.entityId}`,
  RECEIVING_ITEM: (result) => `/quarantine/receiving/${result.entityId}`,
  INSPECTION_REPORT: (result) => `/quarantine/inspections/${result.entityId}`,
  LAB_TEST: (result) => `/laboratory/tests/${result.entityId}`,
  FINDING: (result) => `/quality/findings/${result.entityId}`,
  NCR: (result) => `/quality/ncr/${result.entityId}`,
  RCA: (result) => `/quality/rca/${result.entityId}`,
  CAPA: (result) => `/quality/capa/${result.entityId}`,
  EQUIPMENT: (result) => `/assets/equipment/${result.entityId}`,
  DOCUMENT: (result) => `/documents/${result.entityId}`,
  CHANGE_REQUEST: (result) => `/change-requests/${result.entityId}`,
  REJECT_REPORT: (result) =>
    `/reject-reports/${result.businessId.startsWith('RIS') ? 'issue-slips' : 'daily'}/${result.entityId}`,
};

export function searchResultDestination(result: SearchResult): string {
  return destinations[result.entityType](result);
}
