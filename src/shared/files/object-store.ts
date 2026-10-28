export interface StoredObject {
  bytes: Uint8Array;
  contentType: string;
}

export interface ObjectStore {
  /** Provider persisted in qc.files.storage_provider; legacy stores default to OBJECT_STORE. */
  readonly provider?: string;
  put(key: string, object: StoredObject): Promise<void>;
  get(key: string): Promise<StoredObject | undefined>;
  /** Optional provider-aware read hook for mixed historical storage. */
  getForProvider?(provider: string, key: string): Promise<StoredObject | undefined>;
  /** Removes an uncommitted object after metadata/link persistence fails. */
  delete(key: string): Promise<void>;
}
