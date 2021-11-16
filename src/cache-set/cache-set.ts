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

export class CacheSet<K extends CacheKey = CacheKey, V = any> extends Map<K, CacheItem<K, V>> {

  // Options:
  slots = 8;
  ttl = Infinity;
  maxAge = Infinity;
  keepPromises = true;

  // Keep track of usages:
  lastUsage = 0;
  lastWrite = 0;
  usages: K[] = [];

  constructor(iterableOrObject?: Iterable<[K, V]> | CacheSetOptions, options?: CacheSetOptions) {
    super();

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
    const item = super.get(key);

    if (!item) return false;

    const now = Date.now();
    const sinceLastUsage = now - item.lastUsage;
    const sinceLastWrite = now - item.createdAt;

    return sinceLastUsage > this.ttl ||  sinceLastWrite > this.maxAge;
  }

  clear() {
    super.clear();

    this.lastUsage = 0;
    this.lastWrite = 0;
    this.usages = [];
  }

  delete(key: K): boolean {
    const deleted = super.delete(key);

    if (deleted) this.updateUsages(key, 'delete');

    return deleted;
  }

  get(key: K): CacheItem<K, V> | undefined {
    if (this.has(key)) {
      const lastUsage = this.updateUsages(key, 'read');

      const nextItem: CacheItem<K, V> = {
        ...super.get(key)!,
        lastUsage,
      };

      super.set(key, nextItem);

      return nextItem;
    }
  }

  getValue(key: K): V | undefined {
    return this.get(key)?.value;
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

    return super.has(key);
  }

  // set(key: K, value: V): this {

  setValue(key: K, value: V): this {
    const createdAt = this.updateUsages(key, 'write');

    const item: CacheItem<K, V> = {
      key,
      value,
      createdAt,
      lastUsage: createdAt,
      // TODO: Add a resolved: boolean property?
    };

    super.set(key, item);

    if (!this.keepPromises && isPromise(value)) {
      // TODO: Better handle types in this case:
      value.then((resolvedValue: any) => {
        super.set(key, { ...item, value: resolvedValue });
      });
    }

    this.resize();

    return this;
  }

  resize(slots?: number) {
    if (slots) this.slots = slots;

    const elementsToRemove = this.size - this.slots;

    if (elementsToRemove <= 0) return;

    const itemsToRemove = this.usages.slice(0, elementsToRemove);
    const itemsToKeep = this.usages.slice(elementsToRemove);

    itemsToRemove.forEach(key => super.delete(key));

    this.usages = itemsToKeep;
  }

  /*
  entries() {
    return super.entries();
  }

  forEach(callbackFn: any) {
    return super.forEach(callbackFn);
  }
  */
  
}
