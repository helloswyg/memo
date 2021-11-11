memo
====

💾 Memoize a function **the way you want**.

⚡ Keep your JS/TS/React code running lightning fast and smooth!

🌍 Avoid wasting precious computation and worsen global warming.

⚠️ Not to be confused with the Spanish word "memo": https://m.interglot.com/es/en/Memo

<br>


Installation
------------

    npm install @swyg/memo

    yarn install @swyg/memo

<br>


React's `useMemo` vs. `@swyg/memo`
----------------------------------

With `@swyg/memo` you'll be able to enjoy a **less verbose syntax** and get **more control** over your memoization strategy.

For example, your component might re-render often and always call the same function with only a few combinations of params (e.g. filter or sort functionality). In that case, you could use `memoCacheKey(...)`.

**With React's `useMemo`:**

    const memoFunction = memoRef(myFunction);

    const ReactComponent = ({ a, b, c }) => {
        const myResult = useMemo(() => myFunction(a, b, c), [a, b, c]);

        ...
    }

**With `@swyg/memo`:**

    const memoFunction = memoCacheKey(myFunction); // or memoLastKey or memoLastRef

    const ReactComponent = ({ a, b, c }) => {
        const myResult = memoFunction(a, b, c);

        ...
    }

However, keep in mind abusing memoization, especially when using `memoCacheKey`, can also have detrimental effects in your app's performance, as memory usage will increase.

