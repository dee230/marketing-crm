// Offline cache — stores API responses as JSON files with TTL
// Uses expo-file-system Directory/File API (SDK 54)
import { Paths, Directory, File } from 'expo-file-system';

const CACHE_DIR = new Directory(Paths.cache, 'api-cache');
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

function toFileName(key: string): string {
  return key.replace(/[^a-zA-Z0-9_\-]/g, '_') + '.json';
}

/** Age of a cached entry in milliseconds */
export function getCacheAge(entry: { timestamp: number }): number {
  return Date.now() - entry.timestamp;
}

/** Whether a cached entry is past its TTL */
export function isExpired(entry: { timestamp: number; ttl?: number }): boolean {
  return getCacheAge(entry) > (entry.ttl ?? DEFAULT_TTL);
}

/** Read a cached value. Returns null if missing or unreadable. */
export async function getCached<T>(
  key: string
): Promise<{ data: T; entry: { timestamp: number; ttl?: number } } | null> {
  try {
    if (!CACHE_DIR.exists) return null;
    const file = new File(CACHE_DIR, toFileName(key));
    if (!file.exists) return null;
    const raw = await file.text();
    const entry = JSON.parse(raw);
    return { data: entry.data as T, entry };
  } catch {
    return null;
  }
}

/** Write a value to the cache with optional TTL (ms). */
export async function setCached(key: string, data: unknown, ttl?: number): Promise<void> {
  try {
    if (!CACHE_DIR.exists) {
      CACHE_DIR.create({ idempotent: true, intermediates: true });
    }
    const file = new File(CACHE_DIR, toFileName(key));
    file.write(
      JSON.stringify({
        data,
        timestamp: Date.now(),
        ttl: ttl ?? DEFAULT_TTL,
      })
    );
  } catch {
    // Cache writes are best-effort
  }
}

/** Delete all cached entries. */
export async function clearCache(): Promise<void> {
  try {
    if (CACHE_DIR.exists) {
      for (const entry of CACHE_DIR.list()) {
        if (entry instanceof File) entry.delete();
      }
    }
  } catch {
    // Best-effort
  }
}

/** How many items are currently cached */
export async function cacheSize(): Promise<number> {
  try {
    if (!CACHE_DIR.exists) return 0;
    return CACHE_DIR.list().filter((e) => e instanceof File).length;
  } catch {
    return 0;
  }
}
