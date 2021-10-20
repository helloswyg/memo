import { ERROR_MESSAGE } from '../base/memo-base.constants';
import { CacheSet } from '../cache-set/cache-set';
import { memoLastRef } from '../last/ref/memo-last-ref.utils';
import { memoCacheKey, MemoizedCacheKeyFunction } from './memo-cache.utils';

describe('memo-last.utils.ts', () => {
  let f1: (...args: any[]) => string;
  let m1: MemoizedCacheKeyFunction;

  let f2: (arg: any) => any;
  let m2: MemoizedCacheKeyFunction;

  let f3: (arg: any) => Promise<any>;
  let m3: MemoizedCacheKeyFunction;

  let f4: (arg: any) => Promise<any>;
  let m4: MemoizedCacheKeyFunction;

  beforeAll(() => {
    f1 = (...args: any[]) => args.join('.');
    m1 = memoCacheKey(f1);

    f2 = (arg: number) => ({ value: arg });
    m2 = memoCacheKey(f2, { ttl: 1, slots: 2 });

    f3 = (arg: number) => Promise.resolve(arg);
    m3 = memoCacheKey(f3, { ttl: 1, slots: 2 });

    f4 = (arg: number) => Promise.resolve(arg);
    m4 = memoCacheKey(f4, { ttl: 1, slots: 2, keepPromises: true });

    expect(m1).toBeFunction();
    expect(m2).toBeFunction();
    expect(m3).toBeFunction();
    expect(m4).toBeFunction();
  });

  it('memoCacheKey() is idempotent', () => {
    expect(m1).toBe(memoCacheKey(m1));
    expect(m1).toBe(memoCacheKey(memoCacheKey(m1)));
  });

  describe('memoCacheKey() returns a function', () => {
    it('with the same behavior as the original one', () => {
      expect(m1(1, 2, 'foo')).toBe(f1(1, 2, 'foo'));
      expect(m2(2)).toStrictEqual(f2(2));
      expect(m3(3)).toStrictEqual(f3(3));
      expect(m4(4)).toStrictEqual(f4(4));
    });

    it('with a cache property in it properly initialized', () => {
      expect(m2.cache).toBeDefined();
      expect(m2.cache).toBeInstanceOf(CacheSet);
      expect(m2.cache.ttl).toBe(1000);
      expect(m2.cache.slots).toBe(2);
    });

    it('that doesn\'t recompute values that are in the cache', () => {
      const memoizedReturnedObject = m2('foo');

      expect(memoizedReturnedObject).toMatchObject({ value: 'foo' });
      expect(m2('foo')).toBe(memoizedReturnedObject);
    });

    it('that updates the cache when a Promise resolves by default', (done) => {
      const memoizedReturnedPromise = m3('foo');

      expect(memoizedReturnedPromise).toBeInstanceOf(Promise);

      process.nextTick(() => {
        expect(m3('foo')).toBe('foo');
        expect(m3('foo')).not.toBeInstanceOf(Promise);

        done();
      });
    });

    it('that does not update the cache when a Promise resolves if options.keepPromises === true', (done) => {
      const memoizedReturnedPromise = m4('foo');

      expect(memoizedReturnedPromise).toBeInstanceOf(Promise);

      process.nextTick(() => {
        expect(m4('foo')).toBe(memoizedReturnedPromise);
        expect(m4('foo')).toBeInstanceOf(Promise);

        done();
      });
    });

    it('throws an error if we try to memoize an already memoized function (with a different memoization function)', () => {
      const t = () => {
        memoCacheKey(memoLastRef(() => 'foo'));
      };

      expect(t).toThrow(Error);
      expect(t).toThrow(ERROR_MESSAGE);
    });

  });
});
