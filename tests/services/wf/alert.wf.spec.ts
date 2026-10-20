import { expect } from 'chai'
import { dict_zh, ExportRegions } from 'warframe-public-export-plus'
import { t } from '../../../src/i18n'
import { dictZhExtra } from '../../../src/warframe/assets'
import { resolveExportItemNameZh } from '../../../src/warframe/infrastructure/wf/bounty-adapter'
import { adaptAlerts } from '../../../src/warframe/services'
import { msToHumanReadable } from '../../../src/warframe/utils/time'
import worldStateJSON from '../../assets/example-world-state.json'
import 'reflect-metadata'

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

  it('translates English counted item names from the official dictionary', async () => {
    const board = await adaptAlerts([parsedAlert()], NOW)
    const names = board.alerts[0].rewards.map(reward => reward.name)

    expect(names).to.include('英勇徽章')
    expect(names).to.include(resolveExportItemNameZh('/12200Credits'))
    expect(names).to.include(resolveExportItemNameZh(LOTUS_REWARD))
  })

  it('localizes a real parsed alert including its event title', async () => {
    const { Alert } = await import('warframe-worldstate-parser')
    const raw = new Alert(worldStateJSON.Alerts[0])
    const board = await adaptAlerts([raw], raw.activation.getTime())

    expect(board.alerts[0]).to.deep.include({ description: '佩里塔之血', type: '拦截' })
    expect(board.alerts[0].node.system).to.equal('虚空')
    expect(board.alerts[0].rewards).to.deep.equal([
      { name: '英勇徽章', count: 20 },
      { name: '12200 现金', count: 1 },
    ])
  })

  it('uses unique item paths and does not duplicate legacy items from the parser', async () => {
    const { Alert } = await import('warframe-worldstate-parser')
    const raw = new Alert({
      ...worldStateJSON.Alerts[0],
      MissionInfo: {
        ...worldStateJSON.Alerts[0].MissionInfo,
        descText: '/Lotus/Language/Alerts/LotusGiftDesc',
        missionReward: { items: [LOTUS_REWARD], credits: 0 },
      },
    })
    const board = await adaptAlerts([raw], raw.activation.getTime())

    expect(board.alerts[0]).to.include({ description: 'Lotus 的赏赐' })
    expect(board.alerts[0].rewards).to.deep.equal([{ name: '电磁力场装置', count: 1 }])
  })

  it('translates current event resources missing from the public export item table', async () => {
    const { Alert } = await import('warframe-worldstate-parser')
    const raw = new Alert({
      ...worldStateJSON.Alerts[0],
      MissionInfo: {
        ...worldStateJSON.Alerts[0].MissionInfo,
        descText: '/Lotus/Language/TauPrologue/EventAlertTitle',
        missionReward: {
          countedItems: [{
            ItemType: '/Lotus/Types/Gameplay/Events/RoadToTauEvent/RoadToTauEventResource',
            ItemCount: 50,
          }],
          credits: 17000,
        },
      },
    })
    const board = await adaptAlerts([raw], raw.activation.getTime())

    expect(board.alerts[0]).to.include({ description: '探测到月华脯位置' })
    expect(board.alerts[0].rewards).to.deep.equal([
      { name: '月华脯', count: 50 },
      { name: '17000 现金', count: 1 },
    ])
  })

  it('accepts internal keys and display fields when parser keys are missing', async () => {
    const board = await adaptAlerts([parsedAlert({
      description: 'Gift from the Lotus',
      mission: {
        node: 'SolNode406',
        type: 'MT_TERRITORY',
        reward: { items: ['Fieldron'], countedItems: [] },
      },
    })], NOW)

    expect(board.alerts[0]).to.deep.include({ description: 'Lotus 的赏赐', type: '拦截' })
    expect(board.alerts[0].node.system).to.equal('虚空')
    expect(board.alerts[0].rewards).to.deep.equal([{ name: '电磁力场装置', count: 1 }])
  })

  it('preserves unknown and already localized text', async () => {
    for (const text of ['Unknown future content', '已翻译的内容']) {
      const board = await adaptAlerts([parsedAlert({
        description: text,
        mission: { node: text, type: text, reward: { items: [text] } },
      })], NOW)

      expect(board.alerts[0]).to.include({ description: text, type: text })
      expect(board.alerts[0].node.name).to.equal(text)
      expect(board.alerts[0].rewards).to.deep.equal([{ name: text, count: 1 }])
    }
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
