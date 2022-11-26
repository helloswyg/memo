import { CacheItem, CacheKey, CacheSet, CacheSetOptions } from '../cache-set/cache-set';
import { ERROR_MESSAGE, MemoBaseOptions, MemoizableFunction, getResolver } from '../base/memo-base.constants';
import { isMemoCacheFunction, isMemoFunction } from '../base/memo-base.utils';

export interface MemoizedCacheKeyFunction<F extends MemoizableFunction = MemoizableFunction> {
  (...args: Parameters<F>): ReturnType<F>;
  refresh: (...args: Parameters<F>) => ReturnType<F>;
  skip: (...args: Parameters<F>) => ReturnType<F>;
  cache: CacheSet;
  lastCacheItem?: CacheItem<CacheKey, ReturnType<F>>;
}

type CacheOptions = CacheSetOptions | { cache: CacheSet };

function isGlobalCacheOptions(options: CacheOptions): options is { cache: CacheSet } {
  return options.hasOwnProperty('cache');
}

export type CacheMemoOptions<F extends MemoizableFunction = MemoizableFunction> = MemoBaseOptions<F> & CacheOptions;

export function memoCacheKey<F extends MemoizableFunction>(f: F, {
  resolver,
  hash,
  maxKeyLength,
  ...cacheOptions
}: CacheMemoOptions = { }): MemoizedCacheKeyFunction<F> {
  if (!f || isMemoCacheFunction(f)) return f;

  if (isMemoFunction(f)) throw new Error(ERROR_MESSAGE);

  // TODO: Add function name in case of shared cache or localStorage:
  const resolverFunction = getResolver({
    resolver,
    hash,
    maxKeyLength,
  });

  const memoized: MemoizedCacheKeyFunction<F> = (...args) => {
    const key = resolverFunction(...args);
    const cache = memoized.cache;
    const cacheItem = memoized.lastCacheItem = cache.has(key) ? cache.get(key)! : cache.set(key, f(...args));

    return cacheItem.value;
  };

  const refresh: (...args: Parameters<F>) => ReturnType<F> = (...args) => {
    const key = resolverFunction(...args);
    const cache = memoized.cache;
    const cacheItem = memoized.lastCacheItem = cache.set(key, f(...args));

    return cacheItem.value;
  };

  const skip: (...args: Parameters<F>) => ReturnType<F> = (...args) => {
    return f(...args);
  };

  memoized.cache = isGlobalCacheOptions(cacheOptions) ? cacheOptions.cache : new CacheSet([], cacheOptions);
  memoized.refresh = refresh;
  memoized.skip = skip;
  memoized.lastCacheItem = undefined;

  return memoized;
}
