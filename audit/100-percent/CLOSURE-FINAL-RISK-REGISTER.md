# QC-100-CLOSURE-10 — Final Risk Register (HEAD `ebafae1`)

Verdict scale (evidence-backed only): `OPEN` / `CLOSED` / `ACCEPTED RISK` / `NOT APPLICABLE`.

| ID | Risk | Verdict | Fresh evidence (this HEAD) |
|---|---|---|---|
| R-001 | PostgreSQL runtime + applied migration state | OPEN (narrowed) | F-07: no local PG runtime, no `DATABASE_URL`; C-15 representative (DB layer byte-identical per F-08) but not exact-HEAD; F-06 `/ready` 503 shows deployed service has no healthy DB path. Missing: exact-HEAD DB suites + production applied-state proof. |
| R-002 | Browser / E2E runtime | OPEN (narrowed) | F-07: no Playwright browsers locally; C-18/C-19 representative (UI byte-identical per F-08) for public surfaces; authenticated half (13 fixture-gated specs + manual/AT/LCP/CLS) still missing. |
| R-003 | Architecture boundary (Delivery → DB) | OPEN (narrowed, static-complete) | F-04 fresh exact-HEAD: guard exit 0 + zero `getDatabase` matches + 5/5 regression green. Static enforcement CLOSED; full risk stays OPEN only for container-capable CI behavior proof, which is blocked by R-004 (external). Domains 11/27/34/39 moved FAIL → PARTIAL on this basis. |
| R-004 | Remote CI status | OPEN (root cause re-proven) | F-05 fresh exact-HEAD: run `34201628961` on `ebafae1...`, Verify 0 steps / 3s / failure, billing-lock annotation re-fetched verbatim. External account blocker; no source edit can clear it. |
| R-005 | UAT / usability participants | OPEN | C-24–C-26 kit + validator stand; sessions=0, nothing executed. No new evidence possible without human participants. |
| R-006 | Backup / restore / DR / PITR | OPEN (narrowed) | F-07 fail-safe checklist refuses PASS without manifest; C-27 logical drill representative (current validator = fixed version per F-08); provider half (Render/PITR/WAL/RPO/RTO/independent review) BLOCKED. |
| R-007 | Scientific / policy controlled decisions | OPEN (narrowed) | PD-01–PD-37 register stands; fail-closed 10/10 re-run fresh inside F-01; zero approved QC/QMS sources arrived — nothing invented, defaults still deny. |
| R-008 | AI provider / scope | OPEN (narrowed) | F-03 fresh 39/39 exact-HEAD incl. 429→`UNAVAILABLE`; live-provider half NOT APPLICABLE to this disabled release (no contract/SDK/secrets per C-32); closes only with business-approved contract + reviewer UAT per PD-31. |
| R-009 | Node runtime parity | OPEN | F-00: local Node `v22.22.3` outside `>=24.20.0 <25`; every local gate in F-01–F-03 is local-only, not CI parity. |
| R-010 | Historical score as closure certificate | CLOSED | This task recomputed all 100 rows from current evidence only (`CLOSURE-FINAL-100-DOMAIN-AUDIT.md`, mean `50.30/100`); no historical score is cited as closure. (Closing R-010 closes the *method* gap, not the domains.) |

## Deltas vs QC-100-13 register

- R-004: stronger — exact-HEAD run + verbatim annotation re-fetched (was: prior-HEAD runs only).
- R-003: static half now verified fresh on the newest HEAD (was: verified on `1927aeb`).
- R-010: OPEN → CLOSED (fresh independent re-audit delivered).
- PROD-05-A (all-500s production): RESOLVED at liveness level — F-06 proves `/live` 200 JSON +
  headers and designed 503 fail-closed elsewhere; it was never a risk ID, and deployed-SHA
  binding + `/ready` health remain under R-001/R-004.
- All other IDs: unchanged in verdict, evidence refreshed where possible.
- No `ACCEPTED RISK` and no `NOT APPLICABLE` (beyond the R-008 provider-half note) are
  declared: acceptance needs a named business owner + signed record, which does not exist here.

## Minimum next remediation prompts (generated only because verdict is not 100)

1. `OPERATOR-CI-BILLING`: resolve GitHub billing lock → re-run Verification CI on the new
   SHA → attach run URL + artifacts (closes R-004/R-009, unlocks R-003 behavior proof,
   R-001 exact-HEAD DB suites, R-002 authenticated E2E).
2. `OPERATOR-DB-PROOF`: provide approved disposable/production `DATABASE_URL` handling →
   run `db:preflight`, `db:migrate:status/check`, `db:schema:check`, `test:migrations`,
   `test:concurrency`, `test:security`, `test:integration` on exact HEAD (closes R-001 remainder).
3. `OPERATOR-UAT`: execute CLOSURE-06 kit (14 functional + 6 negative + 4 accessibility
   scripts, 7 roles) → validator + coverage matrix + defect backlog + ACCEPTED record (closes R-005).
4. `OWNER-POLICY`: QC/QMS approve PD-01–PD-37 items needed for release → bind implementation
   + positive/negative tests on exact HEAD (closes R-007; unblocks R-008 provider half).
5. `OPERATOR-DR`: supervised Render backup + isolated restore + PITR/WAL statement + RPO/RTO
   approval + independent review record (closes R-006; completes R-001 production half).
