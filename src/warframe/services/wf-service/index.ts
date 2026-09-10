import type {
  Arbitration,
  ArchiMedea,
  ArchiMedeaDebuff,
  ArchiMedeaMission,
  ArchonHunt,
  ArchonHuntMissions,
  BountyBoard,
  BountyLocation,
  RawSortie,
  Relic,
  Sortie,
  SortieMission,
  WarframeResult,
} from '../../types'

import {
  dict_zh,
  ExportMissionTypes,
  ExportRegions,
} from 'warframe-public-export-plus'

import {
  arbyRewards,
  dictEnExtra,
  dictZhExtra,
  incarnons as incarnonRewards,
  warframes as warframeRewards,
} from '../../assets/index'
import { arbitrationSchedule } from '../../data/wf/arbitrationSchedule'
import {
  getArchonHuntEnemyLevels,
  getArchonHuntModeName,
} from '../../data/wf/archonHunt'
import { globalOracleBountyCycle } from '../../data/wf/globalOracleBountyCycle'
import { globalWorldState } from '../../data/wf/globalWorldState'
import { relics } from '../../data/wf/relics'
import {
  getSortieEnemyLevels,
  getSortieModeName,
} from '../../data/wf/sortie'
import {
  adaptBountyBoard,
  adaptOracleBountyBoard,
  findRawSyndicateMission,
  oracleBountyLocations,
} from '../../infrastructure/wf/bounty-adapter'
import { regionToShort } from '../../infrastructure/wf/wf-export-adapter'
import {
  getMissionTypeKey,
  getSolNodeKey,
  translateSortieBoss,
  translateSortieFaction,
  translateSortieModifier,
} from '../../infrastructure/wf/wfcd-adapter'
import { failure } from '../../types/warframe-result'
import {
  msToHumanReadable,
  normalizeName,
  removeSpace,
} from '../../utils'

export { adaptAlerts, getAlerts } from './wf-service.alert'
export { adaptCalendar, getCalendar, getCalendarFrom } from './wf-service.calendar'
export { getEnvironment } from './wf-service.environment'
export { adaptEvents, getEvents, getEventsFrom } from './wf-service.event'
export {
  getFissures,
  getRailjackFissures,
  getSteelPathFissures,
} from './wf-service.fissure'
export { adaptInvasions, getInvasions, getInvasionsFrom } from './wf-service.invasion'
export { getNightwave, resolveNightwave } from './wf-service.nightwave'
export {
  analyzeRivenStat,
  filterWeeklyRivens,
  getAnalyzedRiven,
  getStaticRivenStats,
  getWeaponRivenDisposition,
  getWeeklyRivens,
  parseOCRResult,
} from './wf-service.riven'
export {
  adaptSteelEssence,
  getSteelEssence,
  getSteelEssenceFrom,
} from './wf-service.steel-essence'
export { getVoidTrader } from './wf-service.void-trader'

// ================ features ===================

export async function getRelic(input: string): Promise<WarframeResult<Relic>> {
  if (!input) {
    return failure('relic.invalidName')
  }

  input = normalizeName(input)
  if (!input) {
    return failure('relic.invalidName')
  }

  if (!relics) {
    return failure('relic.dataLoading', true)
  }

  const tierListForMatch = [
    '古纪',
    '前纪',
    '中纪',
    '后纪',
    '安魂',
    '先锋',
    'Lith',
    'Meso',
    'Neo',
    'Axi',
    'Requiem',
    'Vanguard',
  ].map(t => normalizeName(t))
  const tier = tierListForMatch.find(t => input.startsWith(t))
  if (!tier) {
    return failure('relic.invalidName')
  }

  const category = input
    .replace(new RegExp(`^${tier}`), '')
    .replace(/遗物$|relic$/, '')

  const zhTierMap = {
    古纪: 'Lith',
    前纪: 'Meso',
    中纪: 'Neo',
    后纪: 'Axi',
    安魂: 'Requiem',
    先锋: 'Vanguard',
  }
  const enTier = zhTierMap[tier as keyof typeof zhTierMap] ?? tier
  const key = normalizeName(enTier + category)
  return relics[key] ? { ok: true, data: relics[key] } : failure('relic.notFound')
}

export function getArbitrations(day: number = 3): WarframeResult<Arbitration[]> {
  if (day > 14 || day <= 0) {
    return failure('arbitration.invalidDayRange')
  }

  const currentHourTimeStamp = Math.floor(
    new Date().setUTCMinutes(0, 0, 0) / 1000,
  )
  const currentHourIndex = arbitrationSchedule.findIndex(
    a => a.time === currentHourTimeStamp,
  )
  const weekArbys = arbitrationSchedule.slice(
    currentHourIndex,
    currentHourIndex + 24 * day,
  )
  return {
    ok: true,
    data: weekArbys
      .filter(a => arbyRewards[a.node])
      .map((a) => {
        const obj = regionToShort(ExportRegions[a.node], dict_zh)
        return {
          ...obj,
          time: new Date(a.time * 1000).toLocaleString('zh-cn', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            // minute: 'numeric', // 保持注释或删除，以去除分钟
            // second: 'numeric', // 保持注释或删除，以去除秒
            hour12: false, // 统一使用 24 小时制
            // hourCycle: 'h23' // 另一种设置 24 小时制的方法
            timeZone: 'Asia/Shanghai',
          }),
          rewards: arbyRewards[a.node],
        }
      }),
  }
}

