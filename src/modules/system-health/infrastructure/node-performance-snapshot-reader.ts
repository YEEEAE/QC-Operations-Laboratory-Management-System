import { getPool } from '../../../shared/database/pool.js';
import type {
  PerformanceSnapshot,
  PerformanceSnapshotReader,
} from '../ports/performance-snapshot.js';

export class NodePerformanceSnapshotReader implements PerformanceSnapshotReader {
  read(): PerformanceSnapshot {
    const pool = getPool();
    return {
      sampledAt: new Date().toISOString(),
      processMemoryBytes: process.memoryUsage(),
      databasePool: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
        maximum: pool.options.max,
      },
    };
  }
}
