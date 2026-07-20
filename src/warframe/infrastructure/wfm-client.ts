import type {
  Ducatnator,
  RivenItem,
  RivenOrder,
  StatisticsCollection,
  WfmFetcher,
  WfmFetchInput,
  WFMLang,
} from 'wfm-api-client'
import type {
  ItemShort,
  OrderWithUser,
  RivenAttribute,
} from '../types/wfm'
import Bottleneck from 'bottleneck'
import { createWfmApiClient } from 'wfm-api-client'
import { WfmMemoryCache } from './wfm-cache'

export interface PluginWfmClientOptions {
  fetcher?: WfmFetcher
  rateLimit?: false | { minTime: number }
  cache?: false | { maxSize?: number }
  language?: 'zh-hans' | string
}

function createDefaultFetcher(): WfmFetcher {
  return async (input) => {
    const response = await fetch(input.url, {
      method: input.method,
      headers: input.headers,
      body: input.body,
      signal: input.signal ?? AbortSignal.timeout(10_000),
    })

    return {
      status: response.status,
      ok: response.ok,
      json: async () => await response.json() as unknown,
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
        return async (input: WfmFetchInput) => limiter.schedule(async () => baseFetcher(input))
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
      list: async () => cachedSafe('items.list', 3600, async () => raw.items.list()),
      getStatistics: async slug =>
        cachedSafe(`items.getStatistics:${slug}`, 60, async () => raw.items.getStatistics(slug)),
    },
    orders: {
      listByItem: async ref =>
        cachedSafe(`orders.listByItem:${ref.slug}`, 30, async () => raw.orders.listByItem(ref)),
    },
    rivens: {
      listWeapons: async () =>
        cachedSafe('rivens.listWeapons', 3600, async () => raw.rivens.listWeapons()),
      listAttributes: async () =>
        cachedSafe('rivens.listAttributes', 3600, async () => raw.rivens.listAttributes()),
      getOrders: async slug =>
        cachedSafe(`rivens.getOrders:${slug}`, 30, async () => raw.rivens.getOrders(slug)),
    },
    tools: {
      getDucatnator: async () =>
        cachedSafe('tools.getDucatnator', 60, async () => raw.tools.getDucatnator()),
    },
  }
}

export const wfmClient = createPluginWfmClient()
