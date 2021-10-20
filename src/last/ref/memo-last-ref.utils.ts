import { ERROR_MESSAGE, MemoizableFunction } from '../../base/memo-base.constants';
import { isMemoFunction, isMemoLastRefFunction } from '../../base/memo-base.utils';

export interface MemoizedLastRefFunctionProps {
  lastArgs: any[];
  lastValue?: any;
}

export interface MemoizedLastRefFunction<F extends MemoizableFunction = MemoizableFunction> extends MemoizedLastRefFunctionProps {
  (...args: Parameters<F>): ReturnType<F>;
}

export function memoLastRef<F extends MemoizableFunction>(f: F): MemoizedLastRefFunction<F> {
  if (!f || isMemoLastRefFunction(f)) return f;

  if (isMemoFunction(f)) throw new Error(ERROR_MESSAGE);

  const memoized: MemoizedLastRefFunction<F> = (...args) => {
    const { lastArgs, lastValue } = memoized;

    if (args.length === lastArgs.length && args.every((arg, i) => arg === lastArgs[i])) return lastValue;

    memoized.lastArgs = args;

    return memoized.lastValue = f(...args);
  };

  memoized.lastArgs = [];

  return memoized;
}
