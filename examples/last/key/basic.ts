import { memoLastKey } from 'memo';

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