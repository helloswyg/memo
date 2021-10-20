import { memoCacheKey } from 'memo';

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