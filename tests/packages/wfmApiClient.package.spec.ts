import type { WfmFetcher } from '../../packages/wfm-api-client/src/types'
import { expect } from 'chai'
import { createWfmApiClient } from '../../packages/wfm-api-client/src/index'

describe('wfm-api-client package', () => {
  it('fetches item list through the injected transport', async () => {
    const urls: string[] = []
    const fetcher: WfmFetcher = async <T>(url: string) => {
      urls.push(url)
      return {
        data: [
          {
            id: '1',
            slug: 'primed_flow',
            gameRef: '/Lotus/Upgrades/Mods/PrimedFlow',
            tags: ['mod'],
            i18n: { 'zh-hans': { name: '川流不息 Prime' } },
            maxRank: 10,
            maxCharges: 0,
            vaulted: false,
            ducats: 0,
            amberStars: 0,
            cyanStars: 0,
            baseEndo: 0,
            endoMultiplier: 0,
            subtypes: [],
          },
        ],
      } as T
    }
    const client = createWfmApiClient({
      cache: false,
      rateLimit: false,
      fetcher,
    })

    const result = await client.items.getList()

    expect(urls).to.deep.equal(['https://api.warframe.market/v2/items'])
    expect(result?.[0]?.slug).to.equal('primed_flow')
  })

  it('honors endpoint cache ttl configuration', async () => {
    let fetchCount = 0
    const fetcher: WfmFetcher = async <T>() => {
      fetchCount++
      return { data: [] } as T
    }
    const client = createWfmApiClient({
      rateLimit: false,
      cache: { orderListTtl: 0 },
      fetcher,
    })

    await client.items.getOrders('primed_flow')
    await client.items.getOrders('primed_flow')

    expect(fetchCount).to.equal(2)
  })
})
