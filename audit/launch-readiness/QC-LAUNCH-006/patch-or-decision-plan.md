# QC-LAUNCH-006 — Local patch and decision plan

## Local diff summary

- `src/modules/laboratory/domain/parameter-acceptance.ts`: stop coercing JSON `number` bounds into decimal strings after IEEE-754 parsing. Numeric criteria now require exact decimal strings and return no automated outcome when that representation is absent.
- `tests/unit/laboratory/lab-runs.test.ts`: add an adversarial precision case showing a JavaScript-number bound is rejected while the same exact decimal string is evaluated.
- No migration, asset behavior, scientific threshold, conversion rule, signature policy, or release behavior was added or changed.

Candidate HEAD remains `b3db4d91ca2483e8fcdc908e581409474b62d4f9`; verification source fingerprint is recorded in `evidence.json`. The code patch is local and uncommitted.

## Controlled decisions and remediation

1. **QC method owner / Laboratory QA:** supply the effective controlled method, revision/hash/effectivity, parameter rules, allowed units and conversion factors, rounding/precision, calculation and aggregation rules, missing/corrected/NA handling, and independent scientific reference fixtures. Confirm controlled numeric criteria are represented as exact decimal strings before enabling evaluation.
2. **QMS / Document Control:** establish approval/effectivity links for the template and source files, including retention and immutable usage requirements.
3. **Assets / Calibration owner:** provide authorized synthetic isolated equipment/calibration records and confirm calibration-at-use and maintenance eligibility policy.
4. **Infrastructure / test owner:** provide a disposable PostgreSQL 18 runtime; rerun the three laboratory database suites plus the required integration, concurrency, and security commands against the same candidate identity.
5. **Laboratory QA + independent rubric reviewer:** execute the authenticated review/sign/retest/history scenario with authorized roles and accept or reject each criterion. Until then, both scores remain zero and release stays NO-GO.
6. **Scientific software engineer:** define and verify a technical input length/scale guard before large decimal strings reach `BigInt` or PostgreSQL `NUMERIC`. No numeric bound was invented in this run.

## Rollback

If approved source review identifies incompatible existing numeric-bound serialization, revert only the two local files above from this candidate patch, then rerun candidate-bound checks. That rollback restores IEEE-754 coercion risk, so keep scientific evaluation fail-closed and do not use it as an acceptance workaround. Do not modify the controlled-source or signature gates.

## Dependencies and disposition

QC-LAUNCH-002 signature/authority mapping, QC-LAUNCH-004 isolated PostgreSQL/schema parity, and QC-LAUNCH-005 effective scientific source remain unresolved dependencies. No remote action is requested or performed. State: **PARTIAL / BLOCKED / NO-GO**.
