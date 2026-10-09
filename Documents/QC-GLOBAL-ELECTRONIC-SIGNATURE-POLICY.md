# GLOBAL ELECTRONIC SIGNATURE & APPROVAL POLICY
## QC Operations & Laboratory Management System

**Policy Status:** Owner-Approved Functional Requirement  
**Scope:** Entire System — All Modules and Controlled Workflows

> **Repository reference.** Registered in `Documents/DOCUMENTATION-INVENTORY.md`. This
> is the canonical text of the owner-supplied global electronic-signature and approval
> policy. It is an owner-approved functional requirement. It is **not yet** a revisioned
> or effective controlled QMS policy: the action × subject × state × signer ×
> signature-meaning × policy-version map, the controlled revision and effective date, and
> the independent QMS/Security/Release disposition remain open. Keep unmapped actions
> fail-closed; do not implement code, permissions or migrations from this text alone.
> Related: `Documents/QC-OWNER-DECISION-ALL-APPROVALS-SIGNATURE-2026-10-05.md` (the P-05
> account-bound approval decision) and the reconciliation artifact
> `audit/launch-readiness/QC-LAUNCH-002/global-esign-policy-reconciliation.md`.

### 1. Global Electronic Signature Requirement

The system shall implement a centralized, reusable Electronic Signature and Approval Engine applicable to **all system modules, records, documents, and workflows that require formal authorization, approval, verification, closure, or controlled decision-making**.

Electronic signatures must not be limited to inspection reports or laboratory reports.

Every applicable controlled entity shall support electronically recorded approval decisions, with clear approval indicators, verified signer identity, decision meaning, timestamp, exact record version, and complete audit traceability.

The system shall not require handwritten signatures, drawing pads, or signature images.

### 2. System-Wide Applicability

The Electronic Signature Engine shall cover all applicable approval or controlled decision events across the following modules:

| Module | Applicable Electronic Signature Events |
|---|---|
| **NCR** | NCR review, disposition approval, closure approval |
| **CAPA** | CAPA plan approval, effectiveness verification, closure |
| **RCA** | Root-cause review and approval |
| **Findings** | Formal review, disposition and closure when required |
| **Receiving** | Controlled disposition, HOLD/release authorizations |
| **Quarantine** | Controlled decisions and authorized release |
| **Inspection Reports** | Preliminary approval and final approval |
| **Laboratory Tests** | Test review and final approval |
| **Retests** | Retest authorization and final result approval |
| **Reject Reports** | Review, rejection confirmation and approval |
| **Issue Slips** | Required approval stages and final authorization |
| **Controlled Documents** | SOP/WI/template review, revision approval and effectivity |
| **Change Requests** | Change review, authorization and closure |
| **Equipment** | Controlled eligibility and return-to-service decisions |
| **Calibration** | Calibration record review and authorized decisions |
| **Maintenance** | Required maintenance verification and release-to-use decisions |
| **Tasks** | Formal acceptance or closure only where required by policy |
| **Reports & Exports** | Formal report approval where required; ordinary exports do not automatically require signatures |
| **Administration** | High-risk administrative approvals where explicitly governed |
| **Backup & Recovery** | Authorized restore and recovery decisions where required |
| **Release Governance** | Release-candidate review, formal authorization and applicable exceptions |

For each entity type, the system must determine which events require a signature using the applicable approved workflow policy.

**Routine operations such as opening a page, entering draft data, searching, filtering, or viewing a report do not automatically require electronic signatures.**

### 3. Centralized Approval Authority

The following role hierarchy applies:

**QC01–QC04 / Employee**
- Create and update eligible operational records.
- Submit controlled records for review.
- No preliminary or final approval authority.

**Supervisor**
- Review submitted operational records.
- Perform preliminary electronic approval where required.
- Return or reject records where the workflow permits.
- No final approval authority.

**QCM / Manager**
- Review operational records.
- Perform final electronic approval across applicable controlled workflows.
- Exercise preliminary review authority only where explicitly permitted.
- Follow required independence and approval-sequence rules.

**System Owner — yazeed**
- Full system and administrative authority.
- Preliminary and final approval capabilities.
- Controlled override authority for applicable workflows.
- Every exceptional override must be explicit, justified and recorded in the Audit Trail.

**Admin**
- Technical and administrative permissions.
- No QC approval authority solely through the Admin role.

