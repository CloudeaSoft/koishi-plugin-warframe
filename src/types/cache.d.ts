interface AsyncCache<T> {
  get: () => Promise<T>
  update: () => Promise<T>
}

type AsyncCacheFactory<T> = () => Promise<T>
