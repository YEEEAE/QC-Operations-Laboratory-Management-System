import type { APIRoute } from 'astro';
import { readinessDependencies } from '../../../shared/health/health-dependencies.js';

export const GET: APIRoute = () =>
  readinessDependencies().createResponse(readinessDependencies().probe);
