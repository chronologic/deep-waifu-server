import { Cache } from 'memory-cache';

interface ICache<T, U> {
  put: (key: T, value: U, ttl?: number) => any;
  get: (key: T) => U;
  keys: () => any[];
}

export function createTimedCache<T, U>(defaultTtl: number): ICache<T, U> {
  const cache = new Cache<T, U>();

  return {
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    put: (key: T, value: U, ttl = defaultTtl) => cache.put(key, value, ttl),
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    get: (key: T) => cache.get(key),
    // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
    keys: () => cache.keys(),
  };
}
