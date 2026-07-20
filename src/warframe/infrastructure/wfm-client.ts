import Bottleneck from 'bottleneck'
import {
  createWfmApiClient,
  type Ducatnator,
  type ItemShort,
  type OrderWithUser,
  type RivenAttribute,
  type RivenItem,
  type RivenOrder,
  type StatisticsCollection,
  type WfmFetcher,
  type WFMLang,
} from 'wfm-api-client'
import { WfmMemoryCache } from './wfm-cache'

export interface PluginWfmClientOptions {
  fetcher?: WfmFetcher
  rateLimit?: false | { minTime: number }
  cache?: false | { maxSize?: number }
  language?: 'zh-hans' | string
}

function createDefaultFetcher(): WfmFetcher {
  return async input => {
    const response = await fetch(input.url, {
      method: input.method,
      headers: input.headers,
      body: input.body,
      signal: input.signal,
    })

    return {
      status: response.status,
      ok: response.ok,
      json: async () => response.json(),
      text: async () => response.text(),
    }
  }
}

export function createPluginWfmClient(options?: PluginWfmClientOptions): {
  items: {
    list: () => Promise<ItemShort[] | undefined>
    getStatistics: (slug: string) => Promise<StatisticsCollection | undefined>
  }
  orders: {
    listByItem: (ref: { slug: string }) => Promise<OrderWithUser[] | undefined>
  }
  rivens: {
    listWeapons: () => Promise<RivenItem[] | undefined>
    listAttributes: () => Promise<RivenAttribute[] | undefined>
    getOrders: (slug: string) => Promise<RivenOrder[] | undefined>
  }
  tools: {
    getDucatnator: () => Promise<{ day: Ducatnator[], hour: Ducatnator[] } | undefined>
  }
} {
  const baseFetcher = options?.fetcher ?? createDefaultFetcher()
  const fetcher = options?.rateLimit === false
    ? baseFetcher
    : (() => {
        const limiter = new Bottleneck({
          minTime: options?.rateLimit?.minTime ?? 500,
        })
        return input => limiter.schedule(() => baseFetcher(input))
      })()
  const raw = createWfmApiClient({
    fetcher,
    language: (options?.language ?? 'zh-hans') as WFMLang,
    timeoutMs: 10_000,
  })
  const cache = options?.cache === false
    ? undefined
    : new WfmMemoryCache(options?.cache?.maxSize ?? 1024)

  async function safeCall<T>(fn: () => Promise<T>): Promise<T | undefined> {
    try {
      return await fn()
    }
    catch {
      return undefined
    }
  }

  async function cachedSafe<T>(
    key: string,
    ttlSeconds: number,
    fn: () => Promise<T>,
  ): Promise<T | undefined> {
    try {
      if (!cache)
        return await safeCall(fn)
      return await cache.get(key, ttlSeconds, fn)
    }
    catch {
      return undefined
    }
  }

  return {
    items: {
      list: () => cachedSafe('items.list', 3600, () => raw.items.list()),
      getStatistics: slug =>
        cachedSafe(`items.getStatistics:${slug}`, 60, () => raw.items.getStatistics(slug)),
    },
    orders: {
      listByItem: ref =>
        cachedSafe(`orders.listByItem:${ref.slug}`, 30, () => raw.orders.listByItem(ref)),
    },
    rivens: {
      listWeapons: () =>
        cachedSafe('rivens.listWeapons', 3600, () => raw.rivens.listWeapons()),
      listAttributes: () =>
        cachedSafe('rivens.listAttributes', 3600, () => raw.rivens.listAttributes()),
      getOrders: slug =>
        cachedSafe(`rivens.getOrders:${slug}`, 30, () => raw.rivens.getOrders(slug)),
    },
    tools: {
      getDucatnator: () =>
        cachedSafe('tools.getDucatnator', 60, () => raw.tools.getDucatnator()),
    },
  }
}

export const wfmClient = createPluginWfmClient()
