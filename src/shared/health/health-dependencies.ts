import { PostgresReadinessProbe } from './postgres-readiness-probe.js';
import { createReadinessResponse } from './readiness.js';

export function readinessDependencies() {
  return { probe: new PostgresReadinessProbe(), createResponse: createReadinessResponse };
}
