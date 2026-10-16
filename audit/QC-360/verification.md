# QC-360 — database verification evidence

Run: 2026-10-16T01:06:58Z on a disposable PostgreSQL 18.6 cluster
(created by `scripts/db/disposable-postgres.sh provision`; local, disposable, never the provider database).

## 1. Migrations applied to a fresh database
```json
{"mode":"migrate","applied":["0001","0002","0003","0004","0005","0006","0007","0008","0009","0010","0011","0012","0013","0014","0015","0016","0017","0018","0019","0020","0021","0022","0023","0024","0025","0026","0027","0028","0029","0030","0031","0032","0033","0034","0035","0036","0037","0038","0039","0040","0041","0042","0043","0044","0045","0046","0047","0048"],"pending":[]}
```

## 2. Schema integrity after migration
```json
{"status":"ok","migrationCount":48,"tableCount":89,"orphanCount":0}
```

## 3. Behavioural guard checks — `verify-authoring-guards.sql`
```
psql:audit/QC-360/verify-authoring-guards.sql:50: NOTICE:  PASS guard-1: authored approval without effective document rejected
psql:audit/QC-360/verify-authoring-guards.sql:69: NOTICE:  PASS guard-2: unsupported schemaVersion rejected
psql:audit/QC-360/verify-authoring-guards.sql:84: NOTICE:  PASS guard-3: authored approval with effective document commits
psql:audit/QC-360/verify-authoring-guards.sql:96: NOTICE:  PASS guard-4: approved authoring_origin is immutable
psql:audit/QC-360/verify-authoring-guards.sql:136: NOTICE:  PASS guard-5a: source-conflicted transcription rejected
psql:audit/QC-360/verify-authoring-guards.sql:136: NOTICE:  PASS guard-5b: transcription without MATCHED source evidence rejected
psql:audit/QC-360/verify-authoring-guards.sql:149: NOTICE:  PASS guard-6a: body block against an EFFECTIVE version rejected
psql:audit/QC-360/verify-authoring-guards.sql:173: NOTICE:  PASS guard-6b: draft body block insert allowed
psql:audit/QC-360/verify-authoring-guards.sql:173: NOTICE:  PASS guard-6c: body edit after draft rejected
psql:audit/QC-360/verify-authoring-guards.sql:173: NOTICE:  PASS guard-6d: body delete after draft rejected
psql:audit/QC-360/verify-authoring-guards.sql:189: NOTICE:  PASS catalogue: 194 rows, 7 source-conflicted, T175 excluded, 0 approved legacy transcriptions
ALL VERIFICATION CHECKS COMPLETED
```
