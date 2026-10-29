import type { ReleaseCandidateIdentity } from './release-approval.js';

/** Evidence states are assigned by an authoritative receipt or decision, never by file presence. */
export type ReleaseEvidenceState = 'MISSING' | 'PROVIDED' | 'VERIFIED' | 'APPROVED';

export const RELEASE_MANIFEST_DIMENSIONS = [
  'gitSha',
  'buildIdentity',
  'migrationHead',
  'sourceRevisions',
  'releaseNotes',
  'effectiveMasterDataVersion',
  'backupEvidence',
  'restoreEvidence',
  'securityControls',
  'deploymentDestination',
  'ci',
  'uat',
  'science',
  'data',
  'backup',
  'it',
  'qcManager',
] as const;

export type ReleaseManifestDimension = (typeof RELEASE_MANIFEST_DIMENSIONS)[number];

export interface ReleaseManifestEvidence {
  state: ReleaseEvidenceState;
  source: string | null;
  immutableReference: string | null;
  verifiedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
}

export interface SourceRevisionReference {
  sourceId: string;
  revision: string;
  digest: string;
  evidence: ReleaseManifestEvidence;
}

export interface ReleaseManifest extends ReleaseCandidateIdentity {
  schemaVersion: 1;
  environment: 'local' | 'test' | 'ci' | 'staging' | 'production';
  sourceRevisions: SourceRevisionReference[];
  sourceReleaseNotes: string | null;
  effectiveMasterDataVersion: string | null;
  backupEvidencePointer: string | null;
  restoreEvidencePointer: string | null;
  securityControlReferences: string[];
  deploymentDestination: string | null;
  evidence: Record<ReleaseManifestDimension, ReleaseManifestEvidence>;
  decision: {
    state: 'NO_GO' | 'GO';
    authority: 'MANAGER' | 'SYSTEM_OWNER' | null;
    actorId: string | null;
    recordedAt: string | null;
    reference: string | null;
  };
}

export function missingReleaseEvidence(): ReleaseManifestEvidence {
  return {
    state: 'MISSING',
    source: null,
    immutableReference: null,
    verifiedAt: null,
    approvedBy: null,
    approvedAt: null,
  };
}

/** Empty-by-default manifest. Candidate identity is explicit; evidence and approvals are not inferred. */
export function createPendingReleaseManifest(input: {
  identity: ReleaseCandidateIdentity;
  environment: ReleaseManifest['environment'];
}): ReleaseManifest {
  const evidence = Object.fromEntries(
    RELEASE_MANIFEST_DIMENSIONS.map((key) => [key, missingReleaseEvidence()]),
  ) as Record<ReleaseManifestDimension, ReleaseManifestEvidence>;
  return {
    schemaVersion: 1,
    ...input.identity,
    environment: input.environment,
    sourceRevisions: [],
    sourceReleaseNotes: null,
    effectiveMasterDataVersion: null,
    backupEvidencePointer: null,
    restoreEvidencePointer: null,
    securityControlReferences: [],
    deploymentDestination: null,
    evidence,
    decision: {
      state: 'NO_GO',
      authority: null,
      actorId: null,
      recordedAt: null,
      reference: null,
    },
  };
}

const APPROVAL_DIMENSIONS = new Set<ReleaseManifestDimension>([
  'uat',
  'science',
  'data',
  'backup',
  'it',
  'qcManager',
]);

export function releaseManifestBlockers(manifest: ReleaseManifest): ReleaseManifestDimension[] {
  return RELEASE_MANIFEST_DIMENSIONS.filter((dimension) => {
    const requiredState = APPROVAL_DIMENSIONS.has(dimension) ? 'APPROVED' : 'VERIFIED';
    const state = manifest.evidence[dimension]?.state ?? 'MISSING';
    const order = { MISSING: 0, PROVIDED: 1, VERIFIED: 2, APPROVED: 3 } as const;
    return order[state] < order[requiredState];
  });
}

export function evaluateReleaseManifest(manifest: ReleaseManifest): {
  decision: 'NO_GO' | 'GO';
  blockers: ReleaseManifestDimension[];
} {
  const blockers = releaseManifestBlockers(manifest);
  // The approved 19-gate production register has not been reconciled to this
  // manifest schema. A manifest's own decision fields cannot establish that
  // authority, so this source contract remains NO-GO until a trusted
  // repository projection supplies a reconciled decision in a later change.
  blockers.push('qcManager');
  return { decision: blockers.length === 0 ? 'GO' : 'NO_GO', blockers: [...new Set(blockers)] };
}
