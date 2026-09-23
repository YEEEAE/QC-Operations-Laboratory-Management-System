export interface PerformanceSnapshot {
  sampledAt: string;
  processMemoryBytes: NodeJS.MemoryUsage;
  databasePool: {
    total: number;
    idle: number;
    waiting: number;
    maximum: number;
  };
}

export interface PerformanceSnapshotReader {
  read(): PerformanceSnapshot;
}
