import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'yaml';
import { licenseTextSha256, verifiedLicenseEvidence } from './license-evidence.mjs';

const args = new Map();
for (let index = 2; index < process.argv.length; index += 1) {
  if (process.argv[index].startsWith('--')) args.set(process.argv[index], process.argv[++index]);
}
const sbomPath = args.get('--output');
const licensePath = args.get('--licenses');
if (!sbomPath || !licensePath) throw new Error('Expected --output and --licenses paths.');

const lockBytes = await readFile('pnpm-lock.yaml');
const lock = parse(lockBytes.toString('utf8'));
const packageKeys = Object.keys(lock.packages ?? {}).sort();
const pnpmStore = path.resolve('node_modules/.pnpm');
let storeEntries = [];
try {
  storeEntries = await readdir(pnpmStore);
} catch {
  /* A frozen install must provide this directory in CI. */
}
const components = [];
const dependencies = [];
const licensesByPackage = new Map();
const verifiedLicenseEvidenceByPackage = new Map();
const refsByPackage = new Map();
const licenseCounts = new Map();
const findLicense = async (key) => {
  const withoutSlash = key.replace(/^\//, '');
  const at = withoutSlash.lastIndexOf('@');
  if (at <= 0) return { name: withoutSlash, version: '0.0.0', license: undefined };
  const name = withoutSlash.slice(0, at);
  const versionAndPeers = withoutSlash.slice(at + 1);
  const version = versionAndPeers.split('(')[0];
  const encodedName = name.replaceAll('/', '+');
  const storeName = storeEntries.find((entry) => entry.startsWith(`${encodedName}@${version}`));
  if (!storeName) return { name, version, license: undefined, installed: false };
  try {
    const metadata = JSON.parse(
      await readFile(path.join(pnpmStore, storeName, 'node_modules', name, 'package.json'), 'utf8'),
    );
    let licenseTextSha256Value;
    try {
      const licenseText = await readFile(
        path.join(pnpmStore, storeName, 'node_modules', name, 'LICENSE'),
        'utf8',
      );
      licenseTextSha256Value = licenseTextSha256(licenseText);
    } catch {
      // Missing license text remains unknown unless package metadata declares an SPDX identifier.
    }
    return {
      name,
      version,
      license: metadata.license,
      licenseTextSha256: licenseTextSha256Value,
      installed: true,
    };
  } catch {
    return { name, version, license: undefined, installed: true };
  }
};
for (const key of packageKeys) {
  const pkg = await findLicense(key);
  const packageRecord = lock.packages[key];
  const integrity = packageRecord?.resolution?.integrity;
  const packageUrlName = pkg.name.startsWith('@') ? `%40${pkg.name.slice(1)}` : pkg.name;
  const bomRef = `pkg:npm/${packageUrlName}@${pkg.version}`;
  const declaredLicense = typeof pkg.license === 'string' ? pkg.license : pkg.license?.type;
  const verifiedLicense = declaredLicense
    ? undefined
    : verifiedLicenseEvidence(pkg.name, pkg.version, pkg.licenseTextSha256);
  const resolvedLicense = declaredLicense ?? verifiedLicense?.license;
  const resolvedLicenseEntry = resolvedLicense
    ? [
        {
          license: /^[A-Za-z0-9.+-]+$/.test(resolvedLicense)
            ? { id: resolvedLicense }
            : { expression: resolvedLicense },
        },
      ]
    : [];
  const licenseLabel = resolvedLicense || (pkg.installed ? 'UNKNOWN' : 'NOT_INSTALLED_ON_RUNNER');
  licenseCounts.set(licenseLabel, (licenseCounts.get(licenseLabel) ?? 0) + 1);
  if (!resolvedLicense && pkg.installed)
    licensesByPackage.set(`${pkg.name}@${pkg.version}`, 'UNKNOWN');
  if (verifiedLicense)
    verifiedLicenseEvidenceByPackage.set(`${pkg.name}@${pkg.version}`, {
      license: verifiedLicense.license,
      installedLicenseSha256: pkg.licenseTextSha256,
      evidence: verifiedLicense.evidence,
      upstreamLicense: verifiedLicense.source,
    });
  components.push({
    type: 'library',
    name: pkg.name,
    version: pkg.version,
    purl: bomRef,
    'bom-ref': bomRef,
    properties: [{ name: 'package:installed-on-runner', value: String(pkg.installed) }],
    ...(integrity
      ? {
          hashes: [
            { alg: integrity.split('-')[0].toUpperCase(), content: integrity.split('-')[1] },
          ],
        }
      : {}),
    ...(resolvedLicenseEntry.length ? { licenses: resolvedLicenseEntry } : {}),
  });
  refsByPackage.set(`${pkg.name}@${pkg.version}`, bomRef);
  refsByPackage.set(key.replace(/^\//, '').replace(/\([^)]*\)$/, ''), bomRef);
}
for (const [snapshot, record] of Object.entries(lock.snapshots ?? {})) {
  const base = snapshot.replace(/\([^)]*\)$/, '');
  const ref = refsByPackage.get(base);
  if (!ref) continue;
  const dependsOn = Object.entries({ ...record.dependencies, ...record.optionalDependencies })
    .map(([name, version]) =>
      refsByPackage.get(`${name}@${String(version).replace(/\([^)]*\)$/, '')}`),
    )
    .filter(Boolean);
  dependencies.push({ ref, dependsOn: [...new Set(dependsOn)].sort() });
}
const licenseReport = {
  schemaVersion: 1,
  candidate: {
    gitSha: process.env.GITHUB_SHA ?? 'local',
    lockfileSha256: createHash('sha256').update(lockBytes).digest('hex'),
  },
  source: 'pnpm-lock.yaml plus installed package metadata',
  totalLockedPackages: components.length,
  unknownLicenses: Object.fromEntries(licensesByPackage),
  verifiedLicenseEvidence: Object.fromEntries(verifiedLicenseEvidenceByPackage),
  licenses: Object.fromEntries(
    [...licenseCounts].sort(([left], [right]) => left.localeCompare(right)),
  ),
  reviewPolicy:
    'Unknown or non-SPDX package license metadata blocks candidate review until a named owner records disposition.',
};
const applicationRef = 'pkg:generic/qc-operations-laboratory-management-system@0.1.0';
const directDependencies = Object.entries({
  ...lock.importers?.['.']?.dependencies,
  ...lock.importers?.['.']?.devDependencies,
  ...lock.importers?.['.']?.optionalDependencies,
})
  .map(([name, entry]) =>
    refsByPackage.get(`${name}@${String(entry.version).replace(/\([^)]*\)$/, '')}`),
  )
  .filter(Boolean);
const sbom = {
  bomFormat: 'CycloneDX',
  specVersion: '1.5',
  version: 1,
  metadata: {
    timestamp: new Date().toISOString(),
    tools: [{ vendor: 'QC Operations', name: 'candidate-sbom-writer', version: '1.0.0' }],
    component: {
      type: 'application',
      name: 'qc-operations-laboratory-management-system',
      version: '0.1.0',
      'bom-ref': applicationRef,
    },
    properties: [
      { name: 'git:commit', value: process.env.GITHUB_SHA ?? 'local' },
      { name: 'pnpm-lock-sha256', value: licenseReport.candidate.lockfileSha256 },
    ],
  },
  components,
  dependencies: [
    { ref: applicationRef, dependsOn: [...new Set(directDependencies)].sort() },
    ...dependencies,
  ],
};
await mkdir(path.dirname(sbomPath), { recursive: true });
await writeFile(sbomPath, `${JSON.stringify(sbom, null, 2)}\n`, { mode: 0o600 });
await writeFile(licensePath, `${JSON.stringify(licenseReport, null, 2)}\n`, { mode: 0o600 });
if (licensesByPackage.size) {
  process.stderr.write(
    `License gate: ${licensesByPackage.size} locked packages have unknown license metadata. See the candidate-bound inventory.\n`,
  );
  process.exitCode = 1;
}
process.stdout.write(
  `Candidate SBOM created: ${components.length} locked packages; lockfile SHA-256 ${licenseReport.candidate.lockfileSha256}.\n`,
);
