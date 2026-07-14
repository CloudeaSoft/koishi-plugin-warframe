import { expect } from 'chai'
import { createWfmApiClient } from '../../packages/wfm-api-client/src/index'

describe('wfm-api-client package', () => {
  it('fetches item list through the injected transport', async () => {
    const urls: string[] = []
    const client = createWfmApiClient({
      cache: false,
      rateLimit: false,
      fetcher: async (url) => {
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
        }
      },
    })

    const result = await client.items.getList()

    expect(urls).to.deep.equal(['https://api.warframe.market/v2/items'])
    expect(result?.[0]?.slug).to.equal('primed_flow')
  })

  it('honors endpoint cache ttl configuration', async () => {
    let fetchCount = 0
    const client = createWfmApiClient({
      rateLimit: false,
      cache: { orderListTtl: 0 },
      fetcher: async () => {
        fetchCount++
        return { data: [] }
      },
    })

    await client.items.getOrders('primed_flow')
    await client.items.getOrders('primed_flow')

    expect(fetchCount).to.equal(2)
  })
})
