interface AsyncCache<T> {
  get: () => Promise<T>;
}

type AsyncCacheFactory<T> = () => Promise<T>;
