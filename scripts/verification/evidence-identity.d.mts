export interface EvidenceCandidate {
  gitSha: string;
  sourceFingerprint: string;
  migrationHead: string;
  nodeVersion: string;
  generatedAt: string;
  executionEnvironment: { kind: string; platform: string; architecture: string };
}
export function gitSha(): string;
export function sourceFingerprint(): Promise<string>;
export function migrationHead(): Promise<string>;
export function evidenceIdentity(): Promise<EvidenceCandidate>;
export function verificationRun(): Promise<{ runId: string; candidate: EvidenceCandidate }>;
