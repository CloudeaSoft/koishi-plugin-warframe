import type {
  CalendarBoard,
  RawCalendarSeason,
  WarframeResult,
} from '../../types'

import { globalWorldState } from '../../data/wf/globalWorldState'
import { adaptCalendar as mapCalendar } from '../../infrastructure/wf/calendar-adapter'
import { failure } from '../../types/warframe-result'

export function adaptCalendar(
  raw: RawCalendarSeason | undefined,
  now: number = Date.now(),
): CalendarBoard {
  return mapCalendar(raw, now)
}

export async function getCalendarFrom(
  snapshot?: {
    raw?: unknown
    calendarRaw?: RawCalendarSeason
  },
  now: number = Date.now(),
): Promise<WarframeResult<CalendarBoard>> {
  if (!snapshot?.raw) {
    return failure('common.fetchFailed', true)
  }

  const data = adaptCalendar(snapshot.calendarRaw, now)
  if (data.days.length === 0 || data.expiry <= now) {
    return failure('calendar.unavailable')
  }

  return { ok: true, data }
}

export async function getCalendar(): Promise<WarframeResult<CalendarBoard>> {
  try {
    return await getCalendarFrom(await globalWorldState.get())
  }
  catch {
    return failure('common.fetchFailed', true)
  }
}
