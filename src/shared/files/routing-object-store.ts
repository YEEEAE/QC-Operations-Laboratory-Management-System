import type { ObjectStore, StoredObject } from './object-store';

/** Writes new objects to one configured store and resolves historical records by provider. */
export class RoutingObjectStore implements ObjectStore {
  readonly provider: string;
  private readonly stores: ReadonlyMap<string, ObjectStore>;

  constructor(private readonly writeStore: ObjectStore, readers: readonly ObjectStore[]) {
    if (!writeStore.provider) throw new Error('Object store provider must be declared.');
    const stores = new Map<string, ObjectStore>();
    for (const store of [writeStore, ...readers]) {
      if (!store.provider || stores.has(store.provider))
        throw new Error('Object store providers must be unique and declared.');
      stores.set(store.provider, store);
    }
    this.provider = writeStore.provider;
    this.stores = stores;
  }

  put(key: string, object: StoredObject): Promise<void> {
    return this.writeStore.put(key, object);
  }

  get(key: string): Promise<StoredObject | undefined> {
    return this.writeStore.get(key);
  }

  getForProvider(provider: string, key: string): Promise<StoredObject | undefined> {
    return this.stores.get(provider)?.get(key) ?? Promise.resolve(undefined);
  }

  delete(key: string): Promise<void> {
    return this.writeStore.delete(key);
  }
}
