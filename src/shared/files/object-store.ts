export interface StoredObject {
  bytes: Uint8Array;
  contentType: string;
}

export interface ObjectStore {
  put(key: string, object: StoredObject): Promise<void>;
  get(key: string): Promise<StoredObject | undefined>;
}
