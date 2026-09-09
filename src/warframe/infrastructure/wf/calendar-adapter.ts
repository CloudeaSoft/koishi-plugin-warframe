import type {
  CalendarBoard,
  CalendarDayInfo,
  CalendarEventInfo,
  CalendarEventKind,
  RawCalendarEvent,
  RawCalendarSeason,
  RawMongoDate,
} from '../../types'
import {
  dict_zh,
  ExportChallenges,
} from 'warframe-public-export-plus'
import { dictZhExtra } from '../../assets/index'
import { msToHumanReadable } from '../../utils'
import { resolveExportItemNameZh } from './bounty-adapter'

const CALENDAR_SEASON_HEADER_KEY = '/Lotus/Language/1999/CalendarSeasonHeader'
const CALENDAR_HEADER_KEY = '/Lotus/Language/1999/CalendarHeader'

const SEASON_KEYS: Record<string, string> = {
  CST_SPRING: '/Lotus/Language/1999/CalendarSeasonSpring',
  CST_SUMMER: '/Lotus/Language/1999/CalendarSeasonSummer',
  CST_FALL: '/Lotus/Language/1999/CalendarSeasonFall',
  CST_WINTER: '/Lotus/Language/1999/CalendarSeasonWinter',
}

const EVENT_TYPE_KEYS: Record<string, { kind: CalendarEventKind, labelKey: string }> = {
  CET_CHALLENGE: {
    kind: 'challenge',
    labelKey: '/Lotus/Language/1999/CalendarEvent_Challenge',
  },
  CET_UPGRADE: {
    kind: 'upgrade',
    labelKey: '/Lotus/Language/1999/CalendarEvent_Modifiers',
  },
  CET_REWARD: {
    kind: 'reward',
    labelKey: '/Lotus/Language/1999/CalendarEvent_Reward',
  },
  CET_PLOT: {
    kind: 'birthday',
    labelKey: '/Lotus/Language/1999/CalendarEvent_BDay',
  },
}

export function calendarTimestampMs(value?: RawMongoDate): number {
  const raw = value?.$date?.$numberLong
  if (raw === undefined || raw === '') {
    return 0
  }
  const ms = Number(raw)
  return Number.isFinite(ms) ? ms : 0
}

function translate(key: string, fallback: string = key): string {
  return stripLotusMarkup(dict_zh[key] ?? dictZhExtra[key] ?? fallback)
}

function seasonLabel(season: string): string {
  const key = SEASON_KEYS[season]
  if (!key) {
    return season.replace(/^CST_/, '')
  }
  return translate(key)
}

function calendarDateLabel(dayOfYear: number): string {
  const date = new Date(Date.UTC(1999, 0, 1))
  date.setUTCDate(dayOfYear)
  return `${date.getUTCFullYear()}年${date.getUTCMonth() + 1}月${date.getUTCDate()}日`
}

function pathLeaf(path: string): string {
  return path.split('/').pop() ?? path
}

/** Strip Lotus color pipes and HTML-like markup tags. */
export function stripLotusMarkup(text: string): string {
  const withoutPipes = text
    .replaceAll('|OPEN_COLOR|', '')
    .replaceAll('|CLOSE_COLOR|', '')
  const withoutTags = withoutPipes.split('<').map((part, index) => {
    if (index === 0) {
      return part
    }
    const close = part.indexOf('>')
    return close === -1 ? '' : part.slice(close + 1)
  }).join('')
  return withoutTags.replaceAll('<', '').replaceAll('>', '').replace(/\s+/g, ' ').trim()
}

function adaptChallenge(path: string): Pick<CalendarEventInfo, 'name' | 'description'> {
  const exported = ExportChallenges[path]
  if (!exported?.name) {
    return { name: pathLeaf(path) }
  }

  const descriptionKey = exported.description
  const description = descriptionKey
    ? translate(descriptionKey)
        .split('|COUNT|')
        .join(String(exported.requiredCount ?? 0))
    : undefined

  return {
    name: translate(exported.name),
    ...(description ? { description } : {}),
  }
}

function adaptUpgrade(path: string): Pick<CalendarEventInfo, 'name' | 'description'> {
  const leaf = pathLeaf(path)
  const name = translate(`/Lotus/Language/1999/${leaf}Name`, leaf)
  const description = translate(`/Lotus/Language/1999/${leaf}Desc`, '')
  return {
    name,
    ...(description ? { description } : {}),
  }
}

function adaptEvent(raw: RawCalendarEvent): CalendarEventInfo | undefined {
  const type = raw.type ?? ''
  const mapped = EVENT_TYPE_KEYS[type]
  const kind = mapped?.kind ?? 'other'
  const kindLabel = mapped ? translate(mapped.labelKey) : type

  if (raw.challenge) {
    return { kind, kindLabel, ...adaptChallenge(raw.challenge) }
  }
  if (raw.upgrade) {
    return { kind, kindLabel, ...adaptUpgrade(raw.upgrade) }
  }
  if (raw.reward) {
    return { kind, kindLabel, name: stripLotusMarkup(resolveExportItemNameZh(raw.reward)) }
  }
  if (raw.dialogueName) {
    return { kind, kindLabel, name: pathLeaf(raw.dialogueName) }
  }
  return undefined
}

export function adaptCalendar(
  raw: RawCalendarSeason | undefined,
  now: number = Date.now(),
): CalendarBoard {
  const seasonCode = raw?.Season ?? ''
  const season = seasonLabel(seasonCode)
  const header = translate(CALENDAR_SEASON_HEADER_KEY, translate(CALENDAR_HEADER_KEY))
  const title = header.includes('|SEASON|')
    ? header.split('|SEASON|').join(season)
    : header
  const expiry = calendarTimestampMs(raw?.Expiry)
  const days = [...(raw?.Days ?? [])]
    .map((entry) => {
      const day = entry.day ?? 0
      const events = (entry.events ?? [])
        .map(adaptEvent)
        .filter((event): event is CalendarEventInfo => event !== undefined)
      return { day, events }
    })
    .filter(entry => entry.day > 0)
    .sort((a, b) => a.day - b.day)

  const taggedDays: CalendarDayInfo[] = days
    .filter(entry => entry.events.length > 0)
    .map(entry => ({
      day: entry.day,
      dateLabel: calendarDateLabel(entry.day),
      events: entry.events,
    }))

  return {
    title,
    season,
    remaining: msToHumanReadable(Math.max(expiry - now, 0)),
    expiry,
    days: taggedDays,
  }
}
