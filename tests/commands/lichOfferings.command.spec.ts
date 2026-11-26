import type { Element, Plugin } from 'koishi'
import { readFileSync } from 'node:fs'
import mock from '@koishijs/plugin-mock'
import { expect } from 'chai'
import { App } from 'koishi'
import { vi } from 'vitest'
import { setupCommands } from '../../src/commands'
import * as http from '../../src/warframe/utils/http'
import coda from '../assets/lich-offerings/coda.json'
import tenet from '../assets/lich-offerings/tenet.json'

describe('vendor valence commands', () => {
  const app = new App()
  const adapter = app.plugin(mock as Plugin.Object)
  const client = app.mock.client('vendor-shopper')
  let card = ''
  setupCommands(app, {
    config: { developerMode: false, channelIds: {} },
    logger: app.logger('valence-test'),
    render: async (element: Element) => {
      card = element.toString()
      return 'rendered'
    },
  })

  beforeAll(() => app.start())
  afterEach(() => vi.restoreAllMocks())
  afterAll(async () => {
    await adapter.dispose()
    await app.stop()
  })

  for (const [alias, vendor] of [
    ['信条', 'Ergo Glast'],
    ['c玄骸', 'Ergo Glast'],
    ['tenet', 'Ergo Glast'],
    ['终幕', 'Eleanor'],
    ['i玄骸', 'Eleanor'],
    ['coda', 'Eleanor'],
  ]) {
    it(`routes ${alias} to ${vendor}`, async () => {
      vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-10-01T12:00:00Z'))
      vi.spyOn(http, 'fetchAsyncData').mockResolvedValue(undefined)
      await client.shouldReply(alias, 'rendered')
      expect(card).to.include(vendor)
    })
  }

  it('renders the five Tenet offers, their source and a live countdown', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-11-26T12:00:00Z'))
    const fetch = vi.spyOn(http, 'fetchAsyncData').mockResolvedValue(tenet)
    await client.shouldReply('lichc', 'rendered')
    expect(card).to.include('信条·枢密').and.include('冲击').and.include('54.1%')
    expect(card.match(/\d+(?:\.\d+)?%/g)).to.have.length(5)
    expect(card).to.include('WarframeTR').and.include('12小时')
    await client.shouldReply('信条数值', 'rendered')
    expect(fetch.mock.calls[0]).to.deep.equal(['https://warframetr.com/api/warframe/tenet'])
    expect(fetch.mock.calls).to.have.length(2)
  })

  it('switches Coda batches exactly at reset and discards cached rolls', async () => {
    const reset = Date.parse('2026-11-28T00:00:00Z')
    const clock = vi.spyOn(Date, 'now').mockReturnValue(reset - 1000)
    const fetch = vi.spyOn(http, 'fetchAsyncData').mockResolvedValue(coda)
    await client.shouldReply('lich-i', 'rendered')
    expect(card).to.include('终幕·血肢').and.include('31.4%').and.include('1秒')
    expect(card).to.not.include('终幕·啐沫者')
    clock.mockReturnValue(reset)
    const content = readFileSync(new URL('../assets/lich-offerings/coda.wiki.txt', import.meta.url), 'utf8')
    fetch.mockResolvedValueOnce(coda).mockResolvedValue({
      query: { pages: [{ revisions: [{ timestamp: new Date(reset).toISOString(), slots: { main: { content } } }] }] },
    })
    await client.shouldReply('终幕数值', 'rendered')
    expect(card).to.include('终幕·啐沫者').and.include('31.5%').and.include('4天')
    expect(card).to.include('WARFRAME Wiki').and.not.include('终幕·血肢')
  })

  it('falls back to the Wiki for a malformed Tenet offer', async () => {
    const timestamp = '2026-12-01T08:00:00Z'
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse(timestamp))
    const content = readFileSync(new URL('../assets/lich-offerings/tenet.wiki.txt', import.meta.url), 'utf8')
    vi.spyOn(http, 'fetchAsyncData')
      .mockResolvedValue(undefined)
      .mockResolvedValueOnce({ ...tenet, updatedAt: timestamp, offers: { ...tenet.offers, 'Tenet Exec': { percent: null, damage: 'cold' } } })
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ query: { pages: [{ revisions: [{ timestamp, slots: { main: { content } } }] }] } })
    await client.shouldReply('lich-c', 'rendered')
    expect(card).to.include('WarframeTR').and.include('WARFRAME Wiki').and.include('信条·枢密').and.include('54.1%')
  })

  it('still shows the scheduled Coda roster when no current bonuses are reported', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-12-02T00:00:00Z'))
    vi.spyOn(http, 'fetchAsyncData').mockResolvedValue(undefined)
    await client.shouldReply('lichi', 'rendered')
    expect(card).to.include('终幕·血肢').and.include('暂无本期加成上报').and.include('4天')
    expect(card).to.not.include('false')
    expect(card).to.not.match(/\d%/)
  })

  it('withholds unchanged rolls when the mirror refreshes before players update the table', async () => {
    const now = '2026-12-06T02:00:00Z'
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse(now))
    const content = readFileSync(new URL('../assets/lich-offerings/coda.wiki.txt', import.meta.url), 'utf8')
    vi.spyOn(http, 'fetchAsyncData')
      .mockResolvedValue(undefined)
      .mockResolvedValueOnce({ ...coda, updatedAt: now })
      .mockResolvedValueOnce({ query: { pages: [{ revisions: [{ timestamp: '2026-12-05T16:00:00Z', slots: { main: { content } } }] }] } })
    await client.shouldReply('lichi', 'rendered')
    expect(card).to.include('终幕·啐沫者').and.include('暂无本期加成上报')
    expect(card).to.not.include('31.5%')
  })
})
