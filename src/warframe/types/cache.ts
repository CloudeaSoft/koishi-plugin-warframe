export interface AsyncCache<T> {
  get: () => Promise<T>
  update: () => Promise<T>
}

export type AsyncCacheFactory<T> = () => Promise<T>
