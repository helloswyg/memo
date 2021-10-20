import { CacheSet, CacheSetOptions } from '../cache-set/cache-set';
import { DEFAULT_RESOLVER, ERROR_MESSAGE, MemoBaseOptions, MemoizableFunction } from '../base/memo-base.constants';
import { isMemoCacheFunction, isMemoFunction } from '../base/memo-base.utils';

export interface MemoizedCacheKeyFunctionProps {
  cache: CacheSet;
}

export interface MemoizedCacheKeyFunction<F extends MemoizableFunction = MemoizableFunction> extends MemoizedCacheKeyFunctionProps {
  (...args: Parameters<F>): ReturnType<F>;
}

export interface CacheMemoOptions<F extends MemoizableFunction = MemoizableFunction> extends MemoBaseOptions<F>, CacheSetOptions { }

export function memoCacheKey<F extends MemoizableFunction>(f: F, { resolver, ...cacheOptions }: CacheMemoOptions = { }): MemoizedCacheKeyFunction<F> {
  if (!f || isMemoCacheFunction(f)) return f;

  if (isMemoFunction(f)) throw new Error(ERROR_MESSAGE);

  const resolverFunction = resolver || DEFAULT_RESOLVER;

  const memoized: MemoizedCacheKeyFunction<F> = (...args) => {
    const key = resolverFunction(...args);
    const cache = memoized.cache;

    if (cache.has(key)) return cache.get(key);

    const result = f(...args);

    cache.set(key, result);

    return result;
  };

  memoized.cache = new CacheSet([], cacheOptions);

  return memoized;
}
