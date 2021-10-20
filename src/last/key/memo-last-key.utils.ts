import { MemoBaseOptions, DEFAULT_RESOLVER, MemoizableFunction, ERROR_MESSAGE } from '../../base/memo-base.constants';
import { isMemoFunction, isMemoLastKeyFunction } from '../../base/memo-base.utils';

export interface MemoizedLastKeyFunctionProps {
  lastKey?: string | number;
  lastValue?: any;
}

export interface MemoizedLastKeyFunction<F extends MemoizableFunction = MemoizableFunction> extends MemoizedLastKeyFunctionProps {
  (...args: Parameters<F>): ReturnType<F>;
}

export function memoLastKey<F extends MemoizableFunction>(f: F, { resolver }: MemoBaseOptions<F> = { }): MemoizedLastKeyFunction<F> {
  if (!f || isMemoLastKeyFunction(f)) return f;

  if (isMemoFunction(f)) throw new Error(ERROR_MESSAGE);

  const resolverFunction = resolver || DEFAULT_RESOLVER;

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
