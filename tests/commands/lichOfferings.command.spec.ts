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

function wikiRevision(revid: number, timestamp: string, content?: string) {
  const revision = { revid, timestamp, slots: content === undefined ? undefined : { main: { content } } }
  return { query: { pages: [{ revisions: [revision] }] } }
}

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
    fetch
      .mockResolvedValueOnce(coda)
      .mockResolvedValueOnce(wikiRevision(40, new Date(reset - 1000).toISOString(), content.replace('31.5', '30.5')))
      .mockResolvedValueOnce({ parse: { revid: 41, wikitext: { '*': content } } })
    await client.shouldReply('终幕数值', 'rendered')
    expect(card).to.include('终幕·啐沫者').and.include('31.5%').and.include('4天')
    expect(card).to.include('WARFRAME Wiki').and.not.include('终幕·血肢')
    expect(card).to.not.include('32.7%')
    const wikiUrl = new URL(fetch.mock.calls.at(-1)![0])
    expect(wikiUrl.searchParams.get('action')).to.equal('parse')
    expect(wikiUrl.searchParams.get('page')).to.equal('Coda Weapons')
    expect(wikiUrl.searchParams.get('prop')).to.equal('wikitext|revid')

    fetch.mockClear()
    clock.mockReturnValue(reset + 300_000)
    fetch.mockResolvedValueOnce(coda).mockResolvedValueOnce({ parse: { revid: 40, wikitext: { '*': content } } })
    await client.shouldReply('终幕数值', 'rendered')
    expect(card).to.include('暂无本期加成上报')
    expect(fetch.mock.calls).to.have.length(2)
  })

  it('falls back to the Wiki for a malformed Tenet offer', async () => {
    const timestamp = '2026-12-01T08:00:00Z'
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse(timestamp))
    const content = readFileSync(new URL('../assets/lich-offerings/tenet.wiki.txt', import.meta.url), 'utf8')
    const fetch = vi.spyOn(http, 'fetchAsyncData')
      .mockResolvedValue(undefined)
      .mockResolvedValueOnce({ ...tenet, updatedAt: timestamp, offers: { ...tenet.offers, 'Tenet Exec': { percent: null, damage: 'cold' } } })
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ parse: { revid: 42, wikitext: { '*': content } } })
      .mockResolvedValueOnce(wikiRevision(42, timestamp))
    await client.shouldReply('lich-c', 'rendered')
    expect(card).to.include('WarframeTR').and.include('WARFRAME Wiki').and.include('信条·枢密').and.include('54.1%')
    expect(new URL(fetch.mock.calls[2][0]).searchParams.get('page')).to.equal('Tenet Weapons')
    expect(new URL(fetch.mock.calls[3][0]).searchParams.get('revids')).to.equal('42')
  })

  it('rejects a pre-reset Wiki edit when the baseline is unavailable', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2026-11-27T01:00:00Z'))
    const content = readFileSync(new URL('../assets/lich-offerings/tenet.wiki.txt', import.meta.url), 'utf8')
    vi.spyOn(http, 'fetchAsyncData')
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ parse: { revid: 39, wikitext: { '*': content } } })
      .mockResolvedValueOnce(wikiRevision(39, '2026-11-26T23:59:59Z'))
    await client.shouldReply('tenet', 'rendered')
    expect(card).to.include('暂无本期加成上报').and.not.include('54.1%')
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
      .mockResolvedValueOnce(wikiRevision(38, '2026-12-05T16:00:00Z', content))
    await client.shouldReply('lichi', 'rendered')
    expect(card).to.include('终幕·啐沫者').and.include('暂无本期加成上报')
    expect(card).to.not.include('31.5%')
  })
})
