export const SEARCHABLE_ENTITY_TYPES = [
  'TASK',
  'RECEIVING_ITEM',
  'INSPECTION_REPORT',
  'LAB_TEST',
  'FINDING',
  'NCR',
  'RCA',
  'CAPA',
  'EQUIPMENT',
  'DOCUMENT',
  'CHANGE_REQUEST',
  'REJECT_REPORT',
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
  cursor?: string;
  limit?: number;
  permissions?: readonly SearchReadPermission[];
}

export interface SearchReadPermission {
  code: string;
  scopes: readonly string[];
  active?: boolean;
}

export interface SearchPage {
  items: SearchResult[];
  total: number;
  nextCursor?: string;
}
