import { memoCacheKey } from '../../cache/memo-cache.utils';
import { ERROR_MESSAGE } from '../../base/memo-base.constants';
import { MemoizedLastKeyFunction, memoLastKey } from './memo-last-key.utils';

describe('memo-last.utils.ts', () => {
  let f1: (...args: any[]) => string;
  let m1: MemoizedLastKeyFunction;

  let f2: (arg1: string, arg2: string) => any;
  let m2: MemoizedLastKeyFunction;

  beforeAll(() => {
    f1 = (...args: any[]) => args.join('.');
    m1 = memoLastKey(f1);

    f2 = (arg1: string, arg2: string) => ({ arg1, arg2 });
    m2 = memoLastKey(f2, { resolver: (arg1, arg2) => `${ arg1 }-${ arg2 }` });

    expect(m1).toBeFunction();
    expect(m2).toBeFunction();
  });

  it('memoLastKey() is idempotent', () => {
    expect(m1).toBe(memoLastKey(m1));
    expect(m1).toBe(memoLastKey(memoLastKey(m1)));
  });

  describe('memoLastKey() returns a function', () => {
    it('with an undefined lastKey property in it', () => {
      expect(m2.hasOwnProperty('lastKey')).toBeTrue();
      expect(m2.lastKey).toBeUndefined();
    });

    it('with the same behavior as the original one', () => {
      expect(m1(1, 2, 'foo')).toBe(f1(1, 2, 'foo'));
      expect(m2('foo', 'bar')).toStrictEqual(f2('foo', 'bar'));
    });

    it('with proper logic to update lastKey', () => {
      expect(m1.lastKey).toBe('[1, 2, \'foo\']');
      expect(m2.lastKey).toBe('foo-bar');
    });

    it('that doesn\'t recompute the last cached value', () => {
      const memoizedReturnedObject1 = m2('foo', 'bar');

      expect(m2('foo', 'bar')).toBe(memoizedReturnedObject1);

      const memoizedReturnedObject2 = m2('bar', 'foo');

      expect(m2('bar', 'foo')).toBe(memoizedReturnedObject2);
      expect(m2.lastKey).toBe('bar-foo');

      expect(m2('foo', 'bar')).not.toBe(memoizedReturnedObject1);
      expect(m2.lastKey).toBe('foo-bar');

      expect(m2('bar', 'foo')).not.toBe(memoizedReturnedObject2);
      expect(m2.lastKey).toBe('bar-foo');
    });

    it('throws an error if we try to memoize an already memoized function (with a different memoization function)', () => {
      const t = () => {
        memoLastKey(memoCacheKey(() => 'foo'));
      };

      expect(t).toThrow(Error);
      expect(t).toThrow(ERROR_MESSAGE);
    });

  });
});
