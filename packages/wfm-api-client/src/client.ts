import type {
  WfmApiClientOptions,
  WfmCacheOptions,
  WfmRateLimitOptions,
} from './types'
import Bottleneck from 'bottleneck'
import { WfmMemoryCache } from './cache'
import { createItemEndpoints, createRivenEndpoints, createToolEndpoints } from './endpoints'
import { defaultFetcher, fetchWithLimiter } from './transport'

const defaultCacheOptions: WfmCacheOptions = {
  maxSize: 1024,
  itemListTtl: 3600,
  orderListTtl: 30,
  statisticsTtl: 60,
  rivenItemListTtl: 3600,
  rivenOrderListTtl: 30,
  rivenAttributeListTtl: 3600,
  ducatnatorTtl: 60,
}

const defaultRateLimitOptions: WfmRateLimitOptions = {
  minTime: 500,
}

export function createWfmApiClient(
  options: WfmApiClientOptions = {},
) {
  const fetcher = options.fetcher ?? defaultFetcher
  const cacheOptions = resolveCacheOptions(options.cache)
  const limiter = resolveLimiter(options.rateLimit)
  const cache = cacheOptions
    ? new WfmMemoryCache(cacheOptions.maxSize)
    : undefined

  async function get<T>(url: string, ttl: number): Promise<T | undefined> {
    try {
      if (!cache || ttl <= 0) {
        return await fetchWithLimiter<T>(fetcher, url, limiter)
      }

      return await cache.get(
        url,
        ttl,
        () => fetchWithLimiter<T>(fetcher, url, limiter),
      )
    }
    catch {
      return undefined
    }
  }

  return {
    items: createItemEndpoints(get, cacheOptions),
    rivens: createRivenEndpoints(get, cacheOptions),
    tools: createToolEndpoints(get, cacheOptions),
  }
}

export type WfmApiClient = ReturnType<typeof createWfmApiClient>

function resolveCacheOptions(
  cache: WfmApiClientOptions['cache'],
): WfmCacheOptions | undefined {
  if (cache === false)
    return undefined
  if (cache === true || cache === undefined)
    return defaultCacheOptions
  return { ...defaultCacheOptions, ...cache }
}

function resolveLimiter(rateLimit: WfmApiClientOptions['rateLimit']): Bottleneck | undefined {
  if (rateLimit === false)
    return undefined
  const options
    = rateLimit === true || rateLimit === undefined
      ? defaultRateLimitOptions
      : { ...defaultRateLimitOptions, ...rateLimit }
  return new Bottleneck({ minTime: options.minTime })
}
