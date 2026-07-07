export class WfmMemoryCache {
  private readonly storage = new Map<
    string,
    { expiresAt: number; promise: Promise<unknown> }
  >();

  constructor(private readonly maxSize: number) { }

  get<T>(
    key: string,
    ttlSeconds: number,
    factory: () => Promise<T>,
  ): Promise<T> {
    const now = Date.now();
    const existing = this.storage.get(key);

    if (existing && existing.expiresAt > now) {
      this.storage.delete(key);
      this.storage.set(key, existing);
      return existing.promise as Promise<T>;
    }

    if (existing) {
      this.storage.delete(key);
    }

    const promise = factory().catch((err) => {
      const existing = this.storage.get(key);
      if (existing && existing.promise === promise) {
        this.storage.delete(key);
      }
      throw err;
    });

    this.storage.set(key, {
      expiresAt: now + ttlSeconds * 1000,
      promise,
    });

    while (this.storage.size > this.maxSize) {
      const oldest = this.storage.keys().next().value;
      if (!oldest) break;
      this.storage.delete(oldest);
    }

    return promise;
  }
}
