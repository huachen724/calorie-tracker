import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { DayRecord } from '../types';

interface DietDB extends DBSchema {
  days: {
    key: string;
    value: DayRecord;
    indexes: { 'by-iso': string };
  };
}

const DB_NAME = 'calorie-tracker';
const DB_VERSION = 1;
const STORE = 'days';

let dbPromise: Promise<IDBPDatabase<DietDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<DietDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE, { keyPath: 'key' });
        store.createIndex('by-iso', 'iso');
      },
    });
  }
  return dbPromise;
}

/** Inserts or overwrites (by key) each day record. Re-importing the same date updates it. */
export async function upsertDays(days: DayRecord[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(STORE, 'readwrite');
  await Promise.all([...days.map((d) => tx.store.put(d)), tx.done]);
}

export async function getAllDays(): Promise<DayRecord[]> {
  const db = await getDb();
  return db.getAll(STORE);
}

export async function deleteDay(key: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE, key);
}

export async function clearAllDays(): Promise<void> {
  const db = await getDb();
  await db.clear(STORE);
}
