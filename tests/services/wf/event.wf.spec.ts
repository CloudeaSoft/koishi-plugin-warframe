import type { RawWorldEvent } from '../../../src/warframe'
import { expect } from 'chai'
import { dict_zh, ExportRegions } from 'warframe-public-export-plus'
import { t } from '../../../src/i18n'
import { dictZhExtra } from '../../../src/warframe/assets'
import { resolveExportItemNameZh } from '../../../src/warframe/infrastructure/wf/bounty-adapter'
import { extractEventsRaw } from '../../../src/warframe/infrastructure/wf/wf-api'
import { adaptEvents, getEventsFrom } from '../../../src/warframe/services'
import { msToHumanReadable } from '../../../src/warframe/utils/time'
import worldStateJSON from '../../assets/example-world-state.json'

const NOW = 1_766_804_995_000
const HOUR = 3_600_000
const TITLE_KEY = '/Lotus/Language/Menu/WorldStatePanel_Event'
const HEAT_NAME = '/Lotus/Language/G1Quests/HeatFissuresEventName'
const HEAT_DESC = '/Lotus/Language/G1Quests/HeatFissuresEventDesc'
const HEAT_SCORE = '/Lotus/Language/G1Quests/HeatFissuresEventScore'
const TAU_NAME = '/Lotus/Language/TauPrequel/TauPrequelFinal/TauPrequelEventName'
const VANDAL = '/Lotus/StoreItems/Weapons/Corpus/LongGuns/CrpBFG/Vandal/VandalCrpBFG'
const ORB_BADGE = '/Lotus/StoreItems/Upgrades/Skins/Clan/OrbBadgeItem'

function officialZh(key: string): string {
  const text = dict_zh[key] ?? dictZhExtra[key]
  expect(text, key).to.be.a('string').and.not.equal(key)
  return text
}

function mongoDate(ms: number) {
  return { $date: { $numberLong: String(ms) } }
}

function rawEvent(overrides: Partial<RawWorldEvent> = {}): RawWorldEvent {
  return {
    _id: { $oid: 'heat' },
    Activation: mongoDate(NOW - HOUR),
    Expiry: mongoDate(NOW + HOUR),
    Node: 'SolNode129',
    Count: 14,
    Goal: 100,
    HealthPct: 0.14,
    Desc: HEAT_NAME,
    ToolTip: HEAT_DESC,
    ScoreLocTag: HEAT_SCORE,
    Tag: 'HeatFissure',
    Reward: {
      items: [VANDAL],
      countedItems: [],
      credits: 0,
    },
    InterimGoals: [5],
    InterimRewards: [{
      items: [ORB_BADGE],
      countedItems: [],
      credits: 0,
    }],
    ...overrides,
  }
}

