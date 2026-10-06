export interface MasterIdentity {
  docCode: string;
  officialTitle: string;
  masterRevision: string;
}
export interface SourceIdentity {
  docCode: string | null;
  sourceTitle: string | null;
  sourceRevision: string | null;
  readable: boolean;
}
export type SourceStatus =
  | 'MATCHED'
  | 'NOT_IN_MASTER_LIST'
  | 'SOURCE_TITLE_CONFLICT'
  | 'SOURCE_REVISION_CONFLICT'
  | 'NEEDS_SOURCE_RESCAN';
export const normalizeDocCode = (s: string) => s.replace(/\s/g, '').toUpperCase();
export const normalizeTitle = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();
export function matchControlledSource(
  master: readonly MasterIdentity[],
  source: SourceIdentity,
): SourceStatus {
  if (!source.readable || !source.docCode || !source.sourceTitle || source.sourceRevision === null)
    return 'NEEDS_SOURCE_RESCAN';
  const entry = master.find(
    (e) => normalizeDocCode(e.docCode) === normalizeDocCode(source.docCode!),
  );
  if (!entry) return 'NOT_IN_MASTER_LIST';
  if (normalizeTitle(entry.officialTitle) !== normalizeTitle(source.sourceTitle))
    return 'SOURCE_TITLE_CONFLICT';
  if (entry.masterRevision !== source.sourceRevision) return 'SOURCE_REVISION_CONFLICT';
  return 'MATCHED';
}
