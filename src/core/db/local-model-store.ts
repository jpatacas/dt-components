import { openDB } from "idb";

const DB_NAME = "dt-models";
const STORE_NAME = "models";

async function getDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME);
    },
  });
}

export const localModelStore = {
  async save(key: string, file: File) {
    const db = await getDB();
    await db.put(STORE_NAME, file, key);
  },

  async get(key: string): Promise<File | undefined> {
    const db = await getDB();
    return db.get(STORE_NAME, key);
  },

  async delete(key: string) {
    const db = await getDB();
    await db.delete(STORE_NAME, key);
  },
};