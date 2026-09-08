# QC-100-01 — Requirement-to-Evidence Matrix

The matrix maps each audited domain to its main controlled source, current evidence, and missing evidence. `E-*` refs are in `00-REALITY-FREEZE.md`; `G-*` refs are in `02-GAP-REGISTER.md`. A document reference proves a requirement is defined, not that implementation or runtime behavior works.

| # | Requirement family / controlled source | Current implementation/test evidence | Runtime/UAT evidence | Security / negative evidence | State | Gap |
|---:|---|---|---|---|---|---|
| 1 | Quality verification: `TESTING-STRATEGY`, `UAT-ACCEPTANCE-PLAN` | E-05,E-08,E-09 | Missing critical workflow execution | Partial negative suites | UNVERIFIED | G-001,G-006,G-013 |
| 2 | Compliance/QMS: `BUSINESS-RULES`, `RISK-REGISTER` | Domain modules present | No compliance/UAT record | Policy gates documented | UNVERIFIED | G-010,G-013 |
| 3 | AppSec: `SECURITY-ARCHITECTURE` | E-04,E-05,E-06; security code present | No deployed security run | Static scans/negative tests partial | UNVERIFIED | G-001,G-007 |
| 4 | Records integrity: `SYSTEM-INVARIANTS`, `DATA-MODEL` | Version/history code; unit evidence | DB constraints unknown | Stale/controlled patterns present | UNVERIFIED | G-001,G-004 |
| 5 | Audit: constitution/business rules | Audit capability and focused tests | Persistence/restore absent | Actor/scope design present | UNVERIFIED | G-001,G-006 |
| 6 | IAM/RBAC: `ROLE-MATRIX`, `PERMISSION-MATRIX` | Identity/policy code; unit exit 0 | Live grants/role UAT absent | Server-side intent present | UNVERIFIED | G-001,G-004 |
| 7 | Database: `DATABASE-ARCHITECTURE`, migration set | 18 migration files; build | Applied head/privilege unknown | TLS/config code only | UNVERIFIED | G-001,G-002 |
| 8 | Workflows: `STATE-MACHINES`, `BUSINESS-RULES` | State/use-case modules; unit | End-to-end DB workflow absent | Unknown transitions intended deny | UNVERIFIED | G-001,G-006 |
| 9 | Recovery: `BACKUP-RECOVERY-PLAN` | Catalog/metadata code | No backup/restore drill | Restore authority specified | UNVERIFIED | G-006,G-013 |
| 10 | Requirements: `REQUIREMENTS-TRACEABILITY` | Matrix docs exist | No exact-release trace run | Risk/policy gaps remain | UNVERIFIED | G-005,G-010 |
| 11 | Architecture: `ARCHITECTURE-SPECIFICATION` | E-04 exit 0 | No deployed path proof | E-12 contradicts boundary | FAIL | G-003 |
| 12 | Functional correctness: `UAT-ACCEPTANCE-PLAN` | Routes/modules/tests present | E2E unavailable | Auth tests blocked | UNVERIFIED | G-006,G-008 |
| 13 | Test architecture: `TESTING-STRATEGY` | Unit 88/88; CI jobs | Integration/E2E unavailable | Negative runtime absent | FAIL | G-001,G-006,G-007 |
| 14 | Risk: `RISK-REGISTER` | Risks documented | No current risk acceptance | Critical risks open | UNVERIFIED | G-010,G-013 |
| 15 | E-records/signature: constitution/UAT | Approval modules/static tests | No ceremony UAT | Reauth/SoD modeled | UNVERIFIED | G-001,G-006 |
| 16 | Document control: `BUSINESS-RULES`, UI/UX spec | Version modules/focused tests | No live workflow | History protections intended | UNVERIFIED | G-001,G-006 |
| 17 | Data governance: `DATA-DICTIONARY`, `DATA-MODEL` | Typed models/ownership | No applied catalog/lineage | Scope rules documented | UNVERIFIED | G-001,G-010 |
| 18 | Lifecycle: `STATE-MACHINES` | State modules/unit negatives | No persisted transition run | Default deny intended | UNVERIFIED | G-001,G-004 |
| 19 | Error/recovery: `ERROR-ARCHITECTURE` | Error/health code/build | Browser failure run absent | Redaction code/static | UNVERIFIED | G-006 |
| 20 | Resilience: constitution/database docs | Transactions/retry code | No fault injection/lock run | Fail-closed intent | UNVERIFIED | G-001,G-013 |
| 21 | Privacy: `SECURITY-ARCHITECTURE` | Redaction/session/file code | No deployed data-flow evidence | Static secret scan limited | UNVERIFIED | G-009,G-013 |
| 22 | Operational UX: `UI-UX-SPECIFICATION` | UI primitives/pages | No user/UAT run | Protected UX intended | UNVERIFIED | G-006,G-011 |
| 23 | QC workflow UX: UI/UX + business rules | QC pages/statuses | No controlled journey | PASS/release separation static | UNVERIFIED | G-006,G-013 |
| 24 | Role UX: role/permission matrices | Capability navigation | No persona browser UAT | Server auth intent | UNVERIFIED | G-006,G-010 |
| 25 | Forms: UI/UX/design system | Form primitives/typecheck | No data-entry UAT | Server validation intended | UNVERIFIED | G-006,G-011 |
| 26 | Accessibility: UI/UX + UAT | Accessibility specs/tests | E2E 57 failures | Manual evidence absent | UNVERIFIED | G-006,G-011 |
| 27 | IA/permissions: route manifest + permission matrix | Route tree/static guards | No runtime deep-link evidence | Delivery DB contradiction | FAIL | G-003,G-006 |
| 28 | Human factors: UAT/design docs | State/error components | No human study | No measured safe use | UNVERIFIED | G-011,G-012 |
| 29 | Performance: observability/testing docs | Smoke script/build | No approved SLO/load | No runtime threshold | UNVERIFIED | G-012 |
| 30 | Observability: `OBSERVABILITY-ARCHITECTURE` | Logger/health/OTel code | No provider telemetry | Redaction intent | UNVERIFIED | G-009 |
| 31 | Deployment: `DEPLOYMENT-ARCHITECTURE` | Render/CI/release files | No provider evidence | No production write | UNVERIFIED | G-007,G-009 |
| 32 | Change/config: business/deployment docs | Change/config modules | No change cycle | Secret separation intended | UNVERIFIED | G-009,G-013 |
| 33 | Maintainability: architecture/testing docs | typecheck/lint/format exit 0 | No production signal | Static boundary contradiction | PARTIAL | G-003,G-017 |
| 34 | API governance: architecture/error docs | Actions/routes | Contract DB tests blocked | Direct DB composition | FAIL | G-003,G-001 |
| 35 | Concurrency: business/db docs | Version/idempotency code | PG lock tests unavailable | Negative stale intent | UNVERIFIED | G-001,G-004 |
| 36 | Files: data/security/backup docs | Hash/private store code | Storage/recovery absent | Traversal/auth tests partial | UNVERIFIED | G-001,G-018 |
| 37 | Product strategy: constitution/UAT | Scope/domain map | No stakeholder acceptance | Risk constraints only | UNVERIFIED | G-010,G-013 |
| 38 | UX design: `DESIGN-SYSTEM`, UI/UX | Components/styles | No visual/browser run | Security states intended | UNVERIFIED | G-006,G-011 |
| 39 | IA: route manifest | Routes/navigation | No browser map run | Direct composition issue | FAIL | G-003,G-006 |
| 40 | Interaction: UI/UX/design system | Dialogs/forms/states | No interaction run | Server action intent | UNVERIFIED | G-006,G-011 |
| 41 | Design system: `DESIGN-SYSTEM` | Tokens/components | No visual regression | Static token checks | PARTIAL | G-011 |
| 42 | Enterprise UX: roles/UAT | Role-aware surfaces | No enterprise UAT | Auth intent | UNVERIFIED | G-006,G-010 |
| 43 | Laboratory UX: business/UI docs | Lab routes/modules | No scientific UAT | Policy-deny intent | UNVERIFIED | G-006,G-020 |
| 44 | Compliance UX: UAT/business rules | Evidence/status surfaces | No reviewer UAT | Sensitive actions gated | UNVERIFIED | G-013,G-020 |
| 45 | Dashboard: reporting/UI docs | Read model/page | No scoped data run | Direct DB import found | UNVERIFIED | G-003,G-019 |
| 46 | Visualization: design/UI docs | SVG/table chart | No browser/contrast run | Authorized dataset not runtime-proven | UNVERIFIED | G-006,G-011 |
| 47 | Data-driven design: data/report docs | Read models | No approved dataset | Scope not runtime-proven | UNVERIFIED | G-001,G-019 |
| 48 | Tables/density: design system | DataTable/filter/pagination | No large-data UAT | Scope intent | UNVERIFIED | G-006,G-012 |
| 49 | Search: business/UI docs | Search service | No authorized runtime | Actor predicates static | UNVERIFIED | G-001,G-019 |
| 50 | Navigation: route/UI docs | Registry/sidebar/breadcrumb | No browser run | Capability ≠ auth documented | UNVERIFIED | G-006 |
| 51 | UI: design system | UI files/build | No visual run | Static scan | UNVERIFIED | G-006,G-011 |
| 52 | Visual design: design system | Tokens/styles | No screenshot baseline | No external CDN intent | UNVERIFIED | G-011 |
| 53 | Hierarchy: UI/UX spec | Headings/status components | No review | Critical states specified | UNVERIFIED | G-011 |
| 54 | Responsive: UI/UAT | Responsive specs | E2E blocked | No device evidence | UNVERIFIED | G-006,G-011 |
| 55 | Keyboard/focus: accessibility docs | Focus/dialog code | No keyboard run | No bypass proof | UNVERIFIED | G-006,G-011 |
| 56 | Screen reader: accessibility docs | Labels/native tables | No AT run | Disclosure review absent | UNVERIFIED | G-006,G-011 |
| 57 | Service design: workflow/UAT | Queue/notification concepts | No operating rehearsal | Ownership partial | UNVERIFIED | G-010,G-013 |
| 58 | Handoff/queue: role/UAT | Approvals/queue surfaces | No queue run | SoD modeled | UNVERIFIED | G-006,G-010 |
| 59 | Notifications: business/observability | Outbox/notification code | DB/provider unavailable | Failure semantics static | UNVERIFIED | G-001,G-009 |
| 60 | Audit UX: audit docs | Audit query/page | No persisted timeline run | Payload safety intended | UNVERIFIED | G-001,G-006 |
| 61 | UX writing: UI/terminology docs | Microcopy exists | No content/user review | Safe errors intended | UNVERIFIED | G-011,G-014 |
| 62 | Error UX: error architecture | 404/500/stale components | E2E blocked | Redaction static | UNVERIFIED | G-006 |
| 63 | Latency UX: performance docs | Loading/smoke code | No SLO run | No timing disclosure review | UNVERIFIED | G-012 |
| 64 | Draft/autosave: business/UI docs | Draft rules/components | No browser conflict run | Controlled action separation | UNVERIFIED | G-006,G-011 |
| 65 | Destructive actions: business/UI docs | Confirm/intent code | No browser UAT | Server auth remains required | UNVERIFIED | G-006,G-011 |
| 66 | UX research: UAT plan | No study artifact | No participants | No evidence | UNVERIFIED | G-012,G-013 |
| 67 | Task metrics: requirements/metrics | Task domain only | No time/task data | No safety metric | UNVERIFIED | G-012,G-013 |
| 68 | Design QA: design/UAT docs | Static checks | No exact-release visual QA | No manual evidence | UNVERIFIED | G-006,G-011 |
| 69 | Design governance: design system | Token docs | No governance cycle | Static only | UNVERIFIED | G-011,G-014 |
| 70 | Security UX: security/UAT | Auth/error UI | Browser blocked | Static security intent | UNVERIFIED | G-006 |
| 71 | Privacy UX: security/UI | Redaction/session code | No privacy UAT | Static only | UNVERIFIED | G-009,G-013 |
| 72 | Session UX: auth/UAT | Login/logout/session | No live expiry run | Cookie controls static | UNVERIFIED | G-001,G-006 |
| 73 | Print/export: reporting/UAT | Report/export code partial | No export/browser run | Formula safety not current runtime | UNVERIFIED | G-006,G-018 |
| 74 | Reporting: reporting/checklist | Registry/read models | No scoped report run | Direct DB import found | UNVERIFIED | G-003,G-019 |
| 75 | MDM: data/business docs | Limited admin/master code | No governed master data | Change history not runtime-proven | UNVERIFIED | G-010,G-013 |
| 76 | Data quality: data dictionary | Validators/domain guards | No data profile/runtime | Validation partial | UNVERIFIED | G-001,G-010 |
| 77 | Lineage: data model/traceability | Ownership/snapshot concepts | No end-to-end lineage | Scope/report link absent | UNVERIFIED | G-003,G-010 |
| 78 | CI/CD: CI/release docs | Workflow static | No current remote run | Read-only workflow permissions | UNVERIFIED | G-007 |
| 79 | Secure SDLC: security/CI | Lockfile/scripts | No advisory/SBOM evidence | No push by audit | UNVERIFIED | G-007,G-009 |
| 80 | Environments: deployment docs | Env parser/render config | No stage/prod evidence | Secret contract only | UNVERIFIED | G-009,G-013 |
| 81 | Secrets: security/deployment docs | Redaction/env code | No provider rotation | Values withheld; state unknown | UNVERIFIED | G-009 |
| 82 | Incident: ops docs | Quick reference | No drill/incident record | Correlation intent | UNVERIFIED | G-009,G-013 |
| 83 | Continuity: backup/UAT docs | Recovery metadata | No restore drill | Authority policy only | UNVERIFIED | G-006,G-013 |
| 84 | Capacity: performance docs | Smoke only | No load environment | No capacity risk proof | UNVERIFIED | G-012,G-013 |
| 85 | DevEx: development docs/package | Type/lint/unit/build exit 0 | Node mismatch | Static only | PARTIAL | G-017 |
| 86 | Tech debt: mind/risk docs | Historical gap records | No current debt gate | Boundary debt observed | UNVERIFIED | G-003,G-012 |
| 87 | Dependencies: package/CI | Lockfile/pinned pnpm | No CI install evidence | Node mismatch warning | UNVERIFIED | G-007,G-017 |
| 88 | Terminology: UI/UX docs | Bilingual content | No glossary/review run | Safe errors only | UNVERIFIED | G-011,G-014 |
| 89 | Components: design system | Shared components/layouts | No browser component run | Static scan | UNVERIFIED | G-003,G-011 |
| 90 | Component states: UI/UX | Loading/error/stale/empty | No browser state run | Stale intent | UNVERIFIED | G-006,G-011 |
| 91 | Tokens: design system | Token file/static checks | No visual regression | Static semantic colors | PARTIAL | G-011 |
| 92 | Typography/layout: design system | Global CSS/tokens | No visual/RTL run | No runtime proof | UNVERIFIED | G-006,G-011 |
| 93 | Color: design/accessibility | Semantic tokens | No contrast run | Status not color-only by design | UNVERIFIED | G-011 |
| 94 | Icons: design system | Icons/assets | No visual/AT run | Labels not fully evidenced | UNVERIFIED | G-011 |
| 95 | Microinteractions: UI/motion docs | Toast/dialog/loading | No browser run | No side-effect proof | UNVERIFIED | G-006,G-011 |
| 96 | Motion: motion/accessibility docs | Reduced-motion CSS/spec | E2E blocked | No preference run | UNVERIFIED | G-006,G-011 |
| 97 | Motion/digital art: design assets | Assets present | No visual/content review | No safety evidence | UNVERIFIED | G-011,G-013 |
| 98 | AI safety: AI rules/UAT | Advisory route/provider | No live provider run | Explicit no-authority boundary | UNVERIFIED | G-006,G-020 |
| 99 | AI eval/model risk: AI docs | Contract only | No eval/model evidence | No authority expansion | UNVERIFIED | G-013,G-014 |
| 100 | Human-in-loop AI: AI/UAT docs | Read-only/advisory UX | No human UAT | Boundary specified | UNVERIFIED | G-006,G-013 |

## Evidence rule

The matrix is intentionally conservative. `PARTIAL` and `UNVERIFIED` mean the source or code may exist, but the required current execution evidence is absent. No matrix row authorizes production release or a closure claim.

