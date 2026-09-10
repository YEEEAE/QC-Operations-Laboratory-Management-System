import { describe, expect, it } from 'vitest';

import {
  VERIFICATION_DISPOSABLE_RECORDS,
  VERIFICATION_PERSONAS,
  VERIFICATION_RECORD_PREFIX,
} from '../../fixtures/verification-personas.js';
import { FOUNDATION_ROLE_PERMISSIONS } from '../../../db/seeds/common.js';
import { routes } from '../../../src/shared/routing/routes.js';

const C12_ROUTES = [
  '/login',
  '/dashboard',
  '/tasks',
  '/audit',
  '/system/health',
  '/change-requests/new',
  '/quarantine/admin',
  '/tasks/new',
  '/admin',
  '/system/backups',
] as const;

describe('C-12 expected-access matrix contract', () => {
  it('defines exactly six personas with no secrets in source', () => {
    expect(VERIFICATION_PERSONAS).toHaveLength(6);
    const identities = VERIFICATION_PERSONAS.map((persona) => persona.loginIdentity);
    expect(new Set(identities).size).toBe(6);
    expect(identities).toContain('yazeed');
    const serialized = JSON.stringify(VERIFICATION_PERSONAS);
    // Env-var *names* are allowed; actual credential values / hashes must never appear.
    expect(serialized).not.toMatch(/"password"\s*:|"passwordHash"|"secret"\s*:|"token"\s*:/i);
    for (const name of VERIFICATION_PERSONAS.map((persona) => persona.passwordEnvVar)) {
      expect(process.env[name]).toBeUndefined();
    }
    for (const persona of VERIFICATION_PERSONAS) {
      expect(persona.passwordEnvVar).toMatch(/^QC_VERIFY_[A-Z_]+_PASSWORD$/);
    }
  });

  it('never seed-manages yazeed and expires every disposable fixture', () => {
    const owner = VERIFICATION_PERSONAS.find((persona) => persona.loginIdentity === 'yazeed');
    expect(owner?.seedManaged).toBe(false);
    for (const persona of VERIFICATION_PERSONAS.filter((persona) => persona.seedManaged)) {
      expect(persona.loginIdentity.startsWith('verify-')).toBe(true);
      expect(persona.expiresAfterHours).toBe(24);
    }
  });

  it('grants the least-privileged persona no sensitive permissions', () => {
    const least = VERIFICATION_PERSONAS.find((persona) => persona.id === 'least-privileged');
    const sensitive = [
      'PERM-INSP-APPROVE',
      'PERM-LAB-APPROVE',
      'PERM-QUAR-RELEASE',
      'PERM-DOC-APPROVE',
      'PERM-CAPA-CLOSE',
      'PERM-ADM-USERS',
      'PERM-HLTH-VIEW',
      'PERM-BKP-RESTORE-PRODUCTION',
    ];
    for (const permission of sensitive) {
      expect(least?.minimumPermissions.join(' ')).not.toContain(permission);
    }
  });

  it('keeps admin-only free of business approval authority', () => {
    const adminGrants = FOUNDATION_ROLE_PERMISSIONS.ADMIN;
    for (const forbidden of [
      'PERM-INSP-APPROVE',
      'PERM-LAB-APPROVE',
      'PERM-QUAR-RELEASE',
      'PERM-DOC-APPROVE',
      'PERM-CAPA-CLOSE',
    ] as const) {
      expect(adminGrants).not.toContain(forbidden);
    }
  });

  it('covers every C-01..C-12 route used by the matrix in the canonical route registry', () => {
    const paths = new Set(routes.map((route) => route.path));
    for (const path of C12_ROUTES) {
      expect(paths.has(path), `matrix route is not a canonical route: ${path}`).toBe(true);
    }
  });

  it('marks every disposable record with the VERIFY- prefix', () => {
    expect(VERIFICATION_DISPOSABLE_RECORDS.length).toBeGreaterThan(0);
    for (const record of VERIFICATION_DISPOSABLE_RECORDS) {
      expect(record.businessNo.startsWith(VERIFICATION_RECORD_PREFIX)).toBe(true);
    }
  });
});
