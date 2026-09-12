import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from '../firebase/config';

const LOCAL_TTL_MS = 5 * 60 * 1000; // 5 minutes cache TTL

interface CacheEntry<T> {
  data: T[];
  timestamp: number;
}

/**
 * FirestoreCollection — Local-First, Optimistic, Instant.
 *
 * Rules:
 *  - ALL reads return instantly from localStorage (< 1ms).
 *  - ALL writes (add/update/remove) update localStorage instantly and
 *    fire Firestore in the background without blocking the UI.
 *  - Firestore is refreshed in background if cache is stale (> 5 min).
 */
export class FirestoreCollection<T extends { id: string }> {
  private collectionName: string;
  private initialData: T[];
  private localKey: string;

  constructor(collectionName: string, initialData: T[]) {
    this.collectionName = collectionName;
    this.initialData = initialData;
    this.localKey = `sis_v2_${collectionName}`;
  }

  // ─── Local cache helpers ───────────────────────────────────────────────────

  private readCache(): T[] {
    try {
      const raw = localStorage.getItem(this.localKey);
      if (raw) {
        const entry: CacheEntry<T> = JSON.parse(raw);
        return entry.data ?? [];
      }
    } catch { /* ignore */ }
    // Seed with initial data
    this.writeCache(this.initialData);
    return this.initialData;
  }

  private writeCache(data: T[]): void {
    try {
      const entry: CacheEntry<T> = { data, timestamp: Date.now() };
      localStorage.setItem(this.localKey, JSON.stringify(entry));
    } catch { /* ignore quota */ }
  }

  private isCacheStale(): boolean {
    try {
      const raw = localStorage.getItem(this.localKey);
      if (!raw) return true;
      const entry: CacheEntry<T> = JSON.parse(raw);
      return Date.now() - (entry.timestamp || 0) > LOCAL_TTL_MS;
    } catch { return true; }
  }

  // ─── Background Firestore sync ─────────────────────────────────────────────

  /** Pull from Firestore and update local cache silently */
  private syncFromFirestore(): void {
    getDocs(collection(db, this.collectionName))
      .then(snap => {
        if (!snap.empty) {
          const remote = snap.docs.map(d => ({ id: d.id, ...d.data() } as T));
          this.writeCache(remote);
        } else {
          // Seed Firestore with initial data in background
          const local = this.readCache();
          local.forEach(item => {
            setDoc(doc(db, this.collectionName, item.id), item).catch(() => {});
          });
        }
      })
      .catch(() => { /* ignore network errors */ });
  }

  /** Push single item to Firestore silently */
  private pushToFirestore(item: T): void {
    setDoc(doc(db, this.collectionName, item.id), item)
      .catch(() => { /* ignore */ });
  }

  /** Push partial update to Firestore silently */
  private patchFirestore(id: string, updates: Partial<T>): void {
    updateDoc(doc(db, this.collectionName, id), updates as any)
      .catch(() => {
        // Fallback: full doc set
        const all = this.readCache();
        const item = all.find(i => i.id === id);
        if (item) setDoc(doc(db, this.collectionName, id), item).catch(() => {});
      });
  }

  /** Delete from Firestore silently */
  private deleteFromFirestore(id: string): void {
    deleteDoc(doc(db, this.collectionName, id)).catch(() => {});
  }

  // ─── Public API (all instant) ──────────────────────────────────────────────

  async getAll(): Promise<T[]> {
    const local = this.readCache();
    // Kick off background refresh if stale — but don't wait for it
    if (this.isCacheStale()) {
      this.syncFromFirestore();
    }
    return local;
  }

  async getById(id: string): Promise<T | null> {
    const all = this.readCache();
    return all.find(item => item.id === id) ?? null;
  }

  async add(item: T): Promise<T> {
    const all = this.readCache();
    const existingIdx = all.findIndex(i => i.id === item.id);
    if (existingIdx >= 0) {
      all[existingIdx] = item; // update in place
    } else {
      all.unshift(item); // prepend so it shows first
    }
    this.writeCache(all);        // instant
    this.pushToFirestore(item);  // background
    return item;
  }

  async update(id: string, updates: Partial<T>): Promise<T> {
    const all = this.readCache();
    const idx = all.findIndex(i => i.id === id);
    let result: T;

    if (idx >= 0) {
      result = { ...all[idx], ...updates };
      all[idx] = result;
    } else {
      result = { id, ...updates } as T;
      all.unshift(result);
    }
    this.writeCache(all);           // instant
    this.patchFirestore(id, updates); // background
    return result;
  }

  async remove(id: string): Promise<void> {
    const all = this.readCache().filter(i => i.id !== id);
    this.writeCache(all);          // instant
    this.deleteFromFirestore(id);  // background
  }
}

/**
 * Utility: run a promise with a timeout.
 * Returns fallbackValue if the promise does not resolve within `ms`.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, fallbackValue: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<T>(resolve => {
    timer = setTimeout(() => resolve(fallbackValue), ms);
  });
  return Promise.race([
    promise.then(val => { clearTimeout(timer); return val; }),
    timeout,
  ]);
}
