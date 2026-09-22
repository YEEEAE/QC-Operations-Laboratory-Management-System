import type { APIRoute } from 'astro';
import { readinessDependencies } from '../../../shared/health/health-dependencies.js';

export const GET: APIRoute = () => {
  const dependencies = readinessDependencies();
  return dependencies.createResponse(dependencies.probe);
};
