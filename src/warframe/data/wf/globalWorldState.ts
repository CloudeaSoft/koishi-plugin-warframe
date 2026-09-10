import type WorldState from 'warframe-worldstate-parser'
import type {
  AsyncCache,
  Fissure,
  RawCalendarSeason,
  RawInvasion,
  RawSeasonInfo,
  RawSortie,
  RawSyndicateMission,
  RawWorldEvent,
} from '../../types'

import { dict_zh, ExportRegions } from 'warframe-public-export-plus'
import {
  extractCalendarRaw,
  extractEventsRaw,
  extractInvasionsRaw,
  extractSeasonInfoRaw,
  extractSortieRaw,
  extractSyndicateMissionsRaw,
  fetchWorldStateJson,
  getWorldState,
} from '../../infrastructure/wf/wf-api'
import { regionToShort } from '../../infrastructure/wf/wf-export-adapter'
import {
  fissureTierName,
  fissureTierNumToNumber,
  getSolNodeKey,
} from '../../infrastructure/wf/wfcd-adapter'
import { createAsyncCache } from '../../utils'

type ParsedFissure = WorldState['fissures'][number]

export interface GlobalWorldStateData {
  raw: WorldState
  syndicateMissionsRaw: RawSyndicateMission[]
  seasonInfoRaw: RawSeasonInfo | undefined
  sortieRaw: RawSortie | undefined
  invasionsRaw: RawInvasion[]
  calendarRaw: RawCalendarSeason | undefined
  eventsRaw: RawWorldEvent[]
  fissures: Fissure[]
  spFissures: Fissure[]
  rjFissures: Fissure[]
}

export async function adaptFissure(fissure: ParsedFissure): Promise<Fissure> {
  const nodeKey = await getSolNodeKey(fissure.nodeKey)
  const tierName
    = fissure.tierNum in fissureTierName
      ? dict_zh[
        fissureTierName[fissure.tierNum as keyof typeof fissureTierName]
      ]
      : fissure.tierNum

  return {
    category: fissure.isStorm
      ? 'rj-fissures'
      : fissure.isHard
        ? 'sp-fissures'
        : 'fissures',
    hard: fissure.isHard,
    activation: fissure.activation?.getTime() ?? 0,
    expiry: fissure.expiry?.getTime() ?? 0,
    node: regionToShort(ExportRegions[nodeKey], dict_zh),
    tier: String(tierName),
    tierNum: fissureTierNumToNumber(fissure.tierNum),
  }
}

export async function globalWorldStateFactory(
  json?: string,
): Promise<GlobalWorldStateData> {
  json ??= await fetchWorldStateJson()
  if (!json) {
    throw new Error('获取游戏信息失败')
  }

  const syndicateMissionsRaw: RawSyndicateMission[] = extractSyndicateMissionsRaw(json)
  const seasonInfoRaw: RawSeasonInfo | undefined = extractSeasonInfoRaw(json)
  const sortieRaw = extractSortieRaw(json)
  const invasionsRaw = extractInvasionsRaw(json)
  const calendarRaw: RawCalendarSeason | undefined = extractCalendarRaw(json)
  const eventsRaw: RawWorldEvent[] = extractEventsRaw(json)
  const worldState = await getWorldState(json)
  const fissures: Fissure[] = []
  const rjFissures: Fissure[] = []
  const spFissures: Fissure[] = []
  for (const fissure of worldState.fissures) {
    const obj = await adaptFissure(fissure)

    if (fissure.isStorm) {
      rjFissures.push(obj)
    }
    else if (fissure.isHard) {
      spFissures.push(obj)
    }
    else {
      fissures.push(obj)
    }
  }

  fissures.sort((a, b) => a.tierNum - b.tierNum)
  spFissures.sort((a, b) => a.tierNum - b.tierNum)
  rjFissures.sort((a, b) => a.tierNum - b.tierNum)
  return {
    raw: worldState,
    syndicateMissionsRaw,
    seasonInfoRaw,
    sortieRaw,
    invasionsRaw,
    calendarRaw,
    eventsRaw,
    fissures,
    spFissures,
    rjFissures,
  }
}

export let globalWorldState = createAsyncCache(globalWorldStateFactory, -1)

export function overrideGlobalWorldState(
  cache: AsyncCache<GlobalWorldStateData>,
): void {
  globalWorldState = cache
}
