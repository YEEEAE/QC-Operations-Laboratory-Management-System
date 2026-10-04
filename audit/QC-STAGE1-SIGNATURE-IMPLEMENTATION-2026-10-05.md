# Stage-one signature implementation — PARTIAL

Owner decision documented 2026-10-05, effective 2026-10-04. No retroactive signatures.

## Implemented
Inspection and laboratory stage one generate STAGE1_APPROVE evidence after domain authorization and source checks, password reauthentication and ESIG authorization. Previous-version snapshot gets SHA256; repository validates actor/subject/version/action/meaning/request and inserts signature inside the state/audit/outbox transaction. Actions require password; review UI names signer, record, version and effect. Existing final signature remains separate. Supervisor foundation ESIG permission already exists; no production grants changed.

## Evidence and limits
- Initial unit RED exit 1: FINAL_APPROVE instead of STAGE1_APPROVE.
- Focused unit+integration final exit 0: 18 PASS, 7 deselected.
- Full two-stage integration exit 1: 10 PASS, 6 FAIL; legacy callers and expectations still need reconciliation. Do not claim full regression success.
- tsc exit 2: declaration/implicit-any errors in verification/release .mjs consumers; full typecheck not green.
- git diff --check exit 0.
- Docker Testcontainers uses postgres:18-alpine, disposable qc_test. Exact server patch version not captured.
- Runtime Node v22.22.3 (below supported contract); pnpm 11.25.0.
- HEAD 4a207bbc2341c7a17416f51558f1232d2a5d0cf0, dirty working tree.
- HTTP/authenticated E2E, export/detail parity, injected rollback, same-key replay, full action inventory NOT VERIFIED. Existing replay behavior has NOT been upgraded to return prior results.
- Inspection positive test seeds a controlled result; lab uses a test-only source evaluator. Neither proves an approved real-world scientific source. WI/SOP authority/effectivity and open scientific decisions remain STOP CONDITIONS.
- No migration, deployment, commit or push performed. Controlled policy documents have not been promoted as effective revisions.

## Modified files
- /Users/yzydalshmry/Desktop/QC-Operations-Laboratory-Management-System/.agents/mind/01-mind-latest.md
- /Users/yzydalshmry/Desktop/QC-Operations-Laboratory-Management-System/src/actions/laboratory.ts
- /Users/yzydalshmry/Desktop/QC-Operations-Laboratory-Management-System/src/actions/quarantine.ts
- /Users/yzydalshmry/Desktop/QC-Operations-Laboratory-Management-System/src/modules/e-signatures/application/final-approval-ceremony.ts
- /Users/yzydalshmry/Desktop/QC-Operations-Laboratory-Management-System/src/modules/laboratory/application/approve-lab-test.ts
- /Users/yzydalshmry/Desktop/QC-Operations-Laboratory-Management-System/src/modules/laboratory/application/dependencies.ts
- /Users/yzydalshmry/Desktop/QC-Operations-Laboratory-Management-System/src/modules/laboratory/infrastructure/postgres-repository.ts
- /Users/yzydalshmry/Desktop/QC-Operations-Laboratory-Management-System/src/modules/quarantine/application/dependencies.ts
- /Users/yzydalshmry/Desktop/QC-Operations-Laboratory-Management-System/src/modules/quarantine/inspection/application/approve-inspection.ts
- /Users/yzydalshmry/Desktop/QC-Operations-Laboratory-Management-System/src/modules/quarantine/inspection/infrastructure/postgres-repository.ts
- /Users/yzydalshmry/Desktop/QC-Operations-Laboratory-Management-System/src/pages/laboratory/tests/[labTestId]/review.astro
- /Users/yzydalshmry/Desktop/QC-Operations-Laboratory-Management-System/src/pages/quarantine/inspections/[inspectionId]/review.astro
- /Users/yzydalshmry/Desktop/QC-Operations-Laboratory-Management-System/tests/integration/qc-100-final-013/two-stage-controlled-approval.test.ts
- /Users/yzydalshmry/Desktop/QC-Operations-Laboratory-Management-System/tests/unit/authorization/stage-one-signature.test.ts

Changed-file content SHA256 (before this evidence file): 09e945e203c97613c4849922cfead787ee9c8cfd3b7092c1bf2c200ed23b5d62
