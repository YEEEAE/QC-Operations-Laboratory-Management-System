import { createHash } from 'node:crypto';

const verifiedLicenseFiles = new Map([
  [
    'buildcheck@0.0.7',
    {
      license: 'MIT',
      sha256: '9f75981e6039d13bf2e591c59e9c89a2641ca605fde59ba78974b11553f6c148',
      source: 'https://github.com/mscdex/buildcheck/blob/v0.0.7/LICENSE',
    },
  ],
  [
    'cpu-features@0.0.10',
    {
      license: 'MIT',
      sha256: '9f75981e6039d13bf2e591c59e9c89a2641ca605fde59ba78974b11553f6c148',
      source: 'https://github.com/mscdex/cpu-features/blob/v0.0.10/LICENSE',
    },
  ],
  [
    'ssh2@1.17.0',
    {
      license: 'MIT',
      sha256: '9f75981e6039d13bf2e591c59e9c89a2641ca605fde59ba78974b11553f6c148',
      source: 'https://github.com/mscdex/ssh2/blob/v1.17.0/LICENSE',
    },
  ],
  [
    'zod-to-ts@1.2.0',
    {
      license: 'MIT',
      sha256: '901eb546213d344758178277346c83df776b3566895c507a82ee36447c6662ba',
      source: 'https://github.com/sachinraja/zod-to-ts/blob/v1.2.0/LICENSE',
    },
  ],
]);

export function licenseTextSha256(text) {
  const normalized = text.replace(/\r\n?/g, '\n').trim() + '\n';
  return createHash('sha256').update(normalized).digest('hex');
}

export function verifiedLicenseEvidence(name, version, installedLicenseSha256) {
  const evidence = verifiedLicenseFiles.get(`${name}@${version}`);
  if (!evidence || evidence.sha256 !== installedLicenseSha256) return undefined;
  return {
    ...evidence,
    evidence: 'exact installed LICENSE text matches version-pinned upstream LICENSE',
  };
}
