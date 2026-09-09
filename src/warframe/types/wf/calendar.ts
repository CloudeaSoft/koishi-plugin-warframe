import type { RawMongoDate } from './nightwave'

export interface RawCalendarEvent {
  type?: string
  challenge?: string
  upgrade?: string
  reward?: string
  dialogueName?: string
  dialogueConvo?: string
}

export interface RawCalendarDay {
  day?: number
  events?: RawCalendarEvent[]
}

export interface RawCalendarSeason {
  Activation?: RawMongoDate
  Expiry?: RawMongoDate
  Days?: RawCalendarDay[]
  Season?: string
  YearIteration?: number
  Version?: number
  UpgradeAvaliabilityRequirements?: string[]
}

export type CalendarEventKind = 'challenge' | 'upgrade' | 'reward' | 'birthday' | 'other'

export interface CalendarEventInfo {
  kind: CalendarEventKind
  kindLabel: string
  name: string
  description?: string
}

export interface CalendarDayInfo {
  day: number
  dateLabel: string
  events: CalendarEventInfo[]
}

export interface CalendarBoard {
  title: string
  season: string
  remaining: string
  expiry: number
  days: CalendarDayInfo[]
}
