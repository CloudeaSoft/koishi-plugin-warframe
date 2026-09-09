import type { CalendarEventInfo, RawCalendarSeason } from '../../../src/warframe'
import { expect } from 'chai'
import { dict_zh, ExportChallenges } from 'warframe-public-export-plus'
import { t } from '../../../src/i18n'
import { dictZhExtra } from '../../../src/warframe/assets'
import { resolveExportItemNameZh } from '../../../src/warframe/infrastructure/wf/bounty-adapter'
import { stripLotusMarkup } from '../../../src/warframe/infrastructure/wf/calendar-adapter'
import { extractCalendarRaw } from '../../../src/warframe/infrastructure/wf/wf-api'
import { adaptCalendar, getCalendarFrom } from '../../../src/warframe/services'
import { msToHumanReadable } from '../../../src/warframe/utils/time'
import worldStateJSON from '../../assets/example-world-state.json'

const ACTIVATION = 1_766_361_600_000
const EXPIRY = 1_766_966_400_000
const NOW = ACTIVATION + 3_600_000
const DAY = 86_400_000
const TECHROT_EASY = '/Lotus/Types/Challenges/Calendar1999/CalendarKillTechrotEnemiesEasy'
const OVERSHIELD = '/Lotus/Upgrades/Calendar/OvershieldCap'
const UTILITY_UNLOCKER = '/Lotus/StoreItems/Types/Items/MiscItems/UtilityUnlocker'

function officialZh(key: string): string {
  const text = dict_zh[key] ?? dictZhExtra[key]
  expect(text, key).to.be.a('string').and.not.equal(key)
  return text
}

function mongoDate(ms: number): { $date: { $numberLong: string } } {
  return { $date: { $numberLong: String(ms) } }
}

function seasonFixture(overrides: Partial<RawCalendarSeason> = {}): RawCalendarSeason {
  return {
    Activation: mongoDate(ACTIVATION),
    Expiry: mongoDate(EXPIRY),
    Season: 'CST_SPRING',
    YearIteration: 13,
    Days: [
      {
        day: 96,
        events: [{ type: 'CET_CHALLENGE', challenge: TECHROT_EASY }],
      },
      {
        day: 97,
        events: [
          { type: 'CET_UPGRADE', upgrade: OVERSHIELD },
          { type: 'CET_UPGRADE', upgrade: '/Lotus/Upgrades/Calendar/HealingEffects' },
        ],
      },
      {
        day: 105,
        events: [{ type: 'CET_REWARD', reward: UTILITY_UNLOCKER }],
      },
    ],
    ...overrides,
  }
}

function expectedChallenge(path: string): Pick<CalendarEventInfo, 'name' | 'description'> {
  const exported = ExportChallenges[path]
  const description = officialZh(exported.description ?? '')
    .split('|COUNT|')
    .join(String(exported.requiredCount ?? 0))
  return {
    name: officialZh(exported.name ?? ''),
    description,
  }
}

