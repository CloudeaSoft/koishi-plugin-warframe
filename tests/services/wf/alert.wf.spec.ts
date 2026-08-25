import { expect } from 'chai'
import { dict_zh, ExportRegions } from 'warframe-public-export-plus'
import { t } from '../../../src/i18n'
import { dictZhExtra } from '../../../src/warframe/assets'
import { resolveExportItemNameZh } from '../../../src/warframe/infrastructure/wf/bounty-adapter'
import { adaptAlerts } from '../../../src/warframe/services'
import { msToHumanReadable } from '../../../src/warframe/utils/time'

const NOW = Date.parse('2026-08-25T09:00:00Z')
const HOUR = 3_600_000

const LOTUS_REWARD = '/Lotus/Types/Items/Research/EnergyComponent'
const TITLE_KEY = '/Lotus/Language/Menu/AlertPopup_Alert'
const NIGHTMARE_KEY = '/Lotus/Language/Menu/NightmareModeName'

function officialZh(key: string): string {
  const text = dict_zh[key] ?? dictZhExtra[key]
  expect(text, key).to.be.a('string').and.not.equal(key)
  return text
}

function parsedAlert(overrides: Record<string, unknown> = {}) {
  return {
    activation: new Date(NOW - HOUR),
    expiry: new Date(NOW + HOUR),
    tag: 'LotusGift',
    mission: {
      nodeKey: 'Ukko (Void)',
      typeKey: 'Interception',
      minEnemyLevel: 65,
      maxEnemyLevel: 70,
      factionKey: 'Orokin',
      nightmare: false,
      description: 'Gift from the Lotus',
      reward: {
        items: [LOTUS_REWARD],
        countedItems: [{ type: 'Marks of Valiance', key: 'Marks of Valiance', count: 20 }],
        credits: 12200,
      },
    },
    ...overrides,
  }
}

describe('adaptAlerts', () => {
  it('translates mission type and node into Chinese', async () => {
    const board = await adaptAlerts([parsedAlert()], NOW)

    expect(board.title).to.equal(officialZh(TITLE_KEY))
    expect(board.alerts).to.have.length(1)
    expect(board.alerts[0].type).to.equal('拦截')
    expect(board.alerts[0].node.name).to.equal(dict_zh[ExportRegions.SolNode406.name])
    expect(board.alerts[0].node.system).to.equal(dict_zh[ExportRegions.SolNode406.systemName])
    expect(board.alerts[0].node.faction).to.equal('奥罗金')
  })

  it('uses mission enemy levels instead of star-chart defaults', async () => {
    const board = await adaptAlerts([parsedAlert()], NOW)
    const alert = board.alerts[0]

    expect(ExportRegions.SolNode406.minEnemyLevel).to.equal(30)
    expect(ExportRegions.SolNode406.maxEnemyLevel).to.equal(35)
    expect(alert.node.minLevel).to.equal(65)
    expect(alert.node.maxLevel).to.equal(70)
  })

  it('resolves /Lotus rewards through resolveExportItemNameZh', async () => {
    const board = await adaptAlerts([parsedAlert({
      mission: {
        nodeKey: 'Ukko (Void)',
        typeKey: 'Interception',
        minEnemyLevel: 65,
        maxEnemyLevel: 70,
        reward: {
          items: [LOTUS_REWARD],
          countedItems: [{
            type: 'Fieldron',
            key: LOTUS_REWARD,
            count: 3,
          }],
          credits: 0,
        },
      },
    })], NOW)

    expect(board.alerts[0].rewards).to.deep.equal([
      { name: resolveExportItemNameZh(LOTUS_REWARD), count: 1 },
      { name: resolveExportItemNameZh(LOTUS_REWARD), count: 3 },
    ])
  })

  it('keeps English countedItems.key values that are not item paths', async () => {
    const board = await adaptAlerts([parsedAlert()], NOW)
    const names = board.alerts[0].rewards.map(reward => reward.name)

    expect(names).to.include('Marks of Valiance')
    expect(names).to.include(resolveExportItemNameZh('/12200Credits'))
    expect(names).to.include(resolveExportItemNameZh(LOTUS_REWARD))
  })

  it('drops expired alerts', async () => {
    const board = await adaptAlerts([
      parsedAlert({ expiry: new Date(NOW) }),
      parsedAlert({ expiry: new Date(NOW - 1000) }),
      parsedAlert({ expiry: new Date(NOW + HOUR) }),
    ], NOW)

    expect(board.alerts).to.have.length(1)
    expect(board.alerts[0].expiry).to.equal(NOW + HOUR)
    expect(board.alerts[0].remaining).to.equal(msToHumanReadable(HOUR))
  })

  it('returns an empty list when nothing is active', async () => {
    const empty = await adaptAlerts([], NOW)
    const expired = await adaptAlerts([parsedAlert({ expiry: new Date(NOW - 1) })], NOW)

    expect(empty.alerts).to.deep.equal([])
    expect(expired.alerts).to.deep.equal([])
    expect(empty.title).to.equal(officialZh(TITLE_KEY))
    expect(t('alert.unavailable')).to.equal('当前没有警报')
  })

  it('maps nightmare to the official Chinese label when present', async () => {
    const board = await adaptAlerts([parsedAlert({
      mission: {
        nodeKey: 'Ukko (Void)',
        typeKey: 'Sabotage',
        minEnemyLevel: 20,
        maxEnemyLevel: 25,
        nightmare: true,
        reward: { items: [], countedItems: [], credits: 0 },
      },
    })], NOW)

    expect(board.alerts[0].type).to.equal('破坏')
    expect(board.alerts[0].nightmare).to.equal(officialZh(NIGHTMARE_KEY))
  })
})
