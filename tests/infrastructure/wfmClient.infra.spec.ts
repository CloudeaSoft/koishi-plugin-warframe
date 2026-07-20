import type { WfmFetchInput, WfmFetchResult, WfmFetcher } from 'wfm-api-client'
import { expect } from 'chai'
import { createPluginWfmClient } from '../../src/warframe/infrastructure/wfm-client'

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

    const client = createPluginWfmClient({
      fetcher,
      rateLimit: false,
    })

    const first = await client.items.list()
    const second = await client.items.list()

    expect(first?.[0]?.slug).to.equal('primed_flow')
    expect(second?.[0]?.slug).to.equal('primed_flow')
    expect(calls).to.equal(1)
  })

  it('returns undefined when upstream throws / fails', async () => {
    const fetcher: WfmFetcher = async () => {
      throw new Error('network down')
    }

    const client = createPluginWfmClient({
      fetcher,
      rateLimit: false,
      cache: false,
    })

    const result = await client.items.list()
    expect(result).to.equal(undefined)
  })

  it('routes item orders through orders.listByItem', async () => {
    const urls: string[] = []
    const fetcher: WfmFetcher = async (input) => {
      urls.push(input.url)
      return jsonResult({ data: [] })
    }

    const client = createPluginWfmClient({
      fetcher,
      rateLimit: false,
      cache: false,
    })

    await client.orders.listByItem({ slug: 'primed_flow' })
    expect(urls.some(url => url.includes('primed_flow'))).to.equal(true)
  })
})
