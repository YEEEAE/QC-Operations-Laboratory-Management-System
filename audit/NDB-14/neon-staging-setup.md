# NDB-14.2 — Neon staging migration report

State: **MIGRATIONS COMPLETE; isolated staging verified for local development.** This report does not claim production readiness.

## Target and recovery

- Neon organization: `org-tiny-heart-08100347` (`f`); plan read back as **FREE**.
- Project: `super-dream-61259417`, named `qc-staging`.
- Branch: `br-divine-hill-b4klt2mo` (`staging`). PostgreSQL **18.6**.
- Separate production project reference: `wispy-hat-00021838`; staging endpoint was independently verified to belong to the new project. No production branch settings or schema were changed intentionally.
- Recovery point: `snap-dry-hall-b4n5jcxm` (`superdream-empty-before-bootstrap`), created 2026-10-28T02:31:34Z, before initial role/bootstrap/migration changes. Provider read-back confirmed its ID, name, and source branch. A restore drill was not performed. Later snapshot creation was denied by the Free plan's snapshot limit; no paid plan was enabled.
- Source Git SHA: `77fd3b579dfa25abc47bf7f3680ec43033430c32` (working tree was dirty before and during this task).

## Migration result

- Before: empty application schema; zero QC application tables, zero Neon Auth users, and no QC migration ledger. PostgreSQL's own `neon_auth` provider tables were present and preserved.
- After: **59/59** repository migrations applied through `0059_recovery_evidence_outcome_integrity`; pending **0**; migration names and all source SHA-256 checksums match.
- Schema integrity: **97** QC tables, **0** orphan checks.
- NDB-05 historical diagnostics: read-only, exception counts **0 and 0**.
- Thirty constraints created by source migrations with `NOT VALID` remain unvalidated. They are source-defined deferred validation, not unapplied migrations; no checksum or guard was bypassed.
- Runtime principal is `qc_staging_runtime`, distinct from the direct migration owner. It has no superuser, database-create, schema-create, role-create, or migration-ledger write privileges; read access to the ledger is retained. Staging bootstrap account is a synthetic administrator, not the named production owner.

## Verification

- Neon CLI deployment provisioned only the private `qc-staging-artifacts` bucket on this project; organization plan remained Free.
- Node **24.20.0**, pnpm **11.25.0**; `npm run build` **PASS**.
- Focused Vitest: **5 files, 27 tests passed**.
- Local browser on the built staging app: login and dashboard **PASS**, receiving register **200**, owner-only control center **404**, logout and session revocation **PASS**, logged-out dashboard **303**. External browser origins were blocked and none were requested in this final run.
- Private object storage check: PUT/GET/HEAD **200**, anonymous GET **403**, cleanup DELETE **204**; bytes and metadata round-tripped.
- Health live and ready endpoints returned **200 healthy**.
- Built artifact scan: **0** active local credential matches.
- The synthetic staging test-account password was rotated through the app's account flow after an earlier run.

## Production boundary and observed incident

All SQL migrations, Neon schema changes, credential rotation, and bucket provisioning targeted `super-dream-61259417` only. The original production project `wispy-hat-00021838` received no intentional schema/configuration change or deployment. During the **first** browser attempt, before the staging-origin fix, the app redirected a staging login flow to `qclevel.top`. The browser's subsequent navigation to that domain is confirmed by its URL. It may have recorded an unsuccessful login/authentication rate-limit event; that side effect cannot be ruled out. No production SQL or migration ran; whether the login attempt produced a successful session was not verified. Later browser runs enforced a localhost-only network route and passed.

The origin redirect rule now applies only when `APP_ENVIRONMENT_PROFILE=production`, so a production-mode staging process stays on its staging origin. Staging local startup is `npm run start:staging` at `http://127.0.0.1:4327`. No web application deploy was requested or performed; only Neon backend resources were deployed.

## Other limitations

A separate unused project `still-glade-18568929` was created earlier while resolving the staging target; it remains empty and unmigrated, with recovery reference `snap-super-heart-b5m65lnf`. It was not deleted. Its cleanup needs explicit resource-deletion authorization. Source-level constraints marked `NOT VALID` remain deferred. No restore rehearsal or production-readiness assessment is claimed.
