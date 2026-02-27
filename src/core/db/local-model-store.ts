import { openDB } from "idb";

const DB_NAME = "dt-models";

async function getDB() {
  return openDB(DB_NAME, 1, {

        upgrade(db) {
      if (!db.objectStoreNames.contains("models")) {
        db.createObjectStore("models");
      }

      if (!db.objectStoreNames.contains("fragments")) {
        db.createObjectStore("fragments");
      }
    },
  });
}

export const localModelStore = {
  async saveIFC(key: string, file: File) {
    const db = await getDB();
    await db.put("models", file, key);
  },

  async getIFC(key: string): Promise<File | undefined> {
    const db = await getDB();
    return db.get("models", key);
  },

  async deleteIFC(key: string) {
    const db = await getDB();
    await db.delete("models", key);
  },
  async saveFragments(key: string, buffers: ArrayBuffer[]) {
    const db = await getDB();
    await db.put("fragments", buffers, key);
  },

  async getFragments(key: string): Promise<ArrayBuffer[] | undefined> {
    const db = await getDB();
    return db.get("fragments", key);
  },
  async deleteFragments(key: string) {
  const db = await getDB();
  await db.delete("fragments", key);
}
};
