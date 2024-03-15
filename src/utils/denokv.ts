import { itemValue } from "./lru";
import Database from "better-sqlite3";

export interface KVOptions {
  location: string;
}

export class SqliteKV {
  db: Database.Database;
  constructor(location: string) {
    this.db = new Database(location);
    this.db.pragma("journal_mode = WAL");
    this.initTable()
  }
  initTable() {
    this.db.exec(`
          CREATE TABLE IF NOT EXISTS kv (
            key TEXT PRIMARY KEY,
            value TEXT
          )
        `);
  }
  async set(key: String, value: String): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const op = this.db.prepare(
          "INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)"
        );
        if (typeof value == "boolean") value = String(value);
        op.run(key, value);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
  async get(key: String): Promise<String | null> {
    return new Promise((resolve, reject) => {
      try {
        const op = this.db.prepare("SELECT value FROM kv WHERE key = ?");
        const result = op.get(key);
        console.log(result)
        if (typeof result == "undefined") return resolve(null);
        if (result && typeof result === 'object' && 'value' in result) resolve(result.value as String);
        else resolve(null);
      } catch (error) {
        reject(error);
      }
    });
  }
  async getitemValue(key: String): Promise<itemValue | null> {
    return new Promise(async (resolve, reject) => {
      let r = await this.get(key);
      if (r === null) return reject("response is null")
      console.log(r)
      resolve(JSON.parse(r as string) as itemValue);
    });
  }
  async delete(key: String): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const op = this.db.prepare("DELETE FROM kv WHERE key = ?");
        op.run(key);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
  async update(key: String, value: String): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const op = this.db.prepare(
          "UPDATE kv SET value = ? WHERE key = ?"
        );
        if (typeof value == "boolean") value = String(value);
        op.run(value, key);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }
  async all(): Promise<unknown[]> {
    return new Promise((resolve, reject) => {
      try {
        const op = this.db.prepare("SELECT * FROM kv");
        const result = op.all() || [];
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }
}
