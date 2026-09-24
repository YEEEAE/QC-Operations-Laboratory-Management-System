# Laboratory report template drafts

## Purpose and boundary

The `/laboratory/report-templates` page captures transcription drafts for two
separately identified forms: Subatmospheric Pressure Air Leakage Test Report
and Pressure Decay Test Report. A draft preserves what the source record says;
it is not a controlled Laboratory test, scientific evaluation, approval,
electronic signature, inspection release, or product release.

Saving a draft does not create or update a row in `qc.lab_tests` and does not
advance a controlled workflow. Typed Tested By / Reviewed By / Approved By
values are transcription text only. PASS, FAIL, and HOLD are recorded source
values; the application does not calculate or re-evaluate them.

## Data and authorization

Draft data is stored in PostgreSQL `qc.laboratory_report_drafts` using the
forward-only migration `0039_laboratory_report_drafts.sql`. The JSONB payload
preserves source values as text, including measurements and their units as
entered. Each template currently requires 12 sample rows. This constraint is
local to these two report types and does not change controlled Laboratory
sample rules.

An active account needs `PERM-LAB-VIEW` to list/read, `PERM-LAB-CREATE` to
create, and `PERM-LAB-EDIT-DRAFT` to update. OWN scope is limited to the draft
author; GLOBAL scope permits the corresponding broader read or edit. The
server derives the author from the authenticated actor. Updates require the
current version and produce an audit event in the same transaction as the
draft change.

The bounded listing shows at most 50 recent drafts. Search, deletion/archive,
evidence attachment, source-record linking, and promotion into a controlled
Lab Test are not implemented. No numbering scheme or retention policy is
introduced. The UUID remains a technical Draft ID.

## Source-form authority

The supplied task description identifies the fields and the 12-row structure,
but this repository does not contain the controlled source forms or a
controlled template revision. Consequently, the UI keeps measurement values
as free text and does not impose units, precision, rounding, thresholds,
formulas, sample acceptance rules, or batch rules. The document number and
revision are transcribed as entered; they are not asserted as an approved
template-version snapshot. Obtain the controlled source forms and their
revision authority before claiming source fidelity or adding scientific rules.

## Print view

The print view includes the report type, Draft ID/version, entered fields, 12
sample rows, source-recorded results, and a clear transcription/approval
boundary. It does not render signoff names as signatures or imply approval.
Print layout is a convenience view and is not a controlled report issuance.
