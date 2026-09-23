import type { PerformanceSnapshotReader } from '../ports/performance-snapshot.js';

export class GetPerformanceSnapshotUseCase {
  constructor(private readonly reader: PerformanceSnapshotReader) {}

  execute() {
    return this.reader.read();
  }
}
