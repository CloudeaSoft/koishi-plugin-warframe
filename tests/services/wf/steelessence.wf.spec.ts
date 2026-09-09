import { expect } from 'chai'
import { dict_zh } from 'warframe-public-export-plus'
import { t } from '../../../src/i18n'
import { dictZhExtra } from '../../../src/warframe/assets'
import { getSteelPathCatalogs } from '../../../src/warframe/infrastructure/wf/wfcd-adapter'
import { adaptSteelEssence, getSteelEssenceFrom } from '../../../src/warframe/services'
import { msToHumanReadable } from '../../../src/warframe/utils/time'

const NOW = Date.parse('2026-08-25T09:00:00Z')
const WEEK = 7 * 24 * 3_600_000
const TESHIN_KEY = '/Lotus/Language/Bosses/Teshin'
const ESSENCE_KEY = '/Lotus/Language/Resources/SteelEssence'

function officialZh(key: string): string {
  const text = dict_zh[key] ?? dictZhExtra[key]
  expect(text, key).to.be.a('string').and.not.equal(key)
  return text
}

function parsedOfferings(
  currentName: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    currentReward: { name: currentName, cost: 150 },
    activation: new Date(NOW - 24 * 3_600_000),
    expiry: new Date(NOW + WEEK),
    rotation: [],
    ...overrides,
  }
}

describe('adaptSteelEssence', () => {
  it('translates the English current reward into official Chinese', async () => {
    const catalogs = await getSteelPathCatalogs()
    const board = await adaptSteelEssence(parsedOfferings('Umbra Forma Blueprint'), NOW)

    expect(board.title).to.equal(`${officialZh(TESHIN_KEY)} · ${officialZh(ESSENCE_KEY)}商店`)
    expect(board.costLabel).to.equal(officialZh(ESSENCE_KEY))
    expect(board.current).to.deep.equal(catalogs.zh.rotation[0])
    expect(board.upcoming).to.deep.equal([
      ...catalogs.zh.rotation.slice(1),
    ])
    expect(board.remaining).to.equal(msToHumanReadable(WEEK))
  })

  it('wraps upcoming rewards from the current index', async () => {
    const catalogs = await getSteelPathCatalogs()
    const last = catalogs.en.rotation[catalogs.en.rotation.length - 1]
    if (!last) {
      expect.fail('English steel essence rotation is empty')
      return
    }
    const board = await adaptSteelEssence(parsedOfferings(last.name), NOW)

    expect(board.current).to.deep.equal(catalogs.zh.rotation[catalogs.zh.rotation.length - 1])
    expect(board.upcoming[0]).to.deep.equal(catalogs.zh.rotation[0])
    expect(board.upcoming).to.have.length(catalogs.zh.rotation.length - 1)
  })

  it('falls back to the epoch rotation index when the name is unknown', async () => {
    const catalogs = await getSteelPathCatalogs()
    const board = await adaptSteelEssence(parsedOfferings('Not A Real Honor'), NOW)

    expect(board.current).to.deep.equal(catalogs.zh.rotation[5])
    expect(board.upcoming[0]).to.deep.equal(catalogs.zh.rotation[6])
  })
})

describe('getSteelEssenceFrom', () => {
  it('returns the adapted board from a worldstate snapshot', async () => {
    const catalogs = await getSteelPathCatalogs()
    const result = await getSteelEssenceFrom({
      raw: { steelPath: parsedOfferings('50,000 Kuva') },
    }, NOW)

    expect(result.ok).to.equal(true)
    if (!result.ok) {
      return
    }

    expect(result.data.current).to.deep.equal(catalogs.zh.rotation[1])
    expect(result.data.expiry).to.equal(NOW + WEEK)
  })

  it('fails when steelPath is missing', async () => {
    const result = await getSteelEssenceFrom({ raw: {} }, NOW)
    expect(result.ok).to.equal(false)
    if (result.ok) {
      return
    }

    expect(result.error.code).to.equal('steelEssence.unavailable')
    expect(t(result)).to.equal('钢铁精华商店获取失败')
  })

  it('fails when the current rotation has expired', async () => {
    const result = await getSteelEssenceFrom({
      raw: { steelPath: parsedOfferings('Umbra Forma Blueprint', { expiry: new Date(NOW) }) },
    }, NOW)
    expect(result.ok).to.equal(false)
    if (result.ok) {
      return
    }

    expect(result.error.code).to.equal('steelEssence.unavailable')
  })

  it('fails with common.fetchFailed when worldstate cannot be loaded', async () => {
    const result = await getSteelEssenceFrom()
    expect(result.ok).to.equal(false)
    if (result.ok) {
      return
    }

    expect(result.error.code).to.equal('common.fetchFailed')
    expect(result.error.retryable).to.equal(true)
  })
})
