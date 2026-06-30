/**
 * Creates an async cache with a time-to-live (TTL).
 * @param factory Function to fetch fresh data.
 * @param ttlMs Time-to-live in milliseconds. Defaults to 60_000 meaning 1 minute. Set to -1 for infinity duration.
 * @returns
 */
export function createAsyncCache<T>(
  factory: AsyncCacheFactory<T>,
  ttlMs: number = 60_000,
): AsyncCache<T> {
  let cache: T;
  let lastUpdatedAt: number = 0;
  let inFlight: Promise<T> | null; // promise for ongoing update

  async function update(): Promise<T> {
    // If an update is already happening, wait for it
    if (inFlight) {
      return inFlight;
    }

    // Otherwise start a new update
    inFlight = (async () => {
      try {
        const result = await factory();
        cache = result;
        lastUpdatedAt = Date.now();
        return cache;
      } finally {
        inFlight = null; // clear lock
      }
    })();

    return inFlight;
  }

  async function get(): Promise<T> {
    const now = Date.now();

    // If cache is fresh, return it
    if (cache && (ttlMs < 0 || now - lastUpdatedAt < ttlMs)) {
      return cache;
    }

    return await update();
  }

  return { get, update };
}

export class CacheStorage<T> {
  private _limit: number;
  private _storage: Map<string, Promise<T>>;

  /**
   *
   * @param limit defaults to 100.
   */
  constructor(limit: number = 100) {
    if (limit <= 0) {
      throw new Error("Size of cache storage must be larger than 0!");
    }

    this._limit = limit;
    this._storage = new Map<string, Promise<T>>();
  }

  /**
   * Get or set caches.
   * @param hash The identity of data.
   * @param fetchFn The function to get the data.
   * @returns `Promise<T>` or `undefined`.
   */
  async get(hash: string, fetchFn: () => Promise<T>): Promise<T> {
    const existingPromise = this._storage.get(hash);
    if (existingPromise) {
      this._storage.delete(hash);
      this._storage.set(hash, existingPromise);
      return existingPromise;
    }

    const promise = fetchFn().catch((err) => {
      this._storage.delete(hash);
      throw err;
    });

    this._storage.set(hash, promise);

    if (this._storage.size > this._limit) {
      const oldestKey = this._storage.keys().next().value as string | undefined;
      if (oldestKey) {
        this._storage.delete(oldestKey);
      }
    }

    return promise;
  }

  clear() {
    this._storage.clear();
  }

  get size() {
    return this._storage.size;
  }
}
