import { readFileSync } from 'node:fs'
import { expect } from 'chai'
import { vi } from 'vitest'
import { fetchWikiBaseline, fetchWikiEditTime, fetchWikiOffers } from '../../src/warframe/infrastructure/apis/warframe-wiki'
import { fetchTrackerOffers } from '../../src/warframe/infrastructure/apis/warframetr'
import * as http from '../../src/warframe/utils/http'
import coda from '../assets/lich-offerings/coda.json'
import tenet from '../assets/lich-offerings/tenet.json'

describe('vendor data source adapters', () => {
  afterEach(() => vi.restoreAllMocks())

  it('reads the Tenet inventory and the requested Coda batch from WarframeTR', async () => {
    const fetch = vi.spyOn(http, 'fetchAsyncData').mockResolvedValueOnce(tenet).mockResolvedValueOnce(coda)
    expect(await fetchTrackerOffers('tenet')).to.deep.equal({ updatedAt: tenet.updatedAt, offers: tenet.offers })
    expect(await fetchTrackerOffers('coda', 'B')).to.deep.equal({ updatedAt: coda.updatedAt, offers: coda.batches.B })
    expect(fetch.mock.calls.map(([url]) => url)).to.deep.equal([
      'https://warframetr.com/api/warframe/tenet',
      'https://warframetr.com/api/warframe/coda',
    ])
  })

  it('parses the requested Wiki batch and dates the exact parsed revision', async () => {
    const content = readFileSync(new URL('../assets/lich-offerings/coda.wiki.txt', import.meta.url), 'utf8')
    const timestamp = '2026-11-28T00:00:00Z'
    const fetch = vi.spyOn(http, 'fetchAsyncData')
      .mockResolvedValueOnce({ parse: { revid: 42, wikitext: { '*': content } } })
      .mockResolvedValueOnce({ query: { pages: [{ revisions: [{ revid: 42, timestamp }] }] } })
    expect(await fetchWikiOffers('coda', 'B')).to.deep.equal({ revid: 42, offers: coda.batches.B })
    expect(await fetchWikiEditTime(42)).to.equal(timestamp)
    const parse = new URL(fetch.mock.calls[0][0]).searchParams
    expect([parse.get('action'), parse.get('page'), parse.get('prop')]).to.deep.equal(['parse', 'Coda Weapons', 'wikitext|revid'])
    expect(new URL(fetch.mock.calls[1][0]).searchParams.get('revids')).to.equal('42')
  })

  it('reads Tenet weapon templates from the last revision strictly before reset', async () => {
    const content = readFileSync(new URL('../assets/lich-offerings/tenet.wiki.txt', import.meta.url), 'utf8')
    const timestamp = '2026-11-26T23:59:59.000Z'
    const start = Date.parse(timestamp) + 1000
    const fetch = vi.spyOn(http, 'fetchAsyncData').mockResolvedValue({
      query: { pages: [{ revisions: [{ revid: 39, timestamp, slots: { main: { content } } }] }] },
    })
    expect(await fetchWikiBaseline('tenet', start)).to.deep.equal({ revid: 39, offers: tenet.offers })
    const params = new URL(fetch.mock.calls[0][0]).searchParams
    expect([params.get('titles'), params.get('rvstart')]).to.deep.equal(['Tenet Weapons', timestamp])
    expect(await fetchWikiBaseline('tenet', Date.parse(timestamp))).to.equal(undefined)
  })
})
