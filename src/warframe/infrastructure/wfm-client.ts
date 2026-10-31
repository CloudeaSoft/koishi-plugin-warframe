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
} from 'wfm-api-client'
import { fetchHttp2Text } from '../utils/http'

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
        catch {
          return undefined
        }
      }
    },
  }
}

const http2Fetcher: WfmFetcher = async ({ url, ...options }) => {
  const response = await fetchHttp2Text(url, { ...options, timeoutMs: 20_000 })
  if (!response)
    throw new Error('WFM HTTP/2 request failed')
  return {
    status: response.status,
    ok: response.status >= 200 && response.status < 300,
    json: async () => JSON.parse(response.body) as unknown,
    text: async () => response.body,
  }
}

/** `fetcher` is a test injection seam; production buffers HTTP/2 responses. */
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
    plugins.push(rateLimitPlugin({ minTime: 1000 }))

  const client = createWfmApiClient({
    fetcher: fetcher ?? http2Fetcher,
    userAgent: 'koishi-plugin-warframe (+https://github.com/CloudeaSoft/koishi-plugin-warframe)',
    language: 'zh-hans',
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
