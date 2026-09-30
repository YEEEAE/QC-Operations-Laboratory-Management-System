/**
 * Checksums recorded before the Render-compatible ownership model. The
 * migration runner accepts these exact historical bytes for auditability;
 * it never rewrites them in the ledger.
 */
export const LEGACY_MIGRATION_CHECKSUMS: Readonly<Record<string, string>> = {
  '0001': '02379677863e1d178ee12f28c936e68949f2a1a12bb25e50e4fd41cda455d7e5',
  '0002': '1f86bb2536e9b50bf3c2a23d434f9c07e3a92826f5e270b083d36cfe0d029206',
  '0003': 'f94f611575128759ae2600b41aeac3fadc1ee12da99218bec4eccf3c50db625',
  '0005': 'a47f14661f758c999452df8c6ca9c7874715820e51243276940a6651e5518958',
  '0006': 'a7f1c54a5114172de6f4a16eb79caea9d4f222bea704050c83955e5818357396',
  '0007': '676afda757b4f86f41a3c3b8ee7dd3b777e3c6996743fc15f4130ca573e1e1f3',
  '0008': 'e41b27575143038973ea22a281bf330d3a7f85ebee458a4be1f3aa0ff26838bc',
  '0009': '04e2ad58242315ef172d41d1e5acd6e423df6ea6708da97c12a843d862b3fa69',
  '0010': 'b789ef65841dba08720a2a98b99679d316a6afff632b4447562f2594d6fc69af',
  '0011': '5537d41c177174af7494ee8943e5f08087b7c84dcb0b3938676b1d7687ed1d54',
  '0012': '077aff381fb1389d3eb7aac59e73c1592bbd97465d6619225142e53c8d3d0310',
  '0013': 'ff55c49a5c5a412edf740da37b8144476e7aa97b571499df0829720cd1364b4c',
  '0014': '1807b31c5202a2f7bdbc22bfa85041e241346f62d0c3f82a3147732608eebdd2',
  '0015': '4b31acb29be4329c18786d081dba431da908f0cc287daba1f3d31ae5dd3aec36',
  '0016': '51cc181e6efe5bd265e547d9c8cfdde4d7f903d0977eb006200200c440077baf',
  '0018': '1d0ff581e19ff36e19df931c2601d17fb2a14bb7449805bdd049dfb7426bc334',
};

export function isKnownLegacyMigrationChecksum(version: string, checksum: string): boolean {
  return LEGACY_MIGRATION_CHECKSUMS[version] === checksum;
}

export function isSupportedMigrationChecksum(
  version: string,
  currentChecksum: string,
  appliedChecksum: string,
): boolean {
  return (
    currentChecksum === appliedChecksum || isKnownLegacyMigrationChecksum(version, appliedChecksum)
  );
}
