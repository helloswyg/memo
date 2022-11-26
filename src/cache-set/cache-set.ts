import isPromise from 'is-promise';

export interface CacheSetOptions {
  /**
   * The maximum time (in milliseconds) that a value would be kept in the cache without reading or updating it.
   * 
   * @defaultValue `Infinity`
   */
  ttl?: number;

  /**
   * The maximum time (in milliseconds) that a value would be kept in the cache since it was last computed.
   * 
   * @defaultValue `Infinity`
   */
  maxAge?: number;

  /**
   * The maximum number of items to store in the cache.
   * 
   * @defaultValue `8`
   */
  slots?: number;
  
  /**
   * Whether Promises are kept in the cache as Promises or as their resolved values.
   * 
   * @defaultValue `true` (promises are kept as Promises)
   */
  keepPromises?: boolean;
}

export type CacheKey = string | number | symbol;

export interface CacheItem<K extends CacheKey = CacheKey, V = any> {
  key: K;
  value: V;
  lastUsage: number;
  createdAt: number;
}

export class CacheSet<K extends CacheKey = CacheKey, V = any> implements Omit<Map<K, CacheItem<K, V>>, 'set'> {

  // Options:
  slots = 8;
  ttl = Infinity;
  maxAge = Infinity;
  keepPromises = true;

  // Keep track of usages:
  lastUsage = 0;
  lastWrite = 0;
  usages: K[] = [];

  // Actual data:
  map: Map<K, CacheItem<K, V>> = new Map();

  constructor(iterableOrObject?: Iterable<[K, V]> | CacheSetOptions, options?: CacheSetOptions) {
    const iterable = Array.isArray(iterableOrObject) ? iterableOrObject : null;
    const actualOptions: CacheSetOptions = options || (typeof iterableOrObject === 'object' ? iterableOrObject : { }) as CacheSetOptions;

    this.slots = actualOptions.slots || this.slots;
    this.ttl = actualOptions.ttl || this.ttl;
    this.maxAge = actualOptions.maxAge || this.maxAge;
    this.keepPromises = actualOptions.keepPromises || this.keepPromises;

    if (iterable) {
      iterable.forEach(([k, v]) => this.set(k, v));
    }
  }

  private updateUsages(key: K, push: 'delete'): undefined;
  private updateUsages(key: K, push: 'read' | 'write'): number;
  private updateUsages(key: K, type: 'read' | 'write' | 'delete'): undefined | number {
    const index = this.usages.indexOf(key);

    if (index !== -1) {
      this.usages.splice(index, 1);
    }

    if (type !== 'delete') {
      const now = Date.now();

      this.usages.push(key);

      if (type === 'write') this.lastWrite = now;

      return this.lastUsage = now;
    }
  }

  isAllExpired(): boolean {
    if (this.size === 0) return false;

    const now = Date.now();
    const sinceLastUsage = now - this.lastUsage;
    const sinceLastWrite = now - this.lastWrite;

    return sinceLastUsage > this.ttl ||  sinceLastWrite > this.maxAge;
  }

  isItemExpired(key: K): boolean {
    const item = this.map.get(key);

    if (!item) return false;

    const now = Date.now();
    const sinceLastUsage = now - item.lastUsage;
    const sinceLastWrite = now - item.createdAt;

    return sinceLastUsage > this.ttl ||  sinceLastWrite > this.maxAge;
  }

  clear() {
    this.map.clear();

    this.lastUsage = 0;
    this.lastWrite = 0;
    this.usages = [];
  }

  delete(key: K): boolean {
    const deleted = this.map.delete(key);

    if (deleted) this.updateUsages(key, 'delete');

    return deleted;
  }

  get(key: K): CacheItem<K, V> | undefined {
    if (this.has(key)) {
      const lastUsage = this.updateUsages(key, 'read');

      const nextItem: CacheItem<K, V> = {
        ...this.map.get(key)!,
        lastUsage,
      };

      this.map.set(key, nextItem);

      return nextItem;
    }
  }

  has(key: K): boolean {
    if (this.isAllExpired()) {
      this.clear();

      return false;
    }

    if (this.isItemExpired(key)) {
      this.delete(key);

      return false;
    }

    return this.map.has(key);
  }

  set(key: K, value: V): CacheItem<K, V> {
    const createdAt = this.updateUsages(key, 'write');

    const item: CacheItem<K, V> = {
      key,
      value,
      createdAt,
      lastUsage: createdAt,
      // TODO: Add a resolved: boolean property?
    };

    this.map.set(key, item);

    if (!this.keepPromises && isPromise(value)) {
      // TODO: Better handle types in this case:
      value.then((resolvedValue: any) => {
        this.map.set(key, { ...item, value: resolvedValue });
      });
    }

    this.resize();

    return item;
  }

  resize(slots?: number) {
    if (slots) this.slots = slots;

    const elementsToRemove = this.size - this.slots;

    if (elementsToRemove <= 0) return;

    const itemsToRemove = this.usages.slice(0, elementsToRemove);
    const itemsToKeep = this.usages.slice(elementsToRemove);

    itemsToRemove.forEach(key => this.map.delete(key));

    this.usages = itemsToKeep;
  }

  get size(): number {
    return this.map.size;
  }

  get [Symbol.iterator]() {
    return this.map[Symbol.iterator];
  }

  get [Symbol.toStringTag]() {
    return this.map[Symbol.toStringTag];
  }

  keys() {
    return this.map.keys();
  }

  values() {
    return this.map.values();
  }

  entries() {
    return this.map.entries();
  }

  clone() {
    // TODO: This should return a new CacheSet instance.
    // Keep in mind that the data itself is not cloned:
    return new Map(this.map);
  }

  forEach(callbackFn: (value: CacheItem<K, V>, key: K, map: Map<K, CacheItem<K, V>>) => void, thisArg?: any) {
    return this.map.forEach(callbackFn, thisArg);
  }  
}
