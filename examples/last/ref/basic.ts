import { memoLastRef } from 'memo';

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