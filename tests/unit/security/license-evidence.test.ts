import { describe, expect, it } from 'vitest';
import {
  licenseTextSha256,
  verifiedLicenseEvidence,
} from '../../../scripts/security/license-evidence.mjs';

describe('candidate license evidence', () => {
  it('recognizes only version-pinned installed MIT license texts', () => {
    const cases = [
      ['buildcheck', '0.0.7', '9f75981e6039d13bf2e591c59e9c89a2641ca605fde59ba78974b11553f6c148'],
      [
        'cpu-features',
        '0.0.10',
        '9f75981e6039d13bf2e591c59e9c89a2641ca605fde59ba78974b11553f6c148',
      ],
      ['ssh2', '1.17.0', '9f75981e6039d13bf2e591c59e9c89a2641ca605fde59ba78974b11553f6c148'],
      ['zod-to-ts', '1.2.0', '901eb546213d344758178277346c83df776b3566895c507a82ee36447c6662ba'],
    ] as const;

    for (const [name, version, digest] of cases) {
      expect(verifiedLicenseEvidence(name, version, digest)?.license).toBe('MIT');
    }
  });

  it('keeps unknown and changed package license texts unresolved', () => {
    expect(
      verifiedLicenseEvidence(
        'buildcheck',
        '0.0.8',
        '9f75981e6039d13bf2e591c59e9c89a2641ca605fde59ba78974b11553f6c148',
      ),
    ).toBeUndefined();
    expect(verifiedLicenseEvidence('buildcheck', '0.0.7', '0'.repeat(64))).toBeUndefined();
  });

  it('normalizes line endings without changing the license classification', () => {
    const lf = 'MIT License\nCopyright (c) 2021 Sachin Raja\n';
    const crlf = lf.replace(/\n/g, '\r\n');
    expect(licenseTextSha256(lf)).toBe(licenseTextSha256(crlf));
  });
});
