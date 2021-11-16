import { CacheItem, CacheKey, CacheSet, CacheSetOptions } from '../cache-set/cache-set';
import { DEFAULT_RESOLVER, ERROR_MESSAGE, MemoBaseOptions, MemoizableFunction } from '../base/memo-base.constants';
import { isMemoCacheFunction, isMemoFunction } from '../base/memo-base.utils';

export interface MemoizedCacheKeyFunctionProps {
  cache: CacheSet;
}

export interface MemoizedCacheKeyFunction<F extends MemoizableFunction = MemoizableFunction> extends MemoizedCacheKeyFunctionProps {
  (...args: Parameters<F>): ReturnType<F>;
  skipCache: (...args: Parameters<F>) => ReturnType<F>;
  refresh: (...args: Parameters<F>) => ReturnType<F>;
  refreshCacheItem: (...args: Parameters<F>) => CacheItem<CacheKey, ReturnType<F>>;
  getCacheItem: (...args: Parameters<F>) => CacheItem<CacheKey, ReturnType<F>>;
}

export interface CacheMemoOptions<F extends MemoizableFunction = MemoizableFunction> extends MemoBaseOptions<F>, CacheSetOptions { }

export function memoCacheKey<F extends MemoizableFunction>(f: F, { resolver, ...cacheOptions }: CacheMemoOptions = { }): MemoizedCacheKeyFunction<F> {
  if (!f || isMemoCacheFunction(f)) return f;

  if (isMemoFunction(f)) throw new Error(ERROR_MESSAGE);

  const resolverFunction = resolver || DEFAULT_RESOLVER;

  const memoized: MemoizedCacheKeyFunction<F> = (...args) => {
    const key = resolverFunction(...args);
    const cache = memoized.cache;

    if (cache.has(key)) return cache.getValue(key);

    const result = f(...args);

    cache.setValue(key, result);

    return result;
  };

  const skipCache: (...args: Parameters<F>) => ReturnType<F> = (...args) => {
    return f(...args);
  };

  const refresh: (...args: Parameters<F>) => ReturnType<F> = (...args) => {
    const key = resolverFunction(...args);
    const cache = memoized.cache;
    const result = f(...args);

    cache.setValue(key, result);

    return result;
  };

  const refreshCacheItem: (...args: Parameters<F>) => CacheItem<CacheKey, ReturnType<F>> = (...args) => {
    const key = resolverFunction(...args);
    const cache = memoized.cache;
    const result = f(...args);

    cache.setValue(key, result);

    return cache.get(key)!;
  };

  const getCacheItem: (...args: Parameters<F>) => CacheItem<CacheKey, ReturnType<F>> = (...args) => {
    const key = resolverFunction(...args);
    const cache = memoized.cache;

    if (cache.has(key)) return cache.get(key)!;

    const result = f(...args);

    cache.setValue(key, result);

    return cache.get(key)!;
  };

  memoized.cache = new CacheSet([], cacheOptions);
  memoized.skipCache = skipCache;
  memoized.refresh = refresh;
  memoized.refreshCacheItem = refreshCacheItem;
  memoized.getCacheItem = getCacheItem;

  return memoized;
}