export async function adaptArchonHunt(source: {
  boss: string
  missions?: Array<{
    type: string
    node?: string
    nodeKey: string
  }>
}): Promise<ArchonHunt> {
  const name = dict_zh[
    `/Lotus/Language/Narmer/${removeSpace(source.boss)}`
  ] ?? source.boss

  const missions = await Promise.all(
    (source.missions ?? []).map(async (mission, index): Promise<ArchonHuntMissions> => {
      const receivedType = await getMissionTypeKey(mission.type)
      const type = dict_zh[ExportMissionTypes[receivedType]?.name ?? ''] ?? mission.type
      const solNodeKey = await getSolNodeKey(mission.nodeKey)
      const region = solNodeKey ? ExportRegions[solNodeKey] : undefined
      const levels = getArchonHuntEnemyLevels(index)

      const node = region
        ? regionToShort(region, dict_zh)
        : {
            name: mission.node ?? mission.nodeKey,
            system: '',
            type: '',
            faction: '',
            minLevel: 0,
            maxLevel: 0,
          }

      return {
        type,
        node: {
          ...node,
          minLevel: levels.minLevel,
          maxLevel: levels.maxLevel,
        },
      }
    }),
  )

  return {
    modeName: getArchonHuntModeName(),
    name,
    missions,
  }
}

function mongoDateMs(value?: { $date?: { $numberLong?: string } }): number | undefined {
  const raw = value?.$date?.$numberLong
  if (!raw) {
    return undefined
  }
  const ms = Number(raw)
  return Number.isFinite(ms) ? ms : undefined
}

export async function adaptSortie(
  source: RawSortie,
  dates?: { activation?: Date, expiry?: Date },
): Promise<Sortie> {
  const expiryMs = dates?.expiry?.getTime() ?? mongoDateMs(source.Expiry) ?? 0
  const missions = await Promise.all(
    (source.Variants ?? []).map(async (variant, index): Promise<SortieMission> => {
      const missionType = variant.missionType ?? ''
      const receivedType = (await getMissionTypeKey(missionType)) || missionType
      const type = dict_zh[ExportMissionTypes[receivedType]?.name ?? ''] ?? missionType
      const nodeId = variant.node ?? ''
      const solNodeKey = (await getSolNodeKey(nodeId)) || nodeId
      const region = solNodeKey ? ExportRegions[solNodeKey] : undefined
      const levels = getSortieEnemyLevels(index)
      const node = region
        ? {
            ...regionToShort(region, dict_zh),
            minLevel: levels.minLevel,
            maxLevel: levels.maxLevel,
          }
        : {
            name: nodeId,
            system: '',
            type: '',
            faction: '',
            minLevel: levels.minLevel,
            maxLevel: levels.maxLevel,
          }

      return {
        type,
        node,
        modifier: await translateSortieModifier(variant.modifierType ?? ''),
      }
    }),
  )

  const bossKey = source.Boss ?? ''
  return {
    modeName: getSortieModeName(),
    boss: await translateSortieBoss(bossKey),
    faction: await translateSortieFaction(bossKey),
    expiry: expiryMs,
    remaining: msToHumanReadable(expiryMs - Date.now()),
    missions,
  }
}

export async function getSortieFrom(snapshot?: {
  raw?: { sortie?: { activation?: Date, expiry?: Date } }
  sortieRaw?: RawSortie
}): Promise<WarframeResult<Sortie>> {
  if (!snapshot?.raw) {
    return failure('common.fetchFailed', true)
  }

  const raw = snapshot.sortieRaw
  if (!raw) {
    return failure('sortie.unavailable')
  }

  const parsed = snapshot.raw.sortie
  const expiryMs = parsed?.expiry?.getTime() ?? mongoDateMs(raw.Expiry)
  if (expiryMs === undefined || expiryMs <= Date.now()) {
    return failure('sortie.unavailable')
  }

  return {
    ok: true,
    data: await adaptSortie(raw, {
      activation: parsed?.activation,
      expiry: parsed?.expiry,
    }),
  }
}

export async function getSortie(): Promise<WarframeResult<Sortie>> {
  try {
    return await getSortieFrom(await globalWorldState.get())
  }
  catch {
    return failure('common.fetchFailed', true)
  }
}

