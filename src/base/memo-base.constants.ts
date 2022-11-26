import { CacheKey } from '../cache-set/cache-set';
import { MemoizedCacheKeyFunction } from '../cache/memo-cache.utils';
import { MemoizedLastKeyFunction } from '../last/key/memo-last-key.utils';
import { MemoizedLastRefFunction } from '../last/ref/memo-last-ref.utils';

export type MemoizableFunction = (...args: any[]) => any;
export type MemoizedFunction<F extends MemoizableFunction = MemoizableFunction> = MemoizedCacheKeyFunction<F> | MemoizedLastKeyFunction<F> | MemoizedLastRefFunction<F>;

export type MemoizableFunctionResolverType = 'JOIN' | 'PRIMITIVES' | 'JSON' | 'JSON_EXTENDED';
export type MemoizableFunctionResolverFunction<F extends MemoizableFunction = MemoizableFunction> = (...args: Parameters<F>) => CacheKey;

export type MemoizableFunctionResolver<F extends MemoizableFunction = MemoizableFunction> = MemoizableFunctionResolverType | MemoizableFunctionResolverFunction<F>;

export interface MemoBaseOptions<F extends MemoizableFunction = MemoizableFunction> {
  resolver?: MemoizableFunctionResolver;
  hash?: (key: CacheKey) => CacheKey;
  maxKeyLength?: number;
}

export const RESOLVER_JOIN: MemoizableFunctionResolverFunction = (...args) => {
  return `[${ args.join(',') }]`;
};

export const RESOLVER_PRIMITIVES: MemoizableFunctionResolverFunction = (...args) => {
  return `[${ args.map((arg) => {
    if (arg.hasOwnProperty(Symbol.toStringTag)) {
      const name = arg[Symbol.toStringTag] || 'Object';
      const size = arg.hasOwnProperty('size') ? arg.size : undefined;

      return size ? `${ name }(${ size })` : `${ name }()`;
    }

    if (Array.isArray(arg)) return `Array(${ arg.length })`;

    if (typeof arg === 'object') return `Object(${ Object.keys(arg).length })`;

    if (arg === undefined) return 'undefined';

    if (arg === null) return 'null';

    return `${ typeof arg === 'string' ? `'${ arg }'` : arg }`;
  }).join(',') }]`;
};

export const RESOLVER_JSON: MemoizableFunctionResolverFunction = (...args) => {
  return JSON.stringify(args);
};

export const RESOLVER_JSON_EXTENDED: MemoizableFunctionResolverFunction = (...args) => {
  return JSON.stringify(args, (key, value) => {
      if (isNaN(value)) return 'NaN';
      if (value === undefined) return 'undefined';
      if (value === Infinity) return 'Infinity';
      if (value === -Infinity) return '-Infinity';

      // Map, Set, etc. Object.fromEntries(entries);

      return value;
  });
};

const RESOLVERS: Record<MemoizableFunctionResolverType, MemoizableFunctionResolverFunction> = {
  JOIN: RESOLVER_JOIN,
  PRIMITIVES: RESOLVER_PRIMITIVES,
  JSON: RESOLVER_JSON,
  JSON_EXTENDED: RESOLVER_JSON_EXTENDED,
};

export function getResolver({
  resolver,
  hash,
  maxKeyLength,
}: MemoBaseOptions): MemoizableFunctionResolverFunction {
  return (typeof resolver === 'string' ? RESOLVERS[resolver] : resolver) || RESOLVER_JSON_EXTENDED;
}

export const ERROR_MESSAGE = 'Function was already memoized with a different memoization function';