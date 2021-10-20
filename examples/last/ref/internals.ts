import { memoLastRef } from "memo";

const func = (...args: any) => 'foo';
const memoFunc = memoLastRef(func);

memoFunc('foo', 2, true, { a: 1 });

console.log(memoFunc.lastArgs); // [ 'foo', 2, true, { a: 1 } ]
console.log(memoFunc.lastValue); // foo
