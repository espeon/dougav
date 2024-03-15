import { itemValue } from "./lru";
import { PermaDB } from "perma.db";

export interface KVOptions {
    location: string;
}

export function Kv(opts: KVOptions){
    let kv = new PermaDB(opts.location)

    return {
        get: (key: string) =>
        new Promise<itemValue|null>(async (resolve, reject) => {
            let k = await kv.get(key)
            resolve(JSON.parse(k as string) as itemValue | null)
        }),
        set: (key: string, value: itemValue) =>
        new Promise<void>(async (resolve, reject) => {
            await kv.set(key, JSON.stringify(value))
            resolve()
        })
    }
}
