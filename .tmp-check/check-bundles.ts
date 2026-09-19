import { FOUNDATION_ROLE_PERMISSIONS as F } from '../db/seeds/common.js';
const codes = [
  'PERM-INSP-REVIEW','PERM-INSP-RETURN','PERM-APR-REVIEW','PERM-APR-RETURN',
  'PERM-LAB-REVIEW','PERM-LAB-RETURN','PERM-INSP-APPROVE','PERM-LAB-APPROVE',
  'PERM-APR-APPROVE','PERM-INSP-REJECT','PERM-LAB-REJECT','PERM-APR-REJECT','PERM-INSP-VOID',
];
for (const r of ['EMPLOYEE','SUPERVISOR','MANAGER','ADMIN'] as const) {
  const has = codes.filter((c) => (F[r] as readonly string[]).includes(c));
  console.log(r.padEnd(11), has.length ? has.join(', ') : '(none)');
}
