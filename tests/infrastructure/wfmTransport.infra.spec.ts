import { expect } from 'chai'
import { afterEach, beforeEach, vi } from 'vitest'
import { createPluginWfmClient } from '../../src/warframe/infrastructure/wfm-client'
import * as http from '../../src/warframe/utils/http'

describe('wfm production transport policy', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-31T00:00:00Z'))
    // No production request should fall back to global HTTP/1 fetch in this suite.
    vi.stubGlobal('fetch', async () => {
      throw new Error('Unexpected HTTP/1 request')
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('spaces cache misses by at least one second and serves cache hits immediately', async () => {
    const starts: number[] = []
    const urls: string[] = []
    vi.spyOn(http, 'fetchHttp2Text').mockImplementation(async (url, options) => {
      starts.push(Date.now())
      urls.push(url)
      expect(options?.headers).to.include({
        'User-Agent': 'koishi-plugin-warframe (+https://github.com/CloudeaSoft/koishi-plugin-warframe)',
        'Language': 'zh-hans',
      })
      expect(options?.timeoutMs).to.equal(20_000)
      return { status: 200, body: '{"data":[]}' }
    })
    const client = createPluginWfmClient()
    const requests = [client.items.list(), client.rivens.listWeapons(), client.orders.listByItem({ slug: 'primed_flow' })]
    await vi.advanceTimersByTimeAsync(0)
    expect(starts).to.have.length(1)
    expect(await client.items.list()).to.deep.equal([])
    await vi.advanceTimersByTimeAsync(999)
    expect(starts).to.have.length(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(starts).to.have.length(2)
    await vi.advanceTimersByTimeAsync(1000)
    expect(await Promise.all(requests)).to.deep.equal([[], [], []])
    expect(starts.map(t => t - starts[0])).to.deep.equal([0, 1000, 2000])
    expect(urls).to.deep.equal([
      'https://api.warframe.market/v2/items',
      'https://api.warframe.market/v2/riven/weapons',
      'https://api.warframe.market/v2/orders/item/primed_flow',
    ])
  })

  for (const response of [undefined, { status: 403, body: 'challenge' }, { status: 200, body: 'invalid JSON' }]) {
    it(`does not cache ${response?.status ?? 'network'} failures or bypass spacing after failure`, async () => {
      const starts: number[] = []
      vi.spyOn(http, 'fetchHttp2Text').mockImplementation(async () => {
        starts.push(Date.now())
        return starts.length === 1 ? response : { status: 200, body: '{"data":[{"id":"recovered"}]}' }
      })
      const client = createPluginWfmClient()
      expect(await client.items.list()).to.equal(undefined)
      const retry = client.items.list()
      await vi.advanceTimersByTimeAsync(999)
      expect(starts).to.have.length(1)
      await vi.advanceTimersByTimeAsync(1)
      expect(await retry).to.deep.equal([{ id: 'recovered' }])
      expect(starts[1] - starts[0]).to.equal(1000)
    })
  }
})
