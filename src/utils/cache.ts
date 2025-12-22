export function createAsyncCache<T>(fetchFn: () => Promise<T>, ttlMs: number) {
  let cache = null;
  let lastUpdated = 0;
  let inFlight = null; // promise for ongoing update

  async function get(): Promise<T> {
    const now = Date.now();

    // If cache is fresh, return it
    if (cache && now - lastUpdated < ttlMs) {
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
        lastUpdated = Date.now();
        return cache;
      } finally {
        inFlight = null; // clear lock
      }
    })();

    return inFlight;
  }

  return { get };
}
