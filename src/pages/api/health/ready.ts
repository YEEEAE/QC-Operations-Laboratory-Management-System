import type { APIRoute } from 'astro';
import { PostgresReadinessProbe } from '../../../shared/health/postgres-readiness-probe.js';
import { createReadinessResponse } from '../../../shared/health/readiness.js';

export const GET: APIRoute = () => createReadinessResponse(new PostgresReadinessProbe());
