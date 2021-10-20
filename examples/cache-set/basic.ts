import { CacheSet } from "memo";

const cacheSet = new CacheSet<number, string>([[1, 'one'], [2, 'two']], { slots: 2});

console.log(cacheSet.size); // 2

cacheSet.set(3, 'three');

console.log(cacheSet.size); // 2

console.log(cacheSet.get(1)); // undefined
