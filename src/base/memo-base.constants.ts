import { MemoizedCacheKeyFunction } from '../cache/memo-cache.utils';
import { MemoizedLastKeyFunction } from '../last/key/memo-last-key.utils';
import { MemoizedLastRefFunction } from '../last/ref/memo-last-ref.utils';

export type MemoizableFunction = (...args: any[]) => any;
export type MemoizedFunction<F extends MemoizableFunction = MemoizableFunction> = MemoizedCacheKeyFunction<F> | MemoizedLastKeyFunction<F> | MemoizedLastRefFunction<F>;
export type MemoizableFunctionResolver<F extends MemoizableFunction = MemoizableFunction> = (...args: Parameters<F>) => string | number;

export interface MemoBaseOptions<F extends MemoizableFunction = MemoizableFunction> {
  resolver?: MemoizableFunctionResolver<F>;
}

export const DEFAULT_RESOLVER: MemoizableFunctionResolver = (...args) => `[${ args.map(arg => `${ typeof arg === 'string' ? `'${ arg }'` : arg }`).join(', ') }]`;

export const ERROR_MESSAGE = 'Function was already memoized with a different memoization function';