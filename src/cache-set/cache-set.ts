import isPromise from 'is-promise';

export interface CacheSetOptions {
  ttl?: number;
  slots?: number;
  keepPromises?: boolean;
}

export class CacheSet<K extends string | number = string | number, V = any> extends Map<K, V> {
  slots = 8;
  ttl = Infinity;
  keepPromises = false;
  lastUsage = 0;
  dates = new Map<K, number>();
  usages: K[] = [];

  constructor(iterableOrObject?: Iterable<[K, V]> | CacheSetOptions, options?: CacheSetOptions) {
    super();

    const iterable = Array.isArray(iterableOrObject) ? iterableOrObject : null;
    const actualOptions: CacheSetOptions = options || (typeof iterableOrObject === 'object' ? iterableOrObject : { }) as CacheSetOptions;

    this.slots = actualOptions.slots || this.slots;
    this.ttl = (actualOptions.ttl || this.ttl) * 1000;
    this.keepPromises = actualOptions.keepPromises || this.keepPromises;

    if (iterable) {
      iterable.forEach(([k, v]) => this.set(k, v));
    }
  }

  clear() {
    super.clear();

    this.lastUsage = 0;
    this.dates.clear();
    this.usages = [];
  }

  delete(key: K): boolean {
    const deleted = super.delete(key);

    if (deleted) {
      this.dates.delete(key);

      const index = this.usages.indexOf(key);

      if (index !== -1) {
        this.usages.splice(index, 1);
      }
    }

    return deleted;
  }

  get(key: K): V | undefined {
    if (this.has(key)) {
      this.dates.set(key, this.lastUsage = Date.now());
      this.usages.splice(this.usages.indexOf(key), 1);
      this.usages.push(key);

      return super.get(key);
    }
  }

  has(key: K): boolean {
    const now = Date.now();

    if (this.size && now - this.lastUsage > this.ttl) {
      this.clear();

      return false;
    }

    const found = super.has(key);

    if (!found) return false; // Not found.

    if (now - this.dates.get(key)! > this.ttl) {
      this.delete(key);

      return false; // Expired.

    }

    return true;
  }

  set(key: K, value: V) {
    super.set(key, value);

    if (!this.keepPromises && isPromise(value)) {
      value.then((data: any) => {
        super.set(key, data);
      });
    }

    if (this.size > this.slots) {
      this.delete(this.usages.shift()!);
    }

    this.dates.set(key, this.lastUsage = Date.now());

    const index = this.usages.indexOf(key);

    if (index !== -1) {
      this.usages.splice(index, 1);
    }

    this.usages.push(key);

    return this;
  }

  resize(slots: number) {
    this.slots = slots;

    while (this.size > slots) {
      this.delete(this.usages[0]);
    }
  }
}
