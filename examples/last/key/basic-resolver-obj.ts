import { memoLastKey } from "memo";

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