import type {
  WfmApiClient,
  WfmFetcher,
  WfmPlugin,
  WfmRequestNext,
} from 'wfm-api-client'
import {
  createWfmApiClient,
  memoryCachePlugin,
  rateLimitPlugin,
} from 'wfm-api-client'

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

/** `fetcher` is a test injection seam only; production uses the client default. */
export function createPluginWfmClient(fetcher?: WfmFetcher): WfmApiClient {
  // Plugin array order is outer -> inner (client uses reduceRight).
  // softFail must stay outermost so failures are not stored by memoryCache.
  const plugins: WfmPlugin[] = [
    softFailPlugin(),
    memoryCachePlugin({ maxSize: 1024, ttl: 60 }),
  ]

  // Skip rate limiting when a mock fetcher is injected so unit tests stay fast.
  if (!fetcher)
    plugins.push(rateLimitPlugin({ minTime: 400 }))

  return createWfmApiClient({
    fetcher,
    language: 'zh-hans',
    timeoutMs: 10_000,
    plugins,
  })
}

export const wfmClient = createPluginWfmClient()