Where a workflow requires independent preliminary and final approvers, the same person shall not silently satisfy both stages. Owner exceptions must be clearly recorded as exceptions, not represented as independent approvals.

### 4. Electronic Signature Process

For each controlled approval action:

1. Open the exact record.
2. Display its current state and version.
3. Display the intended decision and its meaning.
4. Verify the user's approval authority.
5. Require explicit signing intent and reauthentication.
6. Validate the record's current version and workflow prerequisites.
7. Commit the decision, signature and audit event consistently.
8. Update the record's approval status.
9. Display the verified electronic signature details.

If authentication, authorization, evidence verification, or database persistence fails, the approval must not be recorded as successful.

### 5. Universal Electronic Signature Indicators

Every applicable controlled record must display its approval state in both the detail page and relevant list views.

Standard indicators may include:

- Pending Review
- Preliminary Approved
- Pending Final Approval
- Final Approved
- Returned for Correction
- Rejected
- Closed
- Approval Blocked
- Signature Verification Unavailable

The status display must reflect the specific approved workflow. A `Closed` state must not automatically mean `Final Approved`.

Each verified signature must make the following details accessible:

- Signer name and unique identity
- Signer role
- Decision type and meaning
- Date and time
- Record identifier
- Exact signed version
- Signature verification status
- Audit Trail reference

Where appropriate, human-readable report and record exports must also include their relevant electronic approval information.

### 6. Example — NCR

An applicable NCR workflow may follow:

`Draft → Submitted → Supervisor Review → Preliminary Approved → QCM Final Approval → Controlled Follow-Up / Closure`

The exact NCR states and signature checkpoints must match its approved workflow definition.

Example of the signature panel displayed within an NCR:

**NCR-2026-001**

Preliminary Approval:
- Status: Approved
- Approved By: QC Supervisor
- Date: Recorded automatically
- Electronic Signature: Verified

Final Approval:
- Status: Approved
- Approved By: QCM
- Date: Recorded automatically
- Electronic Signature: Verified

Closure:
- Status: Pending
- Required Authority: According to the approved NCR closure policy

This same presentation pattern must apply to CAPA, RCA, controlled documents, inspections and other applicable workflows.

### 7. Technical Architecture

Implement one **Centralized Electronic Signature Service**, not separate incompatible signature implementations for every module.

The service must support:

- Entity type and entity ID
- Decision/action type
- Approval stage
- Required permission
- Required signer role
- Workflow prerequisites
- Signature policy reference and version
- Signer authentication
- Record version binding
- Replay protection
- Concurrency protection
- Signature persistence
- Audit Trail integration
- Signature history and verification
- Controlled exceptions and Owner Overrides

Use a centralized registry to map each supported entity type and controlled action to its approved signing policy.

Reuse shared frontend components for approval status, signature details and the signing confirmation dialog.

All restrictions must be enforced on the server, independently of interface visibility.

### 8. Integrity and Compliance

The system must prevent:

- Unauthorized signing
- Signing on behalf of another user
- Approval without required authentication
- Replay of previous signing requests
- Approval of stale record versions
- Unauthorized changes to signed record versions
- Transfer of signatures between records
- Hidden approval overrides
- Misrepresentation of Owner exceptions
- Falsified signature dates or identities

Record signing, formal approval, operational release and controlled closure must remain distinguishable when they represent separate business decisions.

Applicable electronic-record and electronic-signature regulatory requirements must be verified based on the organization's regulatory scope before any compliance claim.

### 9. Mandatory Verification

Test the Electronic Signature Engine across all applicable modules, not only reports.

At minimum verify representative NCR, CAPA, RCA, Inspection, Laboratory, Documents, Change Requests, Reject Reports, Equipment, Quarantine, and Release Governance workflows.

For every applicable workflow test:

- Authorized preliminary approval
- Authorized final approval
- Unauthorized approval denial
- Record-version binding
- Required approval sequence
- Reauthentication
- Audit Trail
- Signature display
- Signature history
- Concurrent approval attempts
- Failed authentication
- Owner override behavior
- Controlled correction after signing

A module must not receive a verified approval/signature completion score until its applicable signing requirements and tests have passed with evidence.

### 10. Final Acceptance Condition

**All system modules requiring controlled approvals must use the same verified Electronic Signature infrastructure.**

Each applicable controlled decision must have an authentic, attributable, version-bound and traceable electronic signature.

No application module may silently bypass its approved electronic-signature requirements.