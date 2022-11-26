import { MemoBaseOptions, MemoizableFunction, ERROR_MESSAGE, getResolver } from '../../base/memo-base.constants';
import { isMemoFunction, isMemoLastKeyFunction } from '../../base/memo-base.utils';
import { CacheKey } from '../../cache-set/cache-set';

export interface MemoizedLastKeyFunctionProps {
  lastKey?: CacheKey;
  lastValue?: any;
}

export interface MemoizedLastKeyFunction<F extends MemoizableFunction = MemoizableFunction> extends MemoizedLastKeyFunctionProps {
  (...args: Parameters<F>): ReturnType<F>;
}

export function memoLastKey<F extends MemoizableFunction>(f: F, options: MemoBaseOptions<F> = { }): MemoizedLastKeyFunction<F> {
  if (!f || isMemoLastKeyFunction(f)) return f;

  if (isMemoFunction(f)) throw new Error(ERROR_MESSAGE);

  const resolverFunction = getResolver(options);

  const memoized: MemoizedLastKeyFunction<F> = (...args) => {
    const key = resolverFunction(...args);
    const { lastKey, lastValue } = memoized;

    if (lastKey === key) return lastValue;

    memoized.lastKey = key;

    return memoized.lastValue = f(...args);
  };

  memoized.lastKey = undefined;

  return memoized;
}
