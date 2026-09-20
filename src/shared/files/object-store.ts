export interface StoredObject {
  bytes: Uint8Array;
  contentType: string;
}

export interface ObjectStore {
  put(key: string, object: StoredObject): Promise<void>;
  get(key: string): Promise<StoredObject | undefined>;
  /** Removes an uncommitted object after metadata/link persistence fails. */
  delete(key: string): Promise<void>;
}
