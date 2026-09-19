# QC-100-FINAL-004 — Task 6: Local UAT environment bring-up

> **Date:** 2026-09-19 · **Candidate:** `04004eec154d4ddb4bd512c144d8efba05b23bae` (`main`, dirty tree: 2 pre-existing unrelated paths)
> **Scope:** bring up the local disposable UAT environment and record the release identity block. No production, Render, or shared database was touched.
> **Machine evidence:** `audit/2026-09-19/QC-100-FINAL-004-task6-uat-bringup-evidence.json`

## Result

| Item | Result |
|---|---|
| Cluster | disposable PostgreSQL 18.6 via `scripts/db/disposable-postgres.sh` (TLS `verify-full`, `127.0.0.1:55432`) |
| Database | `qc_uat_bringup` (created fresh; owner `qc_owner`) |
| `db:preflight` | PASS (0 applied / 31 pending before migration) |
| `db:migrate` | PASS — `0001 … 0031`, `pending []` |
| `db:seed:foundation` + check | PASS — 4 roles, 205 permissions, 252 role-permission rows |
| `bootstrap:admin` | PASS — `yazeed` created (ACTIVE) |
| `access:grant-system-owner` + `system-owner:check` | PASS — 205 canonical permissions, `GLOBAL` scope |
| Task 4 `uat:seed` (+ idempotent re-run) | PASS — 5 disposable `uat-*` accounts, `TEAM:QC-UAT-TEAM`, 72h expiry, `yazeed` untouched |
| `db:migrate:check` | PASS — `{"status":"ok","migrations":31}` |
| `db:schema:check` | PASS — `{"status":"ok","migrationCount":31,"tableCount":77,"orphanCount":0}` |
| `pnpm dev` against the bring-up DB | PASS — health live/ready `200 healthy` |

**State: `DONE` for the local bring-up scope. `PARTIAL` for the wider QC-100-FINAL-004 goal** — Tasks 7–8 (scenario suite, defect loop), human UAT, and sign-off remain open, and the `uat` release gate stays `UNVERIFIED`.

## Identity block (recorded)

```json
{
  "gitSha": "04004eec154d4ddb4bd512c144d8efba05b23bae",
  "releaseId": "rel-7198ea06be34b164",
  "buildId": "uat-bringup-04004eec154d",
  "applicationVersion": "0.1.0",
  "serviceVersion": "0.1.0",
  "environment": "test",
  "migrationHead": "0031_qc_creation_parity_two_stage_approval",
  "migrationHeadChecksum": "44b160a6b8c09769fd7f18e19c29b2e29c98635cbf81de603a2cbbbd6324ec61",
  "workingTree": "dirty"
}
```

Produced by `pnpm release:identity -- --environment test --build-id uat-bringup-04004eec154d` (written to `dist/release-identity.json`).
`environment` is `test`, which is the only non-production value the UAT schema accepts besides `staging` (migration 0023 CHECK).

## Environment contents

| Login identity | Role(s) | Scope | Effective permissions | Approve/sign |
|---|---|---|---|---|
| `yazeed` | SYSTEM_OWNER, ADMIN | GLOBAL | 205 | 15 |
| `uat-qcm` | MANAGER | TEAM:QC-UAT-TEAM | 64 | 8 |
| `uat-supervisor` | SUPERVISOR | TEAM:QC-UAT-TEAM | 85 | 7 |
| `uat-qc-01` | EMPLOYEE | TEAM:QC-UAT-TEAM | 53 | **0** |
| `uat-qc-02` | EMPLOYEE | TEAM:QC-UAT-TEAM | 53 | **0** |
| `uat-qc-03` | EMPLOYEE | TEAM:QC-UAT-TEAM | 53 | **0** |

Role grants for the five disposable accounts expire `2026-09-22T13:52:36+03:00`. `yazeed` is never seed-managed (verified untouched). The EMPLOYEE `0` approve/sign count is the Task 1 invariant reproduced on a freshly migrated database.

## HTTP verification (dev server on `127.0.0.1:4399`)

Unauthenticated: `/` 302, `/login` 200, `/api/health/live` 200 `{"status":"healthy"}`, `/api/health/ready` 200 `{"status":"healthy"}`, `/dashboard` 303, `/system/health` 303.

Authenticated smoke with a real seeded persona (`uat-qcm`, action URL `POST /login?_astroAction=login`): a `qc.sessions` row was created, and `/dashboard`, `/approvals`, and `/quarantine/receiving` all returned `200` rendering the `uat-qcm / Manager` identity. This proves the environment is genuinely usable for Task 7 rather than merely migrated.

Seed guards were re-confirmed fail-closed on the same run: a production-looking `DATABASE_URL` (render.com host), `NODE_ENV=production`, and a missing `QC_SEED_ALLOW_NON_PRODUCTION` were each refused.

## Limits and honest notes

- Local Node is `v22.22.3`, outside the declared `>=24.20.0 <25` contract. This is local bring-up evidence, **not** Node runtime-parity proof.
- No browser/Playwright scenario was run — that is Task 7. Only HTTP-level checks are recorded here.
- Seeded disposable accounts carry `must_change_password = TRUE` (identical policy to the existing verification fixtures). The Task 7 harness must handle or complete that first-login step after authentication.
- `PASS ≠ RELEASED`: no human UAT session, no e-signature acceptance, and no `release_gate_evidence` row exist. The `uat` gate remains `UNVERIFIED` and this task asserts nothing about production.
- The dev runtime was stopped immediately after the checks; nothing was left running on the host. The `qc_uat_bringup` database remains on the disposable local cluster for Task 7.

## Operational note for Task 7

```bash
export DATABASE_URL="postgresql://qc_owner@127.0.0.1:55432/qc_uat_bringup?sslmode=verify-full&sslrootcert=$PWD/.tmp/pg18/tls/ca.crt"
```

Exported in the shell, this takes precedence over any `DATABASE_URL` in the local `.env` (the loader never overwrites an existing value), which is what kept this bring-up off any provider-hosted database.
