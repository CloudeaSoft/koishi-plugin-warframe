import type { WfmFetcher, WfmFetchInput, WfmFetchResult } from 'wfm-api-client'
import { expect } from 'chai'
import { ItemOrderComponent } from '../../src/components/wfm'
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
