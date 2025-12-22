/**
 * Creates an async cache with a time-to-live (TTL).
 * @param fetchFn Function to fetch fresh data.
 * @param ttlMs Time-to-live in milliseconds.
 * @returns
 */
export function createAsyncCache<T>(fetchFn: () => Promise<T>, ttlMs: number) {
  let cache: T = null;
  let lastUpdatedAt: number = 0;
  let inFlight: Promise<T> = null; // promise for ongoing update

  async function get(): Promise<T> {
    const now = Date.now();

    // If cache is fresh, return it
    if (cache && now - lastUpdatedAt < ttlMs) {
      return cache;
    }

    // If an update is already happening, wait for it
    if (inFlight) {
      return inFlight;
    }

    // Otherwise start a new update
    inFlight = (async () => {
      try {
        const result = await fetchFn();
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