describe('calendar', () => {
  it('extracts KnownCalendarSeasons paths from worldstate json', () => {
    const raw = extractCalendarRaw(JSON.stringify(worldStateJSON))

    expect(raw).to.not.equal(undefined)
    expect(raw!.Season).to.equal('CST_SPRING')
    expect(raw!.YearIteration).to.equal(13)
    expect(raw!.Days?.some(day =>
      day.events?.some(event => event.challenge === TECHROT_EASY),
    )).to.equal(true)
  })

  it('translates season, challenge, override, and reward into official Chinese', () => {
    const board = adaptCalendar(seasonFixture(), NOW)
    const expected = expectedChallenge(TECHROT_EASY)

    expect(board.title).to.equal(
      officialZh('/Lotus/Language/1999/CalendarSeasonHeader')
        .split('|SEASON|')
        .join(officialZh('/Lotus/Language/1999/CalendarSeasonSpring')),
    )
    expect(board.season).to.equal(officialZh('/Lotus/Language/1999/CalendarSeasonSpring'))
    expect(board.days).to.have.length(3)
    expect(board.days[0]?.dateLabel).to.equal('1999年4月6日')
    expect(board.days[0]?.events[0]?.kindLabel).to.equal(
      officialZh('/Lotus/Language/1999/CalendarEvent_Challenge'),
    )
    expect(board.days[0]?.events[0]?.name).to.equal(expected.name)
    expect(board.days[0]?.events[0]?.description).to.equal(expected.description)
    expect(board.days[1]?.events[0]?.kindLabel).to.equal(
      officialZh('/Lotus/Language/1999/CalendarEvent_Modifiers'),
    )
    expect(board.days[1]?.events[0]?.name).to.equal(
      officialZh('/Lotus/Language/1999/OvershieldCapName'),
    )
  })

  it('keeps every tagged day in the season blob, including later rewards', () => {
    const board = adaptCalendar(seasonFixture(), NOW)
    const days = board.days.map(entry => entry.day)

    expect(days).to.deep.equal([96, 97, 105])
    expect(board.days[2]?.events[0]?.name).to.equal(resolveExportItemNameZh(UTILITY_UNLOCKER))
    expect(board.remaining).to.equal(msToHumanReadable(EXPIRY - NOW))
  })

  it('resolves /Lotus reward paths through resolveExportItemNameZh', () => {
    const board = adaptCalendar(seasonFixture({
      Days: [{
        day: 96,
        events: [{ type: 'CET_REWARD', reward: UTILITY_UNLOCKER }],
      }],
    }), NOW)

    expect(board.days[0]?.events[0]?.kindLabel).to.equal(
      officialZh('/Lotus/Language/1999/CalendarEvent_Reward'),
    )
    expect(board.days[0]?.events[0]?.name).to.equal(resolveExportItemNameZh(UTILITY_UNLOCKER))
    expect(board.days[0]?.events[0]?.name).to.not.equal(UTILITY_UNLOCKER)
  })

  it('strips Lotus markup tags from override descriptions and shard names', () => {
    const board = adaptCalendar(seasonFixture({
      Days: [
        {
          day: 96,
          events: [{ type: 'CET_UPGRADE', upgrade: '/Lotus/Upgrades/Calendar/BlastEveryXShots' }],
        },
        {
          day: 97,
          events: [{
            type: 'CET_REWARD',
            reward: '/Lotus/StoreItems/Types/Gameplay/NarmerSorties/ArchonCrystalBoreal',
          }],
        },
      ],
    }), NOW)

    const override = board.days[0]?.events[0]
    const shard = board.days[1]?.events[0]
    expect(override?.description ?? '').to.not.match(/<[^>]+>/)
    expect(override?.description).to.include('爆炸')
    expect(shard?.name ?? '').to.not.match(/<[^>]+>/)
    expect(shard?.name).to.include('蔚蓝执刑官源力石')
  })

  it('leaves no angle brackets in names or descriptions from the world-state fixture', () => {
    const board = adaptCalendar(extractCalendarRaw(JSON.stringify(worldStateJSON)), NOW)
    for (const day of board.days) {
      expect(day.dateLabel).to.not.match(/[<>]/)
      for (const event of day.events) {
        expect(event.name, event.name).to.not.match(/[<>]/)
        if (event.description) {
          expect(event.description, event.description).to.not.match(/[<>]/)
        }
      }
    }
  })

  it('strips nested and unclosed tags without leaving angle brackets', () => {
    expect(stripLotusMarkup('<<script>alert(1)</script>')).to.equal('alert(1)')
    expect(stripLotusMarkup('prefix<script')).to.equal('prefix')
    expect(stripLotusMarkup('|OPEN_COLOR|<DT_MAGNETIC>Magnetic|CLOSE_COLOR|')).to.equal('Magnetic')
    expect(stripLotusMarkup('<SHARD_BLUE_SIMPLE>蔚蓝执刑官源力石')).to.equal('蔚蓝执刑官源力石')
    expect(stripLotusMarkup('<<script>alert(1)</script>')).to.not.match(/[<>]/)
    expect(stripLotusMarkup('prefix<script')).to.not.include('<script')
  })
})

describe('getCalendarFrom', () => {
  it('returns the adapted board from a worldstate snapshot', async () => {
    const result = await getCalendarFrom({
      raw: {},
      calendarRaw: seasonFixture(),
    }, NOW)

    expect(result.ok).to.equal(true)
    if (!result.ok) {
      return
    }

    expect(result.data.days).to.have.length(3)
    expect(result.data.expiry).to.equal(EXPIRY)
  })

  it('fails when the calendar week has expired', async () => {
    const result = await getCalendarFrom({
      raw: {},
      calendarRaw: seasonFixture(),
    }, EXPIRY)

    expect(result.ok).to.equal(false)
    if (result.ok) {
      return
    }

    expect(result.error.code).to.equal('calendar.unavailable')
    expect(t(result)).to.equal('当前没有1999日历')
  })

  it('fails when every calendar day has no events', async () => {
    const result = await getCalendarFrom({
      raw: {},
      calendarRaw: seasonFixture({
        Days: [
          { day: 96, events: [] },
          { day: 105, events: [] },
        ],
      }),
    }, NOW)

    expect(result.ok).to.equal(false)
    if (result.ok) {
      return
    }

    expect(result.error.code).to.equal('calendar.unavailable')
  })

  it('fails with common.fetchFailed when worldstate cannot be loaded', async () => {
    const result = await getCalendarFrom()
    expect(result.ok).to.equal(false)
    if (result.ok) {
      return
    }

    expect(result.error.code).to.equal('common.fetchFailed')
    expect(result.error.retryable).to.equal(true)
  })

  it('uses extracted fixture JSON for remaining tagged days', async () => {
    const calendarRaw = extractCalendarRaw(JSON.stringify(worldStateJSON))
    const result = await getCalendarFrom({
      raw: {},
      calendarRaw,
    }, ACTIVATION + DAY)

    expect(result.ok).to.equal(true)
    if (!result.ok) {
      return
    }

    expect(result.data.days.length).to.be.greaterThan(2)
    expect(result.data.days.some(day => day.events.some(event => event.name === expectedChallenge(TECHROT_EASY).name))).to.equal(true)
    expect(result.data.days.some(day => day.day === 180)).to.equal(true)
  })
})
