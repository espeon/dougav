import type { NextApiResponse } from "next";
import { LRUCache } from "lru-cache";

export interface itemValue {
  name: string;
  path: string;
  type: string;
  mime: string;
  length: number | null;
  bytes: number | null;
  timeLastModified: number;
}

export function cache() {
  const c = new LRUCache({
    max: 30000,
    // 28 days in ms
    ttl: 1000 * 60 * 60 * 24 * 7 * 4,
    allowStale: true,
    updateAgeOnGet: true,
  });

  return {
    check: (key: string) =>
      new Promise<itemValue>((resolve, reject) => {
        const item = c.get(key) as itemValue;

        return item === undefined ? reject() : resolve(item);
      }),
    set: (key: string, value: itemValue) =>
      new Promise<void>((resolve, reject) => {
        c.set(key, value);
        return resolve();
      }),
  };
}