export async function getWeekly(): Promise<WarframeResult<{
  archonHunt: ArchonHunt
  deepArchimedea: ArchiMedea
  temporalArchimedea: ArchiMedea
}>> {
  const { raw: worldState } = await globalWorldState.get()
  if (!worldState) {
    return failure('common.fetchFailed', true)
  }

  const archon = await adaptArchonHunt(worldState.archonHunt)

  const stringToDebuff = (
    key: string,
    name: string,
    prefix: string,
  ): ArchiMedeaDebuff => {
    const keyToName = dictZhExtra[`${prefix}${key}`]

    if (!keyToName) {
      for (const transKey in dictEnExtra) {
        if (dictEnExtra[transKey] === name) {
          return {
            name: dictZhExtra[transKey],
            desc: dictZhExtra[`${transKey}_Desc`],
          }
        }
      }
    }

    const riskDesc
      = dictZhExtra[`${prefix}${key}_Desc`]
    return {
      name: keyToName,
      desc: riskDesc,
    }
  }

  const deepArchim = worldState.archimedeas[0]
  const deepArchimMissions = await Promise.all(
    deepArchim.missions.map(async (m): Promise<ArchiMedeaMission> => {
      const receivedType = await getMissionTypeKey(m.missionType)
      const type
        = dict_zh[ExportMissionTypes[receivedType]?.name ?? ''] ?? m.missionType
      const deviation = stringToDebuff(
        m.deviation.key,
        m.deviation.name,
        '/Lotus/Language/Conquest/MissionVariant_LabConquest_',
      )
      const risks = m.risks.map(r =>
        stringToDebuff(r.key, r.name, '/Lotus/Language/Conquest/Condition_'),
      )

      return {
        type,
        deviation,
        risks,
      }
    }),
  )
  const deepArchimPersonalModifier = deepArchim.personalModifiers.map(p =>
    stringToDebuff(p.key, p.name, '/Lotus/Language/Conquest/PersonalMod_'),
  )
  const deepArchimRes: ArchiMedea = {
    name: '深层科研',
    missions: deepArchimMissions,
    peronal: deepArchimPersonalModifier,
  }

  const temporalArchim = worldState.archimedeas[1]
  const temporalArchimMissions = await Promise.all(
    temporalArchim.missions.map(async (m): Promise<ArchiMedeaMission> => {
      const receivedType = await getMissionTypeKey(m.missionType)
      const type
        = dict_zh[ExportMissionTypes[receivedType]?.name ?? ''] ?? receivedType
      const deviation = stringToDebuff(
        m.deviation.key,
        m.deviation.name,
        '/Lotus/Language/Conquest/MissionVariant_HexConquest_',
      )
      const risks = m.risks.map(r =>
        stringToDebuff(r.key, r.name, '/Lotus/Language/Conquest/Condition_'),
      )

      return {
        type,
        deviation,
        risks,
      }
    }),
  )
  const temporalArchimPersonalModifier = temporalArchim.personalModifiers.map(
    p =>
      stringToDebuff(p.key, p.name, '/Lotus/Language/Conquest/PersonalMod_'),
  )
  const temporalArchimRes: ArchiMedea = {
    name: '时光科研',
    missions: temporalArchimMissions,
    peronal: temporalArchimPersonalModifier,
  }

  return {
    ok: true,
    data: {
      archonHunt: archon,
      deepArchimedea: deepArchimRes,
      temporalArchimedea: temporalArchimRes,
    },
  }
}

export async function getBounty(
  location: BountyLocation,
): Promise<WarframeResult<BountyBoard>> {
  if (oracleBountyLocations.has(location)) {
    const cycle = await globalOracleBountyCycle.get()
    if (!cycle) {
      return failure('common.fetchFailed', true)
    }

    const board = adaptOracleBountyBoard(
      location as 'zariman' | 'cavia' | 'hex',
      cycle,
    )
    if (!board) {
      return failure('bounty.unavailable')
    }
    return { ok: true, data: board }
  }

  const { syndicateMissionsRaw } = await globalWorldState.get()
  if (!syndicateMissionsRaw) {
    return failure('common.fetchFailed', true)
  }

  const mission = findRawSyndicateMission(syndicateMissionsRaw, location)
  if (!mission) {
    return failure('common.fetchFailed', true)
  }

  const board = adaptBountyBoard(location, mission)
  if (!board) {
    return failure('bounty.unavailable')
  }

  return { ok: true, data: board }
}

export function getCircuitWeek(): {
  currentIncarnons: number
  currentWarframes: number
  allIncarnons: string[][]
  allWarframes: string[][]
} {
  const EPOCH = 1734307200 * 1000
  const week = Math.trunc((Date.now() - EPOCH) / 604800000)
  const index1 = (week + 1) % incarnonRewards.length
  const index2 = (week + 8) % warframeRewards.length
  const incarnons = incarnonRewards.map(v => v.map(i => dict_zh[i]))
  const warframes = warframeRewards.map(v => v.map(i => dict_zh[i]))
  return {
    currentIncarnons: index1,
    currentWarframes: index2,
    allIncarnons: incarnons,
    allWarframes: warframes,
  }
}
