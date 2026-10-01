import type { DocumentVersion } from './document-version.js';

const OPEN_REVISION_STATES = new Set<DocumentVersion['state']>([
  'DRAFT',
  'IN_REVIEW',
  'RETURNED',
]);

export interface ExpectedDocumentPredecessor {
  id: string;
  state: DocumentVersion['state'];
  version: bigint;
}

export type RevisionCreationDecision =
  | { allowed: true; predecessor: DocumentVersion | null }
  | {
      allowed: false;
      reason: 'REVISION_IN_PROGRESS' | 'LATEST_VERSION_NOT_REVISABLE';
      blockingVersion: DocumentVersion;
    };

/**
 * Repositories return document history newest-first by exact stored timestamp,
 * then stable ID. Keep that database ordering: JavaScript Date truncates
 * PostgreSQL microseconds and could otherwise select the wrong predecessor.
 */
export function orderDocumentVersionsNewestFirst(
  versions: readonly DocumentVersion[],
): DocumentVersion[] {
  return [...versions];
}

export function expectedPredecessorOf(
  versions: readonly DocumentVersion[],
): ExpectedDocumentPredecessor | null {
  const latest = orderDocumentVersionsNewestFirst(versions)[0];
  return latest ? { id: latest.id, state: latest.state, version: latest.version } : null;
}

/**
 * The controlled-document state machine permits the first draft, or one new
 * draft from the latest EFFECTIVE revision. APPROVED is not treated as
 * EFFECTIVE. A DRAFT, IN_REVIEW, or RETURNED revision remains the one open
 * revision and must be resumed/resolved first.
 */
export function decideRevisionCreation(
  versions: readonly DocumentVersion[],
): RevisionCreationDecision {
  const ordered = orderDocumentVersionsNewestFirst(versions);
  const openVersion = ordered.find((version) => OPEN_REVISION_STATES.has(version.state));
  if (openVersion) {
    return { allowed: false, reason: 'REVISION_IN_PROGRESS', blockingVersion: openVersion };
  }

  const predecessor = ordered[0] ?? null;
  if (!predecessor) return { allowed: true, predecessor: null };
  if (predecessor.state === 'EFFECTIVE') {
    return { allowed: true, predecessor };
  }
  return {
    allowed: false,
    reason: 'LATEST_VERSION_NOT_REVISABLE',
    blockingVersion: predecessor,
  };
}
