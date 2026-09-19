# Canonical route matrix

**Freeze:** 2026-09-18 — `a6876f0fb0de6acbead7f62b3d1fbdf6c61e5de7`  
**Source:** `src/shared/routing/routes.ts` and `src/ui/navigation/navigation.ts`  
**Counts:** 85 registered routes; 83 physical Astro page files; 77 required
registered page files; 2 deferred auth route declarations; 6 conditional
creation routes; 32 navigation destinations.

## Decision rules

- `PUBLIC` is available without an active session.
- `AUTHENTICATED` requires a server-resolved `ACTIVE` session. Ordinary pages
  are visible to active authenticated members; capability hints in navigation
  are presentation only.
- `YAZEED_ONLY` requires the active account with role `SYSTEM_OWNER` and
  `loginIdentity === 'yazeed'`; the current set is exactly `/system/health` and
  `/system/control-center`.
- `Read` means a server-side query/read model with secrets and identity-security
  data excluded. `Mutation authority` is always the owning application use case
  plus permission, scope, state, version, SoD, signature, and business rules.
- `R` means route registry/architecture coverage; `D` means owning domain
  unit/integration coverage; `E` means relevant Playwright coverage when the
  scenario has fixtures. A listed test is not evidence that the suite executed
  on this freeze.

| ID | Path | Page | Domain | Visibility | Navigation | Read behavior | Mutation authority | Yazeed-only | Tests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RT-ROOT-001 | `/` | `src/pages/index.astro` | shared | PUBLIC | — | public redirect/render | owning use case if any | NO | R/E |
| RT-AUTH-001 | `/login` | `src/pages/login.astro` | identity | PUBLIC | — | public login surface | auth use case | NO | R/E |
| RT-AUTH-002 | `/auth/recovery` | `src/pages/auth/recovery.astro` | identity | AUTHENTICATED | — | active-session server read | identity use case | NO | R/D/E |
| RT-AUTH-003 | `/auth/reset/[requestId]` | `src/pages/auth/reset/[requestId].astro` | identity | AUTHENTICATED | — | active-session server read | identity use case | NO | R/D/E |
| RT-DASH-001 | `/dashboard` | `src/pages/dashboard/index.astro` | dashboard | AUTHENTICATED | Overview / Dashboard | server KPI/read models | dashboard use cases; no client authority | NO | R/D/E |
| RT-TASK-001 | `/tasks` | `src/pages/tasks/index.astro` | tasks | AUTHENTICATED | Work / Tasks | authorized task list/read model | task permissions + state/version | NO | R/D/E |
| RT-TASK-002 | `/tasks/new` | `src/pages/tasks/new.astro` | tasks | AUTHENTICATED | — | server form/read context | task create use case | NO | R/D/E |
| RT-TASK-003 | `/tasks/[taskId]` | `src/pages/tasks/[taskId].astro` | tasks | AUTHENTICATED | — | authorized task detail | task permissions + state/version | NO | R/D/E |
| RT-QUAL-001 | `/quality` | `src/pages/quality/index.astro` | quality | AUTHENTICATED | — | quality read models | quality use cases | NO | R/D/E |
| RT-FIND-001 | `/quality/findings` | `src/pages/quality/findings/index.astro` | quality | AUTHENTICATED | Quality / Findings | authorized finding list | finding permissions + state/version | NO | R/D/E |
| RT-FIND-002 | `/quality/findings/new` | `src/pages/quality/findings/new.astro` | quality | AUTHENTICATED | — | server form/read context | finding create use case | NO | R/D/E |
| RT-FIND-003 | `/quality/findings/[findingId]` | `src/pages/quality/findings/[findingId].astro` | quality | AUTHENTICATED | — | authorized finding detail | finding permissions + state/version | NO | R/D/E |
| RT-NCR-001 | `/quality/ncr` | `src/pages/quality/ncr/index.astro` | quality | AUTHENTICATED | Quality / NCR | authorized NCR list | NCR permissions + state/version | NO | R/D/E |
| RT-NCR-002 | `/quality/ncr/new` | `src/pages/quality/ncr/new.astro` | quality | AUTHENTICATED | — | server form/read context | NCR create use case | NO | R/D/E |
| RT-NCR-003 | `/quality/ncr/[ncrId]` | `src/pages/quality/ncr/[ncrId].astro` | quality | AUTHENTICATED | — | authorized NCR detail | NCR permissions + state/version | NO | R/D/E |
| RT-RCA-001 | `/quality/rca` | `src/pages/quality/rca/index.astro` | quality | AUTHENTICATED | Quality / RCA | authorized RCA list | RCA permissions + state/version | NO | R/D/E |
| RT-RCA-002 | `/quality/rca/[rcaId]` | `src/pages/quality/rca/[rcaId].astro` | quality | AUTHENTICATED | — | authorized RCA detail | RCA permissions + state/version | NO | R/D/E |
| RT-CAPA-001 | `/quality/capa` | `src/pages/quality/capa/index.astro` | quality | AUTHENTICATED | Quality / CAPA | authorized CAPA list | CAPA permissions + state/version | NO | R/D/E |
| RT-CAPA-002 | `/quality/capa/new` | `src/pages/quality/capa/new.astro` | quality | AUTHENTICATED | — | server form/read context | CAPA create use case | NO | R/D/E |
| RT-CAPA-003 | `/quality/capa/[capaId]` | `src/pages/quality/capa/[capaId].astro` | quality | AUTHENTICATED | — | authorized CAPA detail | CAPA permissions + P-04/state/version | NO | R/D/E |
| RT-QUAR-001 | `/quarantine` | `src/pages/quarantine/index.astro` | quarantine | AUTHENTICATED | Quarantine / Dashboard | quarantine read model | quarantine use cases | NO | R/D/E |
| RT-REC-001 | `/quarantine/receiving` | `src/pages/quarantine/receiving/index.astro` | quarantine | AUTHENTICATED | Quarantine / Receiving | authorized receiving list | receiving permissions + state/version | NO | R/D/E |
| RT-REC-002 | `/quarantine/receiving/new` | `src/pages/quarantine/receiving/new.astro` | quarantine | AUTHENTICATED | — | server form/read context | receiving create use case | NO | R/D/E |
| RT-REC-003 | `/quarantine/receiving/[receivingId]` | `src/pages/quarantine/receiving/[receivingId].astro` | quarantine | AUTHENTICATED | — | authorized receiving detail/history | receiving permissions + state/version | NO | R/D/E |
| RT-INSP-001 | `/quarantine/inspections` | `src/pages/quarantine/inspections/index.astro` | quarantine | AUTHENTICATED | Quarantine / Inspections | authorized inspection list | inspection permissions + state/version | NO | R/D/E |
| RT-INSP-002 | `/quarantine/inspections/[inspectionId]` | `src/pages/quarantine/inspections/[inspectionId]/index.astro` | quarantine | AUTHENTICATED | — | inspection detail + snapshot | inspection permissions + state/version | NO | R/D/E |
| RT-INSP-003 | `/quarantine/inspections/[inspectionId]/execute` | `src/pages/quarantine/inspections/[inspectionId]/execute.astro` | quarantine | AUTHENTICATED | — | execution context/snapshot | execute/submit use cases + evidence | NO | R/D/E |
| RT-INSP-004 | `/quarantine/inspections/[inspectionId]/review` | `src/pages/quarantine/inspections/[inspectionId]/review.astro` | quarantine | AUTHENTICATED | — | review context/history | P-05 review/approval + SoD/signature | NO | R/D/E |
| RT-QUAR-002 | `/quarantine/admin` | `src/pages/quarantine/admin/index.astro` | quarantine | AUTHENTICATED | Quarantine / Administration | template read projection | P-06 template authority; Admin alone denied | NO | R/D/E |
| RT-LAB-001 | `/laboratory` | `src/pages/laboratory/index.astro` | laboratory | AUTHENTICATED | — | laboratory read models | laboratory use cases | NO | R/D/E |
| RT-LAB-002 | `/laboratory/tests` | `src/pages/laboratory/tests/index.astro` | laboratory | AUTHENTICATED | Laboratory / Tests | authorized test list | lab permissions + state/version | NO | R/D/E |
| RT-LAB-003 | `/laboratory/tests/new` | `src/pages/laboratory/tests/new.astro` | laboratory | AUTHENTICATED | — | server form/read context | lab create use case | NO | R/D/E |
| RT-LAB-004 | `/laboratory/tests/[labTestId]` | `src/pages/laboratory/tests/[labTestId]/index.astro` | laboratory | AUTHENTICATED | — | test detail, measurements, history | lab permissions + state/version | NO | R/D/E |
| RT-LAB-005 | `/laboratory/tests/[labTestId]/execute` | `src/pages/laboratory/tests/[labTestId]/execute.astro` | laboratory | AUTHENTICATED | — | execution snapshot/context | lab execution + equipment eligibility | NO | R/D/E |
| RT-LAB-006 | `/laboratory/tests/[labTestId]/review` | `src/pages/laboratory/tests/[labTestId]/review.astro` | laboratory | AUTHENTICATED | — | review/evidence context | P-05 review/approve/reject policy | NO | R/D/E |
| RT-LAB-007 | `/laboratory/tests/[labTestId]/retests/new` | `src/pages/laboratory/tests/[labTestId]/retests/new.astro` | laboratory | AUTHENTICATED | — | original test/retest context | retest policy + permission/state/version | NO | R/D/E |
| RT-ASSET-001 | `/assets` | `src/pages/assets/index.astro` | assets | AUTHENTICATED | — | asset read models | asset use cases | NO | R/D/E |
| RT-EQUIP-001 | `/assets/equipment` | `src/pages/assets/equipment/index.astro` | assets | AUTHENTICATED | Assets / Equipment | equipment list/history | asset permissions + state/version | NO | R/D/E |
| RT-EQUIP-002 | `/assets/equipment/new` | `src/pages/assets/equipment/new.astro` | assets | AUTHENTICATED | — | server form/read context | equipment create use case | NO | R/D/E |
| RT-EQUIP-003 | `/assets/equipment/[equipmentId]` | `src/pages/assets/equipment/[equipmentId].astro` | assets | AUTHENTICATED | — | equipment/calibration/maintenance history | asset permissions + state/version | NO | R/D/E |
| RT-CAL-001 | `/assets/calibrations` | `src/pages/assets/calibrations/index.astro` | assets | AUTHENTICATED | Assets / Calibration | calibration list/history | calibration permissions + state/version | NO | R/D/E |
| RT-CAL-002 | `/assets/calibrations/new` | `src/pages/assets/calibrations/new.astro` | assets | AUTHENTICATED | — | server form/read context | calibration use case + evidence | NO | R/D/E |
| RT-CAL-003 | `/assets/calibrations/[calibrationId]` | `src/pages/assets/calibrations/[calibrationId].astro` | assets | AUTHENTICATED | — | calibration detail/certificate | calibration permissions + state/version | NO | R/D/E |
| RT-MAINT-001 | `/assets/maintenance` | `src/pages/assets/maintenance/index.astro` | assets | AUTHENTICATED | Assets / Maintenance | maintenance list/history | maintenance permissions + lock/state | NO | R/D/E |
| RT-MAINT-002 | `/assets/maintenance/new` | `src/pages/assets/maintenance/new.astro` | assets | AUTHENTICATED | — | server form/read context | maintenance use case + evidence | NO | R/D/E |
| RT-MAINT-003 | `/assets/maintenance/[maintenanceId]` | `src/pages/assets/maintenance/[maintenanceId].astro` | assets | AUTHENTICATED | — | maintenance detail/history | maintenance permissions + lock/state | NO | R/D/E |
| RT-DOC-001 | `/documents` | `src/pages/documents/index.astro` | documents | AUTHENTICATED | System / Controlled documents | controlled-document list | document permissions + version/state | NO | R/D/E |
| RT-DOC-002 | `/documents/new` | `src/pages/documents/new.astro` | documents | AUTHENTICATED | — | server form/read context | document create use case | NO | R/D/E |
| RT-DOC-003 | `/documents/[documentId]` | `src/pages/documents/[documentId]/index.astro` | documents | AUTHENTICATED | — | document/version history | document use cases + version checks | NO | R/D/E |
| RT-DOC-004 | `/documents/[documentId]/versions/new` | `src/pages/documents/[documentId]/versions/new.astro` | documents | AUTHENTICATED | — | version context | revision use case + change control | NO | R/D/E |
| RT-DOC-005 | `/documents/[documentId]/versions/[versionId]` | `src/pages/documents/[documentId]/versions/[versionId]/index.astro` | documents | AUTHENTICATED | — | immutable version/snapshot | document permissions + state/version | NO | R/D/E |
| RT-DOC-006 | `/documents/[documentId]/versions/[versionId]/review` | `src/pages/documents/[documentId]/versions/[versionId]/review.astro` | documents | AUTHENTICATED | — | review/e-signature context | P-05 approval + signature/SoD | NO | R/D/E |
| RT-APPROVAL-001 | `/approvals` | `src/pages/approvals/index.astro` | approvals | AUTHENTICATED | Governance / My approval queue | authorized approval queue | approval use case + authority/SoD | NO | R/D/E |
| RT-APPROVAL-002 | `/approvals/[approvalId]` | `src/pages/approvals/[approvalId].astro` | approvals | AUTHENTICATED | — | approval/evidence detail | approval state/version/signature | NO | R/D/E |
| RT-CHANGE-001 | `/change-requests` | `src/pages/change-requests/index.astro` | change-requests | AUTHENTICATED | Governance / Change requests | change-request list | change permissions + state/version | NO | R/D/E |
| RT-CHANGE-002 | `/change-requests/new` | `src/pages/change-requests/new.astro` | change-requests | AUTHENTICATED | — | contextual form/read model | change create use case | NO | R/D/E |
| RT-CHANGE-003 | `/change-requests/[changeRequestId]` | `src/pages/change-requests/[changeRequestId]/index.astro` | change-requests | AUTHENTICATED | — | request/history detail | change permissions + state/version | NO | R/D/E |
| RT-CHANGE-004 | `/change-requests/[changeRequestId]/review` | `src/pages/change-requests/[changeRequestId]/review.astro` | change-requests | AUTHENTICATED | — | review/evidence context | approval/signature/SoD | NO | R/D/E |
| RT-REPORT-001 | `/reports` | `src/pages/reports/index.astro` | reporting | AUTHENTICATED | Insights / Reports | authorized report read model | report query/export authorization | NO | R/D/E |
| RT-REPORT-002 | `/reports/[reportCode]` | `src/pages/reports/[reportCode].astro` | reporting | AUTHENTICATED | — | same scoped dataset as export | report query/export authorization | NO | R/D/E |
| RT-ADMIN-001 | `/admin` | `src/pages/admin/index.astro` | administration | AUTHENTICATED | Administration / Administration | safe admin projection | explicit admin permission; role alone insufficient | NO | R/D/E |
| RT-USER-001 | `/admin/users` | `src/pages/admin/users/index.astro` | administration | AUTHENTICATED | Administration / Users | safe account register | user-management permissions + owner protections | NO | R/D/E |
| RT-USER-002 | `/admin/users/new` | `src/pages/admin/users/new.astro` | administration | AUTHENTICATED | — | provisioning form | create-user use case + audit | NO | R/D/E |
| RT-USER-003 | `/admin/users/[userId]` | `src/pages/admin/users/[userId].astro` | administration | AUTHENTICATED | — | safe user detail/grants | user/role/scope use cases + owner protections | NO | R/D/E |
| RT-ROLE-001 | `/admin/roles` | `src/pages/admin/roles/index.astro` | administration | AUTHENTICATED | Administration / Roles | role read projection | role permissions + protected grants | NO | R/D/E |
| RT-ROLE-002 | `/admin/roles/[roleId]` | `src/pages/admin/roles/[roleId].astro` | administration | AUTHENTICATED | — | role/permission read projection | role assignment use cases + audit | NO | R/D/E |
| RT-ADMIN-002 | `/admin/permissions` | `src/pages/admin/permissions/index.astro` | administration | AUTHENTICATED | Administration / Permissions | permission read projection | no implicit mutation authority | NO | R/D/E |
| RT-ADMIN-003 | `/admin/scopes` | `src/pages/admin/scopes/index.astro` | administration | AUTHENTICATED | Administration / Scopes | scope read projection | incremental scope use cases + audit | NO | R/D/E |
| RT-SYSTEM-001 | `/system/health` | `src/pages/system/health.astro` | system-health | YAZEED_ONLY | System / Health | sanitized system/readiness overview | named owner use cases; no raw diagnostics | YES | R/D/E |
| RT-SYSTEM-002 | `/system/control-center` | `src/pages/system/control-center.astro` | system-health | YAZEED_ONLY | System / Control center | sanitized owner overview/accounts/audit | named owner use cases; owner protections | YES | R/D/E |
| RT-BACKUP-001 | `/system/backups` | `src/pages/system/backups/index.astro` | system-health | AUTHENTICATED | System / Backup and recovery | backup catalog/posture read model | recovery permissions + target/authorization checks | NO | R/D/E |
| RT-BACKUP-002 | `/system/backups/[backupId]` | `src/pages/system/backups/[backupId]/index.astro` | system-health | AUTHENTICATED | — | backup manifest/evidence | recovery use cases + integrity checks | NO | R/D/E |
| RT-BACKUP-003 | `/system/backups/[backupId]/restore` | `src/pages/system/backups/[backupId]/restore.astro` | system-health | AUTHENTICATED | — | restore context | recovery authority + isolated target + audit | NO | R/D/E |
| RT-REJ-001 | `/reject-reports` | `src/pages/reject-reports/index.astro` | reject-reports | AUTHENTICATED | Quality / Reject Reports | reject report list/read model | reject-report permissions + state/version | NO | R/D/E |
| RT-REJ-002 | `/reject-reports/new` | `src/pages/reject-reports/new.astro` | reject-reports | AUTHENTICATED | — | server form/read context | reject-report create use case | NO | R/D/E |
| RT-REJ-003 | `/reject-reports/issue-slips/[reportId]` | `src/pages/reject-reports/issue-slips/[reportId].astro` | reject-reports | AUTHENTICATED | — | issue slip/evidence detail | approval confirmation use case + audit | NO | R/D/E |
| RT-REJ-004 | `/reject-reports/daily/[reportId]` | `src/pages/reject-reports/daily/[reportId].astro` | reject-reports | AUTHENTICATED | — | daily reject/read model | report filters/export authorization | NO | R/D/E |
| RT-AI-001 | `/ai-advisory` | `src/pages/ai-advisory.astro` | ai-advisory | AUTHENTICATED | Insights / AI advisory | advisory result with sanitized provider status | advisory-only use case; never controlled mutation | NO | R/D/E |
| RT-SHARED-001 | `/search` | `src/pages/search.astro` | search | AUTHENTICATED | System / Search | authorized cross-domain read model | search scope/visibility rules | NO | R/D/E |
| RT-SHARED-002 | `/notifications` | `src/pages/notifications.astro` | identity | AUTHENTICATED | System / Notifications | recipient-scoped notifications | notification service; not business completion | NO | R/D/E |
| RT-SHARED-003 | `/account` | `src/pages/account.astro` | identity | AUTHENTICATED | System / Account | own account projection | account use cases + optimistic version | NO | R/D/E |
| RT-SHARED-004 | `/audit` | `src/pages/audit.astro` | audit | AUTHENTICATED | System / Audit | mapped/sanitized audit read model | no raw payload mutation | NO | R/D/E |
| RT-QUAR-003 | `/quarantine/admin/[templateId]` | `src/pages/quarantine/admin/[templateId].astro` | quarantine | AUTHENTICATED | — | template/version snapshot | P-06 lifecycle + signature/audit | NO | R/D/E |
| RT-DOC-007 | `/documents/[documentId]/versions/[versionId]/edit` | `src/pages/documents/[documentId]/versions/[versionId]/edit.astro` | documents | AUTHENTICATED | — | editable draft/context only | revision/change-request use case | NO | R/D/E |
| RT-REL-001 | `/governance/releases/[releaseId]` | `src/pages/governance/releases/[releaseId].astro` | release-governance | AUTHENTICATED | — | read-only server-derived release evidence | approval authority + evidence gate/SoD | NO | R/D/E |

## Count reconciliation

The physical page count includes `404.astro` and `500.astro`, which are error
surfaces and do not have canonical browser-route declarations. The registry has
85 entries: 77 required files, 6 conditional files, and 2 deferred auth
declarations. The architecture check is the executable authority for registry
coverage and currently passes.