describe('adaptEvents', () => {
  it('translates event names, nodes, progress, and rewards into Chinese', () => {
    const board = adaptEvents([rawEvent()], NOW)
    const event = board.events[0]

    expect(board.title).to.equal(officialZh(TITLE_KEY))
    expect(board.events).to.have.length(1)
    expect(event.name).to.equal(officialZh(HEAT_NAME))
    expect(event.description).to.equal(officialZh(HEAT_DESC))
    expect(event.scoreLabel).to.equal(officialZh(HEAT_SCORE))
    expect(event.node?.name).to.equal(dict_zh[ExportRegions.SolNode129.name])
    expect(event.node?.system).to.equal(dict_zh[ExportRegions.SolNode129.systemName])
    expect(event.currentScore).to.equal(14)
    expect(event.maximumScore).to.equal(100)
    expect(event.progress).to.equal(14 / 100)
    expect(event.remaining).to.equal(msToHumanReadable(HOUR))
    expect(event.rewards.map(reward => reward.name)).to.deep.equal([
      resolveExportItemNameZh(VANDAL),
    ])
    expect(event.interimSteps).to.deep.equal([{
      goal: 5,
      rewards: [{ name: resolveExportItemNameZh(ORB_BADGE), count: 1 }],
    }])
  })

  it('keeps events that have no score goal when they are still active', () => {
    const board = adaptEvents([rawEvent({
      _id: { $oid: 'tau' },
      Node: 'SolNode251',
      Count: 0,
      Goal: 0,
      HealthPct: undefined,
      Desc: TAU_NAME,
      ToolTip: '/Lotus/Language/TauPrequel/TauPrequelFinal/BloodOfPeritaDetails',
      ScoreLocTag: undefined,
      Tag: '12MinWarEvent',
      Reward: undefined,
      InterimGoals: undefined,
      InterimRewards: undefined,
    })], NOW)

    expect(board.events).to.have.length(1)
    expect(board.events[0].name).to.equal(officialZh(TAU_NAME))
    expect(board.events[0].progress).to.equal(undefined)
    expect(board.events[0].rewards).to.deep.equal([])
    expect(board.events[0].node?.name).to.equal(dict_zh[ExportRegions.SolNode251.name])
  })

  it('uses HealthPct as progress when the event has no score goal', () => {
    const board = adaptEvents([rawEvent({
      Count: 0,
      Goal: 0,
      HealthPct: 0.42,
      Reward: undefined,
      InterimGoals: undefined,
      InterimRewards: undefined,
    })], NOW)

    expect(board.events).to.have.length(1)
    expect(board.events[0].progress).to.equal(0.42)
    expect(board.events[0].maximumScore).to.equal(0)
  })

  it('drops expired and not-yet-active events', () => {
    const board = adaptEvents([
      rawEvent({ Expiry: mongoDate(NOW) }),
      rawEvent({ Expiry: mongoDate(NOW - 1000) }),
      rawEvent({ Activation: mongoDate(NOW + HOUR), Expiry: mongoDate(NOW + HOUR * 2) }),
      rawEvent({ _id: { $oid: 'live' }, Expiry: mongoDate(NOW + HOUR) }),
    ], NOW)

    expect(board.events.map(event => event.id)).to.deep.equal(['live'])
  })

  it('returns an empty list when nothing is active', () => {
    const empty = adaptEvents([], NOW)
    const expired = adaptEvents([rawEvent({ Expiry: mongoDate(NOW - 1) })], NOW)

    expect(empty.events).to.deep.equal([])
    expect(expired.events).to.deep.equal([])
    expect(empty.title).to.equal(officialZh(TITLE_KEY))
    expect(t('event.unavailable')).to.equal('当前没有活动')
  })
})

describe('getEventsFrom', () => {
  it('returns the adapted board from a worldstate snapshot', async () => {
    const result = await getEventsFrom({
      raw: {},
      eventsRaw: [rawEvent()],
    }, NOW)

    expect(result.ok).to.equal(true)
    if (!result.ok) {
      return
    }

    expect(result.data.events).to.have.length(1)
    expect(result.data.events[0].name).to.equal(officialZh(HEAT_NAME))
  })

  it('fails when every event has expired', async () => {
    const result = await getEventsFrom({
      raw: {},
      eventsRaw: [rawEvent({ Expiry: mongoDate(NOW - 1) })],
    }, NOW)

    expect(result.ok).to.equal(false)
    if (result.ok) {
      return
    }

    expect(result.error.code).to.equal('event.unavailable')
    expect(t(result)).to.equal('当前没有活动')
  })

  it('fails with common.fetchFailed when worldstate cannot be loaded', async () => {
    const result = await getEventsFrom()
    expect(result.ok).to.equal(false)
    if (result.ok) {
      return
    }

    expect(result.error.code).to.equal('common.fetchFailed')
    expect(result.error.retryable).to.equal(true)
  })

  it('uses extracted fixture Goals rather than community Events', async () => {
    const eventsRaw = extractEventsRaw(JSON.stringify(worldStateJSON))
    const result = await getEventsFrom({
      raw: {},
      eventsRaw,
    }, NOW)

    expect(eventsRaw.some(event => event.Desc === HEAT_NAME)).to.equal(true)
    expect(JSON.stringify(worldStateJSON)).to.include('JoinDiscord')
    expect(eventsRaw.some(event => event.Desc?.includes('JoinDiscord'))).to.equal(false)

    expect(result.ok).to.equal(true)
    if (!result.ok) {
      return
    }

    const names = result.data.events.map(event => event.name)
    expect(names).to.include(officialZh(HEAT_NAME))
    expect(names).to.include(officialZh(TAU_NAME))
    expect(names.join(' ')).to.not.include('Discord')
  })
})
