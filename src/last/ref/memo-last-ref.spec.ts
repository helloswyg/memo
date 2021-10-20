import { ERROR_MESSAGE } from '../../base/memo-base.constants';
import { memoCacheKey } from '../../cache/memo-cache.utils';
import { MemoizedLastRefFunction, memoLastRef } from './memo-last-ref.utils';

describe('memo-last.utils.ts', () => {
  let f1: (...args: any[]) => string;
  let m1: MemoizedLastRefFunction;

  let f2: (arg1: string, arg2: string) => any;
  let m2: MemoizedLastRefFunction;

  beforeAll(() => {
    f1 = (...args: any[]) => args.join('.');
    m1 = memoLastRef(f1);

    f2 = (arg1: string, arg2: string) => ({ arg1, arg2 });
    m2 = memoLastRef(f2);

    expect(m1).toBeFunction();
    expect(m2).toBeFunction();
  });

  it('memoLastRef() is idempotent', () => {
    expect(m1).toBe(memoLastRef(m1));
    expect(m1).toBe(memoLastRef(memoLastRef(m1)));
  });

  describe('memoLastRef() returns a function', () => {
    it('with a lastArgs === [] property in it', () => {
      expect(m2.hasOwnProperty('lastArgs')).toBeTrue();
      expect(m2.lastArgs).toBeArrayOfSize(0);
    });

    it('with the same behavior as the original one', () => {
      expect(m1(1, 2, 'foo')).toBe(f1(1, 2, 'foo'));
      expect(m2('foo', 'bar')).toStrictEqual(f2('foo', 'bar'));
    });

    it('with proper logic to update lastArgs', () => {
      expect(m1.lastArgs).toBeArrayOfSize(3);
      expect(m2.lastArgs).toBeArrayOfSize(2);

      expect(m1.lastArgs).toMatchObject([1, 2, 'foo']);
      expect(m2.lastArgs).toMatchObject(['foo', 'bar']);
    });

    it('that doesn\'t recompute the last cached value', () => {
      const memoizedReturnedObject1 = m2('foo', 'bar');

      expect(m2('foo', 'bar')).toBe(memoizedReturnedObject1);

      const memoizedReturnedObject2 = m2('bar', 'foo');

      expect(m2('bar', 'foo')).toBe(memoizedReturnedObject2);
      expect(m2.lastArgs).toMatchObject(['bar', 'foo']);

      expect(m2('foo', 'bar')).not.toBe(memoizedReturnedObject1);
      expect(m2.lastArgs).toMatchObject(['foo', 'bar']);

      expect(m2('bar', 'foo')).not.toBe(memoizedReturnedObject2);
      expect(m2.lastArgs).toMatchObject(['bar', 'foo']);
    });

    it('that doesn\'t recompute the last cached value with object params', () => {
      const obj1 = { foo: 'foo', bar: 'bar' };
      const obj2 = { foo: '123', bar: '456' };

      const memoizedReturnedObject1 = m2(obj1, obj2);

      expect(m2(obj1, obj2)).toBe(memoizedReturnedObject1);

      const memoizedReturnedObject2 = m2(obj2, obj1);

      expect(m2(obj2, obj1)).toBe(memoizedReturnedObject2);
      expect(m2.lastArgs).toMatchObject([obj2, obj1]);

      expect(m2(obj1, obj2)).not.toBe(memoizedReturnedObject1);
      expect(m2.lastArgs).toMatchObject([obj1, obj2]);

      expect(m2(obj2, obj1)).not.toBe(memoizedReturnedObject2);
      expect(m2.lastArgs).toMatchObject([obj2, obj1]);
    });

    it('throws an error if we try to memoize an already memoized function (with a different memoization function)', () => {
      const t = () => {
        memoLastRef(memoCacheKey(() => 'foo'));
      };

      expect(t).toThrow(Error);
      expect(t).toThrow(ERROR_MESSAGE);
    });

  });
});
