export interface VerifiedLicenseEvidence {
  license: string;
  sha256: string;
  source: string;
  evidence: string;
}

export function licenseTextSha256(text: string): string;
export function verifiedLicenseEvidence(
  name: string,
  version: string,
  installedLicenseSha256: string | undefined,
): VerifiedLicenseEvidence | undefined;
