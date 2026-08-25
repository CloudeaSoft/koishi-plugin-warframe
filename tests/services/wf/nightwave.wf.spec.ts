import type { RawSeasonInfo } from '../../../src/warframe/types'
import { expect } from 'chai'
import { dict_zh, ExportNightwave } from 'warframe-public-export-plus'
import { t } from '../../../src/i18n'
import { extractSeasonInfoRaw } from '../../../src/warframe/infrastructure/wf/wf-api'
import { resolveNightwave } from '../../../src/warframe/services'
import { msToHumanReadable } from '../../../src/warframe/utils/time'
import worldStateJSON from '../../assets/example-world-state.json'

const NOW = Date.parse('2026-01-15T12:00:00Z')

const DAILY_PATH = '/Lotus/Types/Challenges/Seasons/Daily/SeasonDailyPlaceMarker'
const WEEKLY_PATH = '/Lotus/Types/Challenges/Seasons/Weekly/SeasonWeeklyKillArchgunEnemies'
const ELITE_PATH = '/Lotus/Types/Challenges/Seasons/WeeklyHard/SeasonWeeklyHardCollectUniqueResources'
const PERMANENT_PATH = '/Lotus/Types/Challenges/Seasons/Weekly/SeasonWeeklyPermanentCompleteMissions9'
const UNKNOWN_PATH = '/Lotus/Types/Challenges/Seasons/Weekly/SeasonWeeklyNotARealChallenge'

function mongoDate(ms: number): { $date: { $numberLong: string } } {
  return { $date: { $numberLong: String(ms) } }
}

function challenge(
  path: string,
  expiry: number,
  extra: { Daily?: boolean, Permanent?: boolean } = {},
): RawSeasonInfo['ActiveChallenges'][number] {
  return {
    Challenge: path,
    Activation: mongoDate(NOW - 86_400_000),
    Expiry: mongoDate(expiry),
    ...extra,
  }
}

function expectedName(path: string): string {
  return dict_zh[ExportNightwave.challenges[path].name]
}

function expectedStanding(path: string): number {
  return ExportNightwave.challenges[path].standing
}

function expectedDescription(path: string): string {
  const exported = ExportNightwave.challenges[path]
  const raw = dict_zh[exported.description] ?? exported.description
  return raw.split('|COUNT|').join(String(exported.required))
}

function seasonFixture(overrides: Partial<RawSeasonInfo> = {}): RawSeasonInfo {
  return {
    Season: 16,
    Phase: 0,
    AffiliationTag: 'RadioLegionIntermission14Syndicate',
    Expiry: mongoDate(NOW + 10 * 86_400_000),
    ActiveChallenges: [
      challenge(DAILY_PATH, NOW + 86_400_000, { Daily: true }),
      challenge(WEEKLY_PATH, NOW + 5 * 86_400_000),
      challenge(ELITE_PATH, NOW + 5 * 86_400_000),
      challenge(PERMANENT_PATH, NOW + 5 * 86_400_000, { Permanent: true }),
      challenge(DAILY_PATH, NOW - 1000, { Daily: true }),
      challenge(UNKNOWN_PATH, NOW + 86_400_000),
    ],
    ...overrides,
  }
}

