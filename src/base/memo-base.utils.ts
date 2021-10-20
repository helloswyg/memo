import { CacheSet } from '../cache-set/cache-set';
import { MemoizedCacheKeyFunction } from '../cache/memo-cache.utils';
import { MemoizedLastKeyFunction } from '../last/key/memo-last-key.utils';
import { MemoizedLastRefFunction } from '../last/ref/memo-last-ref.utils';
import { MemoizableFunction, MemoizedFunction } from './memo-base.constants';

export function isMemoLastRefFunction<F extends MemoizableFunction = MemoizableFunction>(f: F | MemoizedFunction<F>): f is MemoizedLastRefFunction<F> {
  return typeof f === 'function' && Array.isArray((f as MemoizedLastRefFunction).lastArgs);
}

export function isMemoLastKeyFunction<F extends MemoizableFunction = MemoizableFunction>(f: F | MemoizedFunction<F>): f is MemoizedLastKeyFunction<F> {
  return typeof f === 'function' && f.hasOwnProperty('lastKey');
}

export function isMemoCacheFunction<F extends MemoizableFunction = MemoizableFunction>(f: F | MemoizedFunction<F>): f is MemoizedCacheKeyFunction<F> {
  return typeof f === 'function' && (f as MemoizedCacheKeyFunction).cache instanceof CacheSet;
}

export function isMemoFunction<F extends MemoizableFunction = MemoizableFunction>(f: F | MemoizedFunction<F>): f is MemoizedFunction<F> {
  return isMemoLastRefFunction(f) || isMemoLastKeyFunction(f) || isMemoCacheFunction(f);
}