Also, it's worth pointing out React's `useMemo` might eventually manage memory usage differently, as [stated in the docs](https://reactjs.org/docs/hooks-reference.html#usememo):

> **You may rely on `useMemo` as a performance optimization, not as a semantic guarantee.** In the future, React may choose to “forget” some previously memoized values and recalculate them on next render, e.g. to free memory for offscreen components. Write your code so that it still works without `useMemo` — and then add it to optimize performance.

<br>


Usage
-----

**Functions:**

- [`memoLastKey(func[, { resolver }]): MemoizedLastKeyFunction`](https://github.com/helloswyg/memo#memolastkeyfunc--resolver--memoizedlastkeyfunction)
- [`memoLastRef(func): MemoizedLastRefFunction`](https://github.com/helloswyg/memo#memolastreffunc-memoizedlastreffunction)
- [`memoCacheKey(func[, { resolver }]): MemoizedCacheFunction`](https://github.com/helloswyg/memo#memocachekeyfunc--resolver--memoizedcachefunction)

**Classes:**

- [`CacheSet(iterableOrObject?: Iterable<[K, V]> | CacheSetOptions, options?: CacheSetOptions)`](https://github.com/helloswyg/memo#cachesetiterableorobject-iterablek-v--cachesetoptions-options-cachesetoptions)


### `memoLastKey(func[, { resolver }]): MemoizedLastKeyFunction`

Memoizes the result from the last call of the function `func` using the serialized arguments as the string key:

`examples/last/key/basic.ts`

    const func = (value1: any, value2?: any) => {
        console.log('run');

        return { value1, value2 };
    };

    const memoFunc = memoLastKey(func);

    const objA = { value: 'a' };
    const objB = { value: 'b' };
    const objC = { value: 'c' };

    const a = func('foo'); // run
    const b = memoFunc('foo'); // run
    const c = memoFunc('foo');
    const d = memoFunc('bar'); // run
    const e = memoFunc('foo'); // run
    const f = memoFunc(objA, objB); // run
    const g = memoFunc(objA, objB); // NO run (incorrect)
    const h = memoFunc(objA, objC); // NO run (incorrect)

    console.log(a === b); // false
    console.log(a === c); // false
    console.log(b === c); // true
    console.log(a === e); // false
    console.log(b === e); // false
    console.log(c === e); // false
    console.log(f === g); // true
    console.log(f === h); // true (incorrect)

A custom `resolver` function can be provided with the options param to use a custom cache identifier, which can be of any type: 

`examples/last/key/basic-resolver-str.ts`

    const func = (value: string | number) => {
        console.log('run');

        return { value };
    };

    const memoFunc = memoLastKey(func, {
        resolver: (...args) => args.map(arg => `${ arg }`).join('')
    });

    const a = memoFunc('1'); // run
    const b = memoFunc(1);

    console.log(a === b); // true

`examples/last/key/basic-resolver-obj.ts`

    const func = (value: any) => {
        console.log('run');

        return { value };
    };

    const memoFunc = memoLastKey(func, {
        resolver: (arg: any) => arg.keyObj,
    });

    const keyObj = {};

    const a = memoFunc({ keyObj }); // run
    const b = memoFunc({ keyObj });

    console.log(a === b); // true

By default, the following resolver function is used:

    (...args) => `[${ args.map(arg => `${ typeof arg === 'string' ? `'${ arg }'` : arg }`).join(', ') }]`

Two additional properties, `lastKey` and `lastValue`, are attached to the memoized function:

`examples/last/key/internals.ts`

    const func = (value: string) => ({ value });
    const memoFunc = memoLastKey(func);

    memoFunc('foo');

    console.log(memoFunc.lastKey); // ['foo', 2, true, [object Object]]
    console.log(memoFunc.lastValue); // foo
    

### `memoLastRef(func): MemoizedLastRefFunction`

Memoizes the result from the last call of the function `func` until the arguments change:

`examples/last/ref/basic.ts`

    const func = (value1: any, value2?: any) => {
        console.log('run');

        return { value1, value2 };
    };

    const memoFunc = memoLastRef(func);

    const objA = { value: 'a' };
    const objB = { value: 'b' };
    const objC = { value: 'c' };

    const a = func('foo'); // run
    const b = memoFunc('foo'); // run
    const c = memoFunc('foo');
    const d = memoFunc('bar'); // run
    const e = memoFunc('foo'); // run
    const f = memoFunc(objA, objB); // run
    const g = memoFunc(objA, objB);
    const h = memoFunc(objA, objC); // run

    console.log(a === b); // false
    console.log(a === c); // false
    console.log(b === c); // true
    console.log(a === e); // false
    console.log(b === e); // false
    console.log(c === e); // false
    console.log(f === g); // true
    console.log(f === h); // false

Two additional properties, `lastArgs` and `lastValue`, are attached to the memoized function:

`examples/last/ref/internals.ts`

    const func = (...args: any) => 'foo';
    const memoFunc = memoLastRef(func);

    memoFunc('foo', 2, true, { a: 1 });

    console.log(memoFunc.lastArgs); // [ 'foo', 2, true, { a: 1 } ]
    console.log(memoFunc.lastValue); // foo


### `memoCacheKey(func[, { resolver }]): MemoizedCacheFunction`

Memoizes the result from the N most recent calls of the function `func` using the serialized arguments as the string key:

`examples/cache/basic.ts`

    const func = (value1: any, value2?: any) => {
        console.log('run');

        return { value1, value2 };
    };

    const memoFunc = memoCacheKey(func, { slots: 2 });

    const a = func('foo'); // run
    const b = memoFunc('foo'); // run
    const c = memoFunc('foo');
    const d = memoFunc('bar'); // run
    const e = memoFunc('foo'); 
    const f = memoFunc('bar'); 
    const g = memoFunc('baz'); // run
    const h = memoFunc('foo'); // run

    console.log(a === b); // false
    console.log(a === c); // false
    console.log(b === c); // true
    console.log(b === e); // true
    console.log(c === e); // true
    console.log(e === h); // false


An additional property, `cache`, is attached to the memoized function:

`examples/cache/internals.ts`

    const func = (value1: any, value2?: any) => {
        console.log('run');

        return { value1, value2 };
    };

    const memoFunc = memoCacheKey(func, { slots: 2 });

    memoFunc('foo'); 
    memoFunc('bar'); 
    memoFunc('baz'); 

    console.log(memoFunc.cache); // CacheSet [Map] { ... }


### `CacheSet(iterableOrObject?: Iterable<[K, V]> | CacheSetOptions, options?: CacheSetOptions)`

Create an instance of a set with a maximum number of elements (`options.slots`), limited time-to-live (`options.ttl`) or the ability to update the stored value when Promises are resolved (`options.keepPromises`):

    const cacheSet = new CacheSet<number, string>([[1, 'one'], [2, 'two']], { slots: 2});

    console.log(cacheSet.size); // 2

    cacheSet.set(3, 'three');

    console.log(cacheSet.size); // 2

    console.log(cacheSet.get(1)); // undefined

<br>


TypeScript Support
------------------

Types are already included in this package.

You can check if a variable is referencing a memoized function with the following [type guards](https://www.typescriptlang.org/docs/handbook/advanced-types.html#user-defined-type-guards):

- [`isMemoLastKeyFunction(func)`](https://github.com/helloswyg/memo/blob/main/src/base/memo-base.utils.ts)
- [`isMemoLastRefFunction(func)`](https://github.com/helloswyg/memo/blob/main/src/base/memo-base.utils.ts)
- [`isMemoCacheFunction(func)`](https://github.com/helloswyg/memo/blob/main/src/base/memo-base.utils.ts)
- [`isMemoFunction(func)`](https://github.com/helloswyg/memo/blob/main/src/base/memo-base.utils.ts)

<br>


TODO
----

- Implement a mechanism to skip the memoization (e.g. return `undefined` for the cache key or attach a `withoutMemo()` function to the memoized function).
- Implement a mechanism to get a "result" object that includes the entry key and initial date it was put into the cache.
- Better interface for `CacheSet` depending if `keepPromises === true`.
