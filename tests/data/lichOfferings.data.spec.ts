import type { LichRotation } from '../../src/warframe/types/wf/lich-offerings'
import { expect } from 'chai'
import { vi } from 'vitest'
import { getVendorReports } from '../../src/warframe/data/wf/lichOfferings'
import * as wiki from '../../src/warframe/infrastructure/apis/warframe-wiki'
import * as tracker from '../../src/warframe/infrastructure/apis/warframetr'

describe('vendor report caches', () => {
  afterEach(() => vi.restoreAllMocks())

  it('shares concurrent requests, refreshes reports after five minutes, and replaces history at reset', async () => {
    const start = Date.parse('2026-11-24T00:00:00Z')
    const expiresAt = Date.parse('2026-11-28T00:00:00Z')
    const clock = vi.spyOn(Date, 'now').mockReturnValue(start)
    const rotation: LichRotation = { family: 'coda', batch: 'A', start, expiresAt, roster: [] }
    const report = { updatedAt: new Date(start).toISOString(), offers: { 'Coda Hema': { percent: 60, damage: 'heat' } } }
    const primary = vi.spyOn(tracker, 'fetchTrackerOffers').mockResolvedValueOnce(report).mockResolvedValue(undefined)
    const history = vi.spyOn(wiki, 'fetchWikiBaseline').mockResolvedValue({ revid: 10, offers: {} })
    const latest = vi.spyOn(wiki, 'fetchWikiOffers').mockResolvedValueOnce({ revid: 11, offers: report.offers }).mockResolvedValue(undefined)

    const [first, second] = await Promise.all([getVendorReports(rotation), getVendorReports(rotation)])
    expect(latest.mock.calls).to.have.length(0)
    await Promise.all([first.getWiki(), second.getWiki()])
    expect(latest.mock.calls).to.have.length(1)
    expect(primary.mock.calls).to.have.length(1)

    clock.mockReturnValue(start + 300_000)
    const fallback = await getVendorReports(rotation)
    expect(fallback.tracker).to.equal(report)
    expect((await fallback.getWiki())?.revid).to.equal(11)
    expect(latest.mock.calls).to.have.length(2)
    expect(history.mock.calls).to.have.length(1)

    const updated = { ...report, offers: { 'Coda Hema': { percent: 55, damage: 'cold' } } }
    primary.mockResolvedValueOnce(updated)
    expect((await getVendorReports(rotation)).tracker).to.equal(updated)

    clock.mockReturnValue(expiresAt)
    const next = await getVendorReports({ ...rotation, batch: 'B', start: expiresAt, expiresAt: expiresAt + (expiresAt - start) })
    expect(next.tracker).to.equal(undefined)
    expect(await next.getWiki()).to.equal(undefined)
    expect(history.mock.calls).to.deep.equal([['coda', start, 'A'], ['coda', expiresAt, 'B']])
  })
})
