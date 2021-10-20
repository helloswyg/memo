import { memoCacheKey } from 'memo';

const func = (value1: any, value2?: any) => {
    console.log('run');

    return { value1, value2 };
};

const memoFunc = memoCacheKey(func, { slots: 2 });

memoFunc('foo'); 
memoFunc('bar'); 
memoFunc('baz'); 

console.log(memoFunc.cache);
