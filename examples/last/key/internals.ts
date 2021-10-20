import { memoLastKey } from "memo";

const func = (...args: any) => 'foo';
const memoFunc = memoLastKey(func);

memoFunc('foo', 2, true, { a: 1 });

console.log(memoFunc.lastKey); // ['foo', 2, true, [object Object]]
console.log(memoFunc.lastValue); // foo
