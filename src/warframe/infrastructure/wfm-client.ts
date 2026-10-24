import type {
  CallOptions,
  RivenOrder,
  WfmApiClient,
  WfmFetcher,
  WfmPlugin,
  WfmRequestNext,
} from 'wfm-api-client'
import type { RivenOrderFilters } from '../types/wfm'
import {
  createWfmApiClient,
  memoryCachePlugin,
  rateLimitPlugin,
  WfmApiError,
} from 'wfm-api-client'
import { fetchAsyncResponse } from '../utils/http'

const userAgent = 'koishi-plugin-warframe (+https://github.com/CloudeaSoft/koishi-plugin-warframe)'
const errorListeners = new Set<(url: string, error: unknown) => void>()

/** The framework boundary owns logging; the domain only publishes failures. */
export function onWfmRequestError(listener: (url: string, error: unknown) => void): () => void {
  errorListeners.add(listener)
  return () => {
    errorListeners.delete(listener)
  }
}

const marketFetcher: WfmFetcher = async (input) => {
  let requestError: unknown
  const response = await fetchAsyncResponse(input.url, {
    method: input.method,
    headers: { ...input.headers, 'User-Agent': userAgent },
    body: input.body,
    signal: input.signal,
  }, (error) => { requestError = error })
  if (!response)
    throw requestError ?? new Error('Warframe Market request failed')
  if (response.headers.get('cf-mitigated') === 'challenge') {
    // A challenge is HTML, not an API envelope; do not retry or cache it.
    await response.body?.cancel()
    throw new WfmApiError('Cloudflare challenge', { status: response.status, url: input.url })
  }
  return response
}

type RivenOrderOptions = CallOptions & RivenOrderFilters
type PluginWfmClient = Omit<WfmApiClient, 'rivens'> & {
  rivens: Omit<WfmApiClient['rivens'], 'getOrders'> & {
    getOrders: (weaponUrlName: string, options?: RivenOrderOptions) => Promise<RivenOrder[] | undefined>
  }
}

// The upstream v1 endpoint forwards options as request context but does not yet
// expose attribute filters. Add them before caching so each query has its own key.
function rivenOrderFiltersPlugin(): WfmPlugin {
  return {
    wrap: next => async (ctx) => {
      const options: RivenOrderOptions | undefined = ctx.init.context
      if (ctx.url.startsWith('https://api.warframe.market/v1/auctions/search?')
        && (options?.positiveStats?.length || options?.negativeStat)) {
        const url = new URL(ctx.url)
        if (options.positiveStats?.length) {
          url.searchParams.set('positive_stats', [...new Set(options.positiveStats)].sort().join(','))
          url.searchParams.set('operation', 'allOf')
        }
        if (options.negativeStat)
          url.searchParams.set('negative_stats', options.negativeStat)
        return next({ ...ctx, url: url.toString() })
      }
      return next(ctx)
    },
  }
}

/** Warframe-local: map request failures to `undefined` (not part of upstream client). */
export function softFailPlugin(): WfmPlugin {
  return {
    wrap: (next: WfmRequestNext): WfmRequestNext => {
      return async (ctx) => {
        try {
          return await next(ctx)
        }
        catch (error) {
          for (const listener of errorListeners) {
            try {
              listener(ctx.url, error)
            }
            catch {
              // A logging failure must not change the soft-fail contract.
            }
          }
          return undefined
        }
      }
    },
  }
}

/** `fetcher` is a test injection seam; production identifies this application. */
export function createPluginWfmClient(fetcher?: WfmFetcher): PluginWfmClient {
  // Plugin array order is outer -> inner (client uses reduceRight).
  // softFail must stay outermost so failures are not stored by memoryCache.
  const plugins: WfmPlugin[] = [
    softFailPlugin(),
    rivenOrderFiltersPlugin(),
    memoryCachePlugin({ maxSize: 1024, ttl: 60 }),
  ]

  // Skip rate limiting when a mock fetcher is injected so unit tests stay fast.
  if (!fetcher)
    plugins.push(rateLimitPlugin({ minTime: 400 }))

  const client = createWfmApiClient({
    fetcher: fetcher ?? marketFetcher,
    language: 'zh-hans',
    timeoutMs: 10_000,
    plugins,
  })
  const getOrders = client.rivens.getOrders
  return {
    ...client,
    rivens: {
      ...client.rivens,
      getOrders: async (weaponUrlName, options) => {
        try {
          return await getOrders(weaponUrlName, options)
        }
        catch {
          // v1 unwraps payload.auctions after the soft-fail request plugin.
          return undefined
        }
      },
    },
  }
}

export const wfmClient = createPluginWfmClient()
