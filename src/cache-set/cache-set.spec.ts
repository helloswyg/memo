import { CacheSet } from './cache-set';

describe('CacheSet', () => {
  let defaultOptionsSet: CacheSet;
  let iterableSet: CacheSet;
  let optionsSet: CacheSet;
  let promisesSet: CacheSet;

  beforeAll(() => {
    defaultOptionsSet = new CacheSet();
    iterableSet = new CacheSet<number, string>([[1, 'one'], [2, 'two']]);
    optionsSet = new CacheSet({ ttl: 1, slots: 2 });
    promisesSet = new CacheSet({ ttl: 1, slots: 2, keepPromises: true });
  });

  it('sets the default options properly', () => {
    expect(defaultOptionsSet.ttl).toEqual(Infinity);
    expect(defaultOptionsSet.slots).toEqual(64);
    expect(defaultOptionsSet.keepPromises).toEqual(false);
  });

  it('can be initialized with an Iterator', () => {
    expect(iterableSet.size).toEqual(2);
    expect(iterableSet.usages.length).toEqual(2);
    expect(iterableSet.dates.size).toEqual(2);
    expect(iterableSet.get(1)).toEqual('one');
    expect(iterableSet.get(2)).toEqual('two');
  });

  it('accepts custom options', () => {
    expect(optionsSet.ttl).toEqual(1000);
    expect(optionsSet.slots).toEqual(2);

    expect(promisesSet.ttl).toEqual(1000);
    expect(promisesSet.slots).toEqual(2);
    expect(promisesSet.keepPromises).toEqual(true);
  });

  it('removes older elements as we add new ones', () => {
    optionsSet.set(3, 'three');
    expect(optionsSet.size).toEqual(1);
    expect(optionsSet.usages.length).toEqual(1);
    expect(optionsSet.dates.size).toEqual(1);

    optionsSet.set(4, 'four');
    expect(optionsSet.size).toEqual(2);
    expect(optionsSet.usages.length).toEqual(2);
    expect(optionsSet.dates.size).toEqual(2);

    optionsSet.set(5, 'five');
    expect(optionsSet.size).toEqual(2);
    expect(optionsSet.usages.length).toEqual(2);
    expect(optionsSet.dates.size).toEqual(2);

    expect(optionsSet.get(3)).toBeUndefined();
    expect(optionsSet.get(4)).toEqual('four');
    expect(optionsSet.get(5)).toEqual('five');
  });

  it('deletes elements and their custom data', () => {
    expect(optionsSet.delete(4)).toBeTrue();
    expect(optionsSet.delete(1)).toBeFalse();

    expect(optionsSet.size).toEqual(1);
    expect(optionsSet.usages.length).toEqual(1);
    expect(optionsSet.dates.size).toEqual(1);
  });

  it('clears all default and custom data', () => {
    optionsSet.clear();

    expect(optionsSet.size).toEqual(0);
    expect(optionsSet.usages.length).toEqual(0);
    expect(optionsSet.dates.size).toEqual(0);
    expect(optionsSet.lastUsage).toEqual(0);
  });

  it('updates the recently used elements when we get them', () => {
    optionsSet.set(3, 'three');
    expect(optionsSet.size).toEqual(1);
    expect(optionsSet.usages.length).toEqual(1);
    expect(optionsSet.dates.size).toEqual(1);

    optionsSet.set(4, 'four');
    expect(optionsSet.size).toEqual(2);
    expect(optionsSet.usages.length).toEqual(2);
    expect(optionsSet.dates.size).toEqual(2);

    const previousTimestamp = optionsSet.dates.get(3);

    optionsSet.get(3);
    expect(previousTimestamp).not.toEqual(optionsSet.dates.get(3));

    optionsSet.set(5, 'five');
    expect(optionsSet.size).toEqual(2);
    expect(optionsSet.usages.length).toEqual(2);
    expect(optionsSet.dates.size).toEqual(2);

    expect(optionsSet.get(3)).toEqual('three');
    expect(optionsSet.get(4)).toBeUndefined();
    expect(optionsSet.get(5)).toEqual('five');

    const previousTimestamp2 = optionsSet.dates.get(3);

    optionsSet.set(3, '3');
    expect(optionsSet.size).toEqual(2);
    expect(optionsSet.usages.length).toEqual(2);
    expect(optionsSet.dates.size).toEqual(2);
    expect(previousTimestamp2).not.toEqual(optionsSet.dates.get(3));

    optionsSet.set(4, '4');
    expect(optionsSet.size).toEqual(2);
    expect(optionsSet.usages.length).toEqual(2);
    expect(optionsSet.dates.size).toEqual(2);

    expect(optionsSet.get(3)).toEqual('3');
    expect(optionsSet.get(4)).toEqual('4');
    expect(optionsSet.get(5)).toBeUndefined();
  });

  it('checks if an element exists and it has not expired and removes it if it has', () => {
    optionsSet.clear();

    optionsSet.set(3, 'three');
    optionsSet.set(4, 'four');
    expect(optionsSet.size).toEqual(2);
    expect(optionsSet.usages.length).toEqual(2);
    expect(optionsSet.dates.size).toEqual(2);
    expect(optionsSet.lastUsage).not.toEqual(0);

    optionsSet.dates.set(3, 1);

    expect(optionsSet.has(3)).toEqual(false);
    expect(optionsSet.has(4)).toEqual(true);

    expect(optionsSet.size).toEqual(1);
    expect(optionsSet.usages.length).toEqual(1);
    expect(optionsSet.dates.size).toEqual(1);
    expect(optionsSet.lastUsage).not.toEqual(0);
  });

  it('remove all the elements if all of them expire', () => {
    optionsSet.clear();

    optionsSet.set(3, 'three');
    optionsSet.set(4, 'four');
    expect(optionsSet.size).toEqual(2);
    expect(optionsSet.usages.length).toEqual(2);
    expect(optionsSet.dates.size).toEqual(2);
    expect(optionsSet.lastUsage).not.toEqual(0);

    optionsSet.lastUsage = 1;

    expect(optionsSet.has(3)).toEqual(false);
    expect(optionsSet.has(4)).toEqual(false);

    expect(optionsSet.size).toEqual(0);
    expect(optionsSet.usages.length).toEqual(0);
    expect(optionsSet.dates.size).toEqual(0);
    expect(optionsSet.lastUsage).toEqual(0);
  });

  it('resolves Promises automatically', (done) => {
    optionsSet.set('PROMISE', Promise.resolve(42));
    expect(optionsSet.size).toEqual(1);
    expect(optionsSet.usages.length).toEqual(1);
    expect(optionsSet.dates.size).toEqual(1);
    expect(optionsSet.get('PROMISE')).toBeInstanceOf(Promise);

    process.nextTick(() => {
      expect(optionsSet.get('PROMISE')).toEqual(42);
      expect(optionsSet.get('PROMISE')).not.toBeInstanceOf(Promise);

      done();
    });
  });

  it('keeps Promises if keepPromises === true', (done) => {
    const aPromise = Promise.resolve(42);

    promisesSet.set('PROMISE', aPromise);

    expect(promisesSet.size).toEqual(1);
    expect(promisesSet.usages.length).toEqual(1);
    expect(promisesSet.dates.size).toEqual(1);
    expect(promisesSet.get('PROMISE')).toBeInstanceOf(Promise);

    process.nextTick(() => {
      expect(promisesSet.get('PROMISE')).toEqual(aPromise);
      expect(promisesSet.get('PROMISE')).toBeInstanceOf(Promise);

      done();
    });
  });

  it('can be resized', () => {
    optionsSet.set(1, 'one');
    optionsSet.set(2, 'two');

    expect(optionsSet.size).toEqual(2);
    expect(optionsSet.usages.length).toEqual(2);
    expect(optionsSet.dates.size).toEqual(2);
    expect(optionsSet.lastUsage).not.toEqual(0);

    optionsSet.resize(4);

    optionsSet.set(3, 'three');
    optionsSet.set(4, 'four');

    expect(optionsSet.size).toEqual(4);
    expect(optionsSet.usages.length).toEqual(4);
    expect(optionsSet.dates.size).toEqual(4);
    expect(optionsSet.lastUsage).not.toEqual(0);

    optionsSet.resize(2);

    expect(optionsSet.get(1)).toBeUndefined();
    expect(optionsSet.get(2)).toBeUndefined();
    expect(optionsSet.get(3)).toEqual('three');
    expect(optionsSet.get(4)).toEqual('four');
  });

});
