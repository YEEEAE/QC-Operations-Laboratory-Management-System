import { Pool } from 'pg';
import assert from 'node:assert/strict';
const url = new URL(process.env.DATABASE_URL);
assert.equal(url.hostname,'localhost'); assert.equal(url.port,'55432'); assert.equal(url.pathname,'/qc_disposable');
const pool = new Pool({connectionString:url.href});
try {
  await pool.query(`INSERT INTO qc.tasks(task_no,title,priority,state,created_by,updated_by)
    SELECT 'CA-P-TASKS-LOCAL','Review the disposable presentation evidence','UNSPECIFIED','DRAFT',id,id FROM qc.users
    WHERE login_identity='verify-employee' ON CONFLICT(task_no) DO NOTHING`);
} finally { await pool.end(); }
