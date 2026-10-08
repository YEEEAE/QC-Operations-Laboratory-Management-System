# QC360 isolated restore technical source

Date: 2026-10-08. Requirement: REQ-BKP-004.
Authority scope: workspace owner requested local implementation and authoring technical sources. This is a technical execution contract, not provider approval, an electronic signature or human UAT evidence.

The operator supplies both source and target explicitly through --source / --target or QC_LOCAL_DRILL_SOURCE_URL / QC_LOCAL_DRILL_TARGET_URL, plus --evidence-dir and --pg-bin. DATABASE_URL and inherited libpq settings are ignored. Both connections must name a qc_local_drill_* database on localhost, 127.0.0.1 or ::1. Source and target must differ and target must contain no user relations. No drop, reset, cleanup or production restore is performed.

The CLI uses read-only source connections, a custom-format pg_dump, archive inspection and pg_restore --single-transaction --exit-on-error. It compares full normalized schema dump hashes, relation definition hashes, exact table counts, ordered JSON row hashes and qc.schema_migrations ledger hashes before/after. It rejects a changed source or mismatched restoration. Archive corruption is denied by pg_restore inspection or rollback of the restore transaction. Errors expose fixed classifications only, never raw provider diagnostics, rows or credentials.

Evidence is restore-drill.json plus local-drill.dump in the explicit directory. The dump contains source data and must be handled as local controlled evidence; credentials are not embedded in its commands or report. Elapsed time is a measurement, with no approved SLO/RPO/RTO claim. This is an operator database drill; application restore requests remain PLANNED and production/provider DR, object-store recovery, scheduling, application smoke and human acceptance require their own evidence.
