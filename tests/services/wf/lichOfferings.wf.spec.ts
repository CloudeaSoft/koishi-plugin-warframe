import type { LichWeaponFamily } from '../../../src/warframe'
import { expect } from 'chai'
import { vi } from 'vitest'
import * as data from '../../../src/warframe/data/wf/lichOfferings'
import { getLichOfferings } from '../../../src/warframe/services/wf-service/wf-service.lich-offerings'
import tenet from '../../assets/lich-offerings/tenet.json'

async function offerings(family: LichWeaponFamily) {
  const result = await getLichOfferings(family)
  if (!result.ok) {
    throw new Error(result.error.code)
  }
  return result.data
}

describe('vendor offerings service', () => {
  const now = Date.parse('2026-11-26T12:00:00Z')
  beforeEach(() => vi.spyOn(Date, 'now').mockReturnValue(now))
  afterEach(() => vi.restoreAllMocks())

  it('keeps valid tracker rows and fills only missing or invalid bonuses from newer Wiki edits', async () => {
    const offers = { ...tenet.offers, 'Tenet Exec': { damage: 'impact', percent: 61 } }
    vi.spyOn(data, 'getVendorReports').mockResolvedValue({
      tracker: { updatedAt: tenet.updatedAt, offers },
      baseline: { revid: 40, offers: { 'Tenet Ferrox': tenet.offers['Tenet Ferrox'] } },
      getWiki: async () => ({ revid: 41, offers: tenet.offers, getEditTime: async () => undefined }),
    })
    const { weapons } = await offerings('tenet')
    expect(weapons).to.have.length(5)
    expect(weapons.find(w => w.name === '信条·铁晶磁轨炮')?.bonus).to.equal(undefined)
    expect(weapons.find(w => w.name === '信条·枢密')?.bonus).to.deep.equal({
      element: '冲击',
      percent: 54.1,
      source: 'WARFRAME Wiki',
      compared: false,
    })
    expect(weapons.filter(w => w.bonus?.source === 'WarframeTR')).to.have.length(3)
  })

  it('withholds previous rolls even when the mirror refreshes during the rotation', async () => {
    vi.spyOn(data, 'getVendorReports').mockResolvedValue({
      tracker: tenet,
      baseline: { revid: 40, offers: tenet.offers },
      getWiki: async () => ({ revid: 40, offers: { 'Tenet Exec': { damage: 'heat', percent: 60 } }, getEditTime: async () => undefined }),
    })
    expect((await offerings('tenet')).weapons.every(w => !w.bonus)).to.equal(true)
  })

  it('requires a current edit timestamp when history is unavailable', async () => {
    const snapshot = vi.spyOn(data, 'getVendorReports')
    for (const [updatedAt, count] of [['2026-11-22T23:59:59Z', 0], [tenet.updatedAt, 5]] as const) {
      snapshot.mockResolvedValue({ getWiki: async () => ({ revid: 42, offers: tenet.offers, getEditTime: async () => updatedAt }) })
      expect((await offerings('tenet')).weapons.filter(w => w.bonus)).to.have.length(count)
    }
  })

  it('returns the new Coda batch when an in-flight request crosses reset', async () => {
    const reset = Date.parse('2026-11-28T00:00:00Z')
    const clock = vi.spyOn(Date, 'now').mockReturnValue(reset - 1)
    const reports = vi.spyOn(data, 'getVendorReports').mockImplementation(async () => {
      clock.mockReturnValue(reset)
      return { getWiki: async () => undefined }
    })
    const board = await offerings('coda')
    expect(reports.mock.calls.map(([rotation]) => rotation.batch)).to.deep.equal(['A', 'B'])
    expect(board.batch).to.equal('B')
    expect(board.expiresAt).to.equal(Date.parse('2026-12-02T00:00:00Z'))
    expect(board.weapons.map(w => w.name)).to.include('终幕·啐沫者').and.not.include('终幕·血肢')
    expect(board.weapons).to.have.length(7)
  })
})
