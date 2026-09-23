import type { APIRoute } from 'astro';

import { getPool } from '../../shared/database/pool.js';

/** Local, opt-in measurement endpoint. It exposes process/pool counts only. */
export const GET: APIRoute = ({ request }) => {
  if (
    (process.env.NODE_ENV !== 'development' && process.env.NODE_ENV !== 'test') ||
    process.env.QC_PERF_METRICS_ALLOW !== 'true' ||
    !process.env.QC_PERF_METRICS_TOKEN ||
    request.headers.get('authorization') !== `Bearer ${process.env.QC_PERF_METRICS_TOKEN}` ||
    (new URL(request.url).hostname !== '127.0.0.1' && new URL(request.url).hostname !== 'localhost')
  ) {
    return new Response(null, { status: 404, headers: { 'cache-control': 'no-store' } });
  }

  const pool = getPool();
  return Response.json(
    {
      sampledAt: new Date().toISOString(),
      processMemoryBytes: process.memoryUsage(),
      databasePool: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
        maximum: pool.options.max,
      },
    },
    { headers: { 'cache-control': 'no-store' } },
  );
};
