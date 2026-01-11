/**
 * Creates an async cache with a time-to-live (TTL).
 * @param factory Function to fetch fresh data.
 * @param ttlMs Time-to-live in milliseconds. Defaults to 60_000 meaning 1 minute. Set to -1 for infinity duration.
 * @returns
 */
export function createAsyncCache<T>(
  factory: AsyncCacheFactory<T>,
  ttlMs: number = 60_000
): AsyncCache<T> {
  let cache: T = null;
  let lastUpdatedAt: number = 0;
  let inFlight: Promise<T> = null; // promise for ongoing update

  async function get(): Promise<T> {
    const now = Date.now();

    // If cache is fresh, return it
    if (cache && (ttlMs < 0 || now - lastUpdatedAt < ttlMs)) {
      return cache;
    }

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

  return { get };
}