describe('nightwave', () => {
  it('extracts SeasonInfo and keeps Challenge paths from worldstate json', () => {
    const raw = extractSeasonInfoRaw(JSON.stringify(worldStateJSON))

    expect(raw).to.not.equal(undefined)
    expect(raw!.AffiliationTag).to.equal('RadioLegionIntermission14Syndicate')
    expect(raw!.Season).to.equal(16)
    expect(raw!.Phase).to.equal(0)
    expect(raw!.ActiveChallenges.some(
      entry => entry.Challenge === DAILY_PATH && entry.Daily === true,
    )).to.equal(true)
    expect(raw!.ActiveChallenges.some(
      entry => entry.Challenge === ELITE_PATH,
    )).to.equal(true)
    expect(raw!.ActiveChallenges.some(
      entry => entry.Challenge.includes('Permanent'),
    )).to.equal(true)
  })

  it('resolves official Chinese names and ExportNightwave standing', () => {
    const result = resolveNightwave(seasonFixture(), NOW)

    expect(result.ok).to.equal(true)
    if (!result.ok) {
      return
    }

    expect(result.data.title).to.equal(dict_zh['/Lotus/Language/Syndicates/RadioLegionTitle'])
    expect(result.data.season).to.equal(16)
    expect(result.data.phase).to.equal(0)

    const daily = result.data.challenges.find(entry => entry.kind === 'daily')
    expect(daily).to.not.equal(undefined)
    expect(daily!.name).to.equal(expectedName(DAILY_PATH))
    expect(daily!.description).to.equal(expectedDescription(DAILY_PATH))
    expect(daily!.standing).to.equal(expectedStanding(DAILY_PATH))

    const weekly = result.data.challenges.find(entry => entry.name === expectedName(WEEKLY_PATH))
    expect(weekly).to.not.equal(undefined)
    expect(weekly!.kind).to.equal('weekly')
    expect(weekly!.standing).to.equal(expectedStanding(WEEKLY_PATH))

    const elite = result.data.challenges.find(entry => entry.kind === 'elite')
    expect(elite).to.not.equal(undefined)
    expect(elite!.name).to.equal(expectedName(ELITE_PATH))
    expect(elite!.standing).to.equal(expectedStanding(ELITE_PATH))

    const permanent = result.data.challenges.find(entry => entry.kind === 'permanent')
    expect(permanent).to.not.equal(undefined)
    expect(permanent!.name).to.equal(expectedName(PERMANENT_PATH))
    expect(permanent!.standing).to.equal(expectedStanding(PERMANENT_PATH))
  })

  it('uses SeasonInfo expiry for the season and each challenge expiry for acts', () => {
    const result = resolveNightwave(seasonFixture(), NOW)

    expect(result.ok).to.equal(true)
    if (!result.ok) {
      return
    }

    expect(result.data.expiry).to.equal(NOW + 10 * 86_400_000)
    expect(result.data.remaining).to.equal(msToHumanReadable(10 * 86_400_000))

    const daily = result.data.challenges.find(entry => entry.kind === 'daily')
    expect(daily!.remaining).to.equal(msToHumanReadable(86_400_000))

    const weekly = result.data.challenges.find(entry => entry.name === expectedName(WEEKLY_PATH))
    expect(weekly!.remaining).to.equal(msToHumanReadable(5 * 86_400_000))
  })

  it('drops expired active challenges', () => {
    const result = resolveNightwave(seasonFixture(), NOW)

    expect(result.ok).to.equal(true)
    if (!result.ok) {
      return
    }

    expect(result.data.challenges.filter(entry => entry.kind === 'daily')).to.have.length(1)
    expect(result.data.challenges[0].name).to.equal(expectedName(DAILY_PATH))
  })

  it('falls back to the challenge path or key for unknown Challenge paths', () => {
    const result = resolveNightwave(seasonFixture(), NOW)

    expect(result.ok).to.equal(true)
    if (!result.ok) {
      return
    }

    const unknown = result.data.challenges.find(entry =>
      entry.name === UNKNOWN_PATH || entry.name === 'SeasonWeeklyNotARealChallenge',
    )
    expect(unknown).to.not.equal(undefined)
    expect(unknown!.kind).to.equal('weekly')
    expect(unknown!.name).to.not.match(/[\u4E00-\u9FFF]/)
    expect(unknown!.standing).to.equal(undefined)
  })

  it('fails when SeasonInfo is missing', () => {
    const extracted = extractSeasonInfoRaw('{"SyndicateMissions":[]}')
    const result = resolveNightwave(extracted, NOW)

    expect(extracted).to.equal(undefined)
    expect(result.ok).to.equal(false)
    if (!result.ok) {
      expect(result.error.code).to.equal('nightwave.unavailable')
      expect(t(result)).to.equal('当前没有午夜电波')
    }
  })
})
