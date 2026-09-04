export const SEARCHABLE_ENTITY_TYPES = [
  'TASK',
  'RECEIVING_ITEM',
  'INSPECTION_REPORT',
  'LAB_TEST',
  'FINDING',
  'NCR',
  'CAPA',
  'EQUIPMENT',
  'DOCUMENT',
  'CHANGE_REQUEST',
] as const;
export type SearchableEntityType = (typeof SEARCHABLE_ENTITY_TYPES)[number];
export interface SearchResult {
  entityType: SearchableEntityType;
  entityId: string;
  businessId: string;
  descriptor: string;
  state: string;
  context?: string;
}
export interface SearchQuery {
  actorId: string;
  q: string;
  limit?: number;
}
