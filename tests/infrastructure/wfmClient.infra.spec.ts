import type { WfmFetcher, WfmFetchInput, WfmFetchResult } from 'wfm-api-client'
import { expect } from 'chai'
import { ItemOrderComponent } from '../../src/components/wfm'
import { createPluginWfmClient, onWfmRequestError } from '../../src/warframe/infrastructure/wfm-client'

function jsonResult(data: unknown, status = 200): WfmFetchResult {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: async () => data,
    text: async () => JSON.stringify(data),
  }
}

describe('createPluginWfmClient', () => {
  it('maps items.list through the upstream client and caches within TTL', async () => {
    let calls = 0
    const fetcher: WfmFetcher = async (input: WfmFetchInput) => {
      calls++
      expect(input.url).to.include('/v2/items')
      return jsonResult({
        data: [{
          id: '1',
          slug: 'primed_flow',
          gameRef: '/Lotus/Upgrades/Mods/PrimedFlow',
          tags: ['mod'],
        }],
      })
    }

    const client = createPluginWfmClient(fetcher)

    const first = await client.items.list()
    const second = await client.items.list()

    expect(first?.[0]?.slug).to.equal('primed_flow')
    expect(second?.[0]?.slug).to.equal('primed_flow')
    expect(calls).to.equal(1)
  })

  it('maps upstream failures to undefined via softFailPlugin', async () => {
    const fetcher: WfmFetcher = async () => {
      throw new Error('network down')
    }

    const client = createPluginWfmClient(fetcher)
    const result = await client.items.list()
    expect(result).to.equal(undefined)
  })

  it('routes item orders through orders.listByItem', async () => {
    const urls: string[] = []
    const fetcher: WfmFetcher = async (input) => {
      urls.push(input.url)
      return jsonResult({ data: [] })
    }

    const client = createPluginWfmClient(fetcher)
    await client.orders.listByItem({ slug: 'primed_flow' })
    expect(urls.some(url => url.includes('primed_flow'))).to.equal(true)
  })

  it('accepts item and order responses without optional market fields', async () => {
    const fetcher: WfmFetcher = async (input) => {
      if (input.url.includes('/orders/item/')) {
        return jsonResult({
          data: [{
            id: 'order-1',
            platinum: 10,
            quantity: 1,
            rank: 0,
            type: 'sell',
            visible: true,
            updated_at: '2026-01-01T00:00:00.000Z',
          }],
        })
      }

      return jsonResult({
        data: [{
          id: 'item-1',
          slug: 'primed_flow',
          gameRef: '/Lotus/Upgrades/Mods/PrimedFlow',
          tags: ['mod'],
        }],
      })
    }
    const client = createPluginWfmClient(fetcher)

    const items = await client.items.list()
    const orders = await client.orders.listByItem({ slug: 'primed_flow' })

    expect(() => ItemOrderComponent(items![0]!, orders!)).not.to.throw()
  })
})

describe('market HTTP transport', () => {
  const originalFetch = globalThis.fetch
  let dispose: (() => void) | undefined

  afterEach(() => {
    globalThis.fetch = originalFetch
    dispose?.()
    dispose = undefined
  })

  it('identifies the application and preserves v1/v2 parsing and request context', async () => {
    const requests: { url: string, headers: Headers, signal?: AbortSignal | null }[] = []
    globalThis.fetch = async (input, init) => {
      const url = String(input)
      requests.push({ url, headers: new Headers(init?.headers), signal: init?.signal })
      return Response.json(url.includes('/v1/')
        ? { payload: { auctions: [{ id: 'riven-1' }] } }
        : { apiVersion: '0.25.0', data: [{ id: 'weapon-1', slug: 'akarius' }], error: null })
    }

    const client = createPluginWfmClient()
    const weapons = await client.rivens.listWeapons({ language: 'en', platform: 'pc', crossplay: true })
    const orders = await client.rivens.getOrders('akarius', { positiveStats: ['critical_chance'] })

    expect(weapons?.[0].slug).to.equal('akarius')
    expect(orders?.[0].id).to.equal('riven-1')
    for (const request of requests) {
      expect(request.headers.get('user-agent')).to.equal('koishi-plugin-warframe (+https://github.com/CloudeaSoft/koishi-plugin-warframe)')
      expect(request.headers.get('accept')).to.equal('application/json')
      expect(request.signal).to.be.instanceOf(AbortSignal)
    }
    expect(requests[0].headers.get('language')).to.equal('en')
    expect(requests[0].headers.get('platform')).to.equal('pc')
    expect(requests[0].headers.get('crossplay')).to.equal('true')
    expect(requests[1].headers.get('language')).to.equal('zh-hans')
    expect(new URL(requests[1].url).searchParams.get('positive_stats')).to.equal('critical_chance')
  })

  it('reports Cloudflare challenges and allows a later request to recover', async () => {
    const errors: unknown[] = []
    let calls = 0
    globalThis.fetch = async () => ++calls === 1
      ? new Response('<html>Just a moment...</html>', { status: 403, headers: { 'cf-mitigated': 'challenge' } })
      : Response.json({ data: [{ slug: 'akarius' }] })
    dispose = onWfmRequestError((_url, error) => errors.push(error))

    const client = createPluginWfmClient()
    expect(await client.rivens.listWeapons()).to.equal(undefined)
    expect((await client.rivens.listWeapons())?.[0].slug).to.equal('akarius')
    expect(errors).to.have.length(1)
    const error = errors[0] as Error & { cause: Error & { status: number } }
    expect(error.cause.message).to.include('Cloudflare')
    expect(error.cause.status).to.equal(403)
    expect(calls).to.equal(2)
  })

  it('retains network error causes for logging and supports unsubscribing', async () => {
    const networkError = new TypeError('fetch failed', { cause: Object.assign(new Error('DNS lookup failed'), { code: 'EAI_AGAIN' }) })
    globalThis.fetch = async () => {
      throw networkError
    }
    const errors: unknown[] = []
    const urls: string[] = []
    dispose = onWfmRequestError((url, error) => {
      urls.push(url)
      errors.push(error)
    })

    const client = createPluginWfmClient()
    expect(await client.rivens.listWeapons()).to.equal(undefined)
    expect((errors[0] as Error).cause).to.equal(networkError)
    expect(urls).to.deep.equal(['https://api.warframe.market/v2/riven/weapons'])
    dispose()
    expect(await client.rivens.listWeapons()).to.equal(undefined)
    expect(errors).to.have.length(1)
  })
})
