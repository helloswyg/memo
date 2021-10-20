import { memoLastKey } from "memo";

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