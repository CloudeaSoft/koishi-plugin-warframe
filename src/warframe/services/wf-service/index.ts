import type { TFaction } from 'warframe-public-export-plus'

import type {
  AlertBoard,
  AlertInfo,
  Arbitration,
  ArchiMedea,
  ArchiMedeaDebuff,
  ArchiMedeaMission,
  ArchonHunt,
  ArchonHuntMissions,
  BountyBoard,
  BountyLocation,
  CalendarBoard,
  Fissure,
  Invasion,
  InvasionBoard,
  InvasionFactionTone,
  InvasionSide,
  NightwaveBoard,
  RawCalendarSeason,
  RawInvasion,
  RawSeasonInfo,
  RawSortie,
  RawSteelPathOfferings,
  Relic,
  Sortie,
  SortieMission,
  SteelEssenceBoard,
  SteelEssenceOfferingInfo,
  VoidTrader,
  WarframeResult,
} from '../../types'

import {
  dict_zh,
  ExportFactions,
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
  resolveExportItemNameZh,
} from '../../infrastructure/wf/bounty-adapter'
import { adaptCalendar as mapCalendar } from '../../infrastructure/wf/calendar-adapter'
import { adaptNightwave } from '../../infrastructure/wf/nightwave-adapter'
import { regionToShort } from '../../infrastructure/wf/wf-export-adapter'
import {
  getMissionTypeKey,
  getSolNodeKey,
  getSteelPathCatalogs,
  getVoidTraderItem,
  translateLanguageString,
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

export { adaptEvents, getEvents, getEventsFrom } from './wf-service.event'
export {
  analyzeRivenStat,
  filterWeeklyRivens,
  getAnalyzedRiven,
  getStaticRivenStats,
  getWeaponRivenDisposition,
  getWeeklyRivens,
  parseOCRResult,
} from './wf-service.riven'

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

export function resolveNightwave(
  raw: RawSeasonInfo | undefined,
  now: number = Date.now(),
): WarframeResult<NightwaveBoard> {
  if (!raw) {
    return failure('nightwave.unavailable')
  }

  return { ok: true, data: adaptNightwave(raw, now) }
}

export async function getNightwave(): Promise<WarframeResult<NightwaveBoard>> {
  try {
    const { seasonInfoRaw } = await globalWorldState.get()
    return resolveNightwave(seasonInfoRaw)
  }
  catch {
    return failure('common.fetchFailed', true)
  }
}

export async function getEnvironment(): Promise<string> {
  const { raw: worldState } = await globalWorldState.get()
  if (!worldState) {
    return '内部错误，获取最新信息失败'
  }

  const cetusDay = worldState.cetusCycle.isDay ? '白天' : '黑夜'
  const cetus = `地球/夜灵平野: ${cetusDay} ${worldState.cetusCycle.timeLeft}`

  const vallisState = worldState.vallisCycle.isWarm ? '温暖' : '寒冷'
  const vallis = `奥布山谷: ${vallisState} ${worldState.vallisCycle.timeLeft}`

  const cambionState = worldState.cambionCycle.state
    ? worldState.cambionCycle.state.charAt(0).toUpperCase()
    + worldState.cambionCycle.state.slice(1)
    : '未知'
  const cambion = `魔胎之境: ${cambionState} ${worldState.cambionCycle.timeLeft}`

  const duviriStateTransDict = {
    sorrow: '悲伤',
    fear: '恐惧',
    joy: '喜悦',
    anger: '愤怒',
    envy: '嫉妒',
  }
  const duviriState
    = duviriStateTransDict[
      worldState.duviriCycle.state as keyof typeof duviriStateTransDict
    ] ?? worldState.duviriCycle.state
  const duviri = `双衍王境: ${duviriState} ${worldState.duviriCycle.endString}`

  const zarimanFaction = worldState.zarimanCycle.isCorpus
    ? 'Corpus'
    : 'Grineer'
  const zariman = `扎里曼号: ${zarimanFaction} ${worldState.zarimanCycle.timeLeft}`

  return `当前环境:\n${cetus}\n${vallis}\n${cambion}\n${duviri}\n${zariman}`
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

const INVASION_TITLE_KEY = '/Lotus/Language/Menu/WorldStatePanel_Invasions'
const INFESTED_INVASION_BOSS_TAG = '/Lotus/Language/Menu/InfestedInvasionBoss'

function invasionProgress(count: number, goal: number, vsInfested: boolean): number {
  const scale = vsInfested ? 1 : 0.5
  return goal ? Math.min(1, Math.max(0, (1 + count / goal) * scale)) : scale
}

function invasionTone(faction?: string): InvasionFactionTone {
  if (/grineer/i.test(faction ?? '')) {
    return 'grineer'
  }
  if (/corpus/i.test(faction ?? '')) {
    return 'corpus'
  }
  if (/infest/i.test(faction ?? '')) {
    return 'infested'
  }
  return 'other'
}

function invasionSide(
  faction: string | undefined,
  reward: RawInvasion['AttackerReward'],
): InvasionSide {
  const rewards = !reward || Array.isArray(reward)
    ? []
    : [
        ...(reward.items ?? []).map(item => ({ name: resolveExportItemNameZh(item), count: 1 })),
        ...(reward.countedItems ?? []).map(item => ({
          name: resolveExportItemNameZh(item.ItemType),
          count: item.ItemCount,
        })),
        ...(reward.credits && reward.credits > 0
          ? [{ name: resolveExportItemNameZh(`/${reward.credits}Credits`), count: 1 }]
          : []),
      ]
  const nameKey = faction ? ExportFactions[faction as TFaction]?.name ?? faction : undefined
  return {
    faction: nameKey ? (dict_zh[nameKey] ?? dictZhExtra[nameKey] ?? '') : '',
    tone: invasionTone(faction),
    rewards,
  }
}

export async function adaptInvasions(rawInvasions: RawInvasion[]): Promise<InvasionBoard> {
  const drafts: Array<Invasion & {
    systemIndex: number
    locTag: string
    campaign: string
    count: number
    goal: number
  }> = []

  for (const raw of rawInvasions) {
    if (raw.Completed) {
      continue
    }

    const count = raw.Count ?? 0
    const goal = raw.Goal ?? 0
    const vsInfested = [
      raw.Faction,
      raw.DefenderFaction,
      raw.AttackerMissionInfo?.faction,
      raw.DefenderMissionInfo?.faction,
    ].some(faction => /infest/i.test(faction ?? ''))
    const nodeId = raw.Node
    const solNodeKey = ExportRegions[nodeId] ? nodeId : await getSolNodeKey(nodeId)
    const region = solNodeKey ? ExportRegions[solNodeKey] : undefined
    const short = region ? regionToShort(region, dict_zh) : undefined
    const locTag = raw.LocTag ?? ''

    drafts.push({
      id: raw._id?.$oid ?? raw._id?.$id ?? raw.Node,
      planet: short?.system ?? '',
      node: short?.name ?? '',
      systemIndex: region?.systemIndex ?? Number.MAX_SAFE_INTEGER,
      locTag,
      campaign: locTag
        ? (dict_zh[locTag] ?? dictZhExtra[locTag] ?? await translateLanguageString(locTag))
        : '',
      count,
      goal,
      attacker: invasionSide(raw.DefenderMissionInfo?.faction ?? raw.Faction, raw.AttackerReward),
      defender: invasionSide(raw.AttackerMissionInfo?.faction ?? raw.DefenderFaction, raw.DefenderReward),
      vsInfestation: vsInfested,
      completion: invasionProgress(count, goal, vsInfested),
    })
  }

  const groups = new Map<string, typeof drafts>()
  for (const draft of drafts) {
    const key = /InfestedInvasion/i.test(draft.locTag)
      ? `${draft.planet}\0infested`
      : `${draft.planet}\0${draft.locTag}`
    groups.set(key, [...(groups.get(key) ?? []), draft])
  }

  return {
    title: dict_zh[INVASION_TITLE_KEY] ?? dictZhExtra[INVASION_TITLE_KEY] ?? INVASION_TITLE_KEY,
    planets: [...groups.values()]
      .sort((a, b) => a[0].systemIndex - b[0].systemIndex)
      .map((list) => {
        const boss = list.filter(draft => draft.locTag === INFESTED_INVASION_BOSS_TAG)
        const ordered = [...boss, ...list.filter(draft => draft.locTag !== INFESTED_INVASION_BOSS_TAG)]
        return {
          planet: ordered[0].planet,
          title: (boss[0] ?? ordered[0]).campaign,
          completion: invasionProgress(
            list.reduce((sum, draft) => sum + draft.count, 0),
            list.reduce((sum, draft) => sum + draft.goal, 0),
            list.some(draft => draft.vsInfestation),
          ),
          invasions: ordered.map(({
            id,
            planet,
            node,
            attacker,
            defender,
            vsInfestation,
            completion,
          }) => ({
            id,
            planet,
            node,
            attacker,
            defender,
            vsInfestation,
            completion,
          })),
        }
      }),
  }
}

export async function getInvasionsFrom(snapshot?: {
  raw?: unknown
  invasionsRaw?: RawInvasion[]
}): Promise<WarframeResult<InvasionBoard>> {
  if (!snapshot?.raw) {
    return failure('common.fetchFailed', true)
  }

  const data = await adaptInvasions(snapshot.invasionsRaw ?? [])
  if (data.planets.length === 0) {
    return failure('invasion.unavailable')
  }

  return { ok: true, data }
}

export async function getInvasions(): Promise<WarframeResult<InvasionBoard>> {
  try {
    return await getInvasionsFrom(await globalWorldState.get())
  }
  catch {
    return failure('common.fetchFailed', true)
  }
}

const ALERT_TITLE_KEY = '/Lotus/Language/Menu/AlertPopup_Alert'
const ALERT_NIGHTMARE_KEY = '/Lotus/Language/Menu/NightmareModeName'

export async function adaptAlerts(
  alerts: readonly {
    expiry?: Date
    mission?: {
      nodeKey?: string
      typeKey?: string
      minEnemyLevel?: number
      maxEnemyLevel?: number
      nightmare?: boolean
      reward?: {
        items?: string[]
        countedItems?: Array<{ type?: string, key?: string, count?: number }>
        credits?: number
      }
    }
  }[] = [],
  now: number = Date.now(),
): Promise<AlertBoard> {
  const adapted: AlertInfo[] = []
  for (const raw of alerts) {
    const expiry = raw.expiry?.getTime() ?? 0
    if (expiry <= now) {
      continue
    }

    const mission = raw.mission ?? {}
    const typeKey = mission.typeKey ?? ''
    const receivedType = await getMissionTypeKey(typeKey)
    const nodeKey = mission.nodeKey ?? ''
    const solNodeKey = await getSolNodeKey(nodeKey)
    const region = solNodeKey ? ExportRegions[solNodeKey] : undefined
    const short = region
      ? regionToShort(region, dict_zh)
      : {
          name: nodeKey,
          system: '',
          type: '',
          faction: '',
          minLevel: 0,
          maxLevel: 0,
        }

    const reward = mission.reward
    const rewards: AlertInfo['rewards'] = []
    for (const item of reward?.items ?? []) {
      rewards.push({
        name: item.startsWith('/Lotus') ? resolveExportItemNameZh(item) : item,
        count: 1,
      })
    }
    for (const item of reward?.countedItems ?? []) {
      const source = item.key ?? item.type ?? ''
      if (!source) {
        continue
      }
      rewards.push({
        name: source.startsWith('/Lotus') ? resolveExportItemNameZh(source) : source,
        count: item.count ?? 1,
      })
    }
    if (reward?.credits && reward.credits > 0) {
      rewards.push({
        name: resolveExportItemNameZh(`/${reward.credits}Credits`),
        count: 1,
      })
    }

    const nightmare = mission.nightmare
      ? dict_zh[ALERT_NIGHTMARE_KEY] ?? dictZhExtra[ALERT_NIGHTMARE_KEY]
      : undefined

    adapted.push({
      type: dict_zh[ExportMissionTypes[receivedType]?.name ?? ''] ?? typeKey,
      node: {
        ...short,
        minLevel: mission.minEnemyLevel ?? 0,
        maxLevel: mission.maxEnemyLevel ?? 0,
      },
      rewards,
      remaining: msToHumanReadable(expiry - now),
      expiry,
      ...(nightmare ? { nightmare } : {}),
    })
  }

  return {
    title: dict_zh[ALERT_TITLE_KEY] ?? dictZhExtra[ALERT_TITLE_KEY] ?? ALERT_TITLE_KEY,
    alerts: adapted,
  }
}

export async function getAlerts(): Promise<WarframeResult<AlertBoard>> {
  try {
    const { raw } = await globalWorldState.get()
    if (!raw) {
      return failure('common.fetchFailed', true)
    }

    const data = await adaptAlerts(raw.alerts ?? [])
    if (data.alerts.length === 0) {
      return failure('alert.unavailable')
    }

    return { ok: true, data }
  }
  catch {
    return failure('common.fetchFailed', true)
  }
}

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

const STEEL_ESSENCE_TESHIN_KEY = '/Lotus/Language/Bosses/Teshin'
const STEEL_ESSENCE_KEY = '/Lotus/Language/Resources/SteelEssence'
const STEEL_ESSENCE_EPOCH_MS = Date.parse('2020-11-16T00:00:00.000Z')
const STEEL_ESSENCE_WEEK_SECONDS = 604800

function steelEssenceWeekExpiryUtc(now: number): number {
  const date = new Date(now)
  const offset = date.getUTCDay() === 0 ? 6 : date.getUTCDay() - 1
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() - offset + 6,
    23,
    59,
    59,
    0,
  )
}

function steelEssenceRotationIndex(now: number, length: number): number {
  if (length <= 0) {
    return 0
  }
  const elapsed = Math.max(0, now - STEEL_ESSENCE_EPOCH_MS) / 1000
  return Math.floor(
    (elapsed % (length * STEEL_ESSENCE_WEEK_SECONDS)) / STEEL_ESSENCE_WEEK_SECONDS,
  )
}

export async function adaptSteelEssence(
  raw: RawSteelPathOfferings = {},
  now: number = Date.now(),
): Promise<SteelEssenceBoard> {
  const catalogs = await getSteelPathCatalogs()
  const rotationZh = catalogs.zh.rotation
  const rotationEn = catalogs.en.rotation
  const currentName = raw.currentReward?.name ?? ''

  let index = rotationEn.findIndex(item => item.name === currentName)
  if (index < 0) {
    index = rotationZh.findIndex(item => item.name === currentName)
  }
  if (index < 0) {
    index = steelEssenceRotationIndex(now, rotationZh.length)
  }

  const current: SteelEssenceOfferingInfo = rotationZh[index] ?? {
    name: currentName,
    cost: raw.currentReward?.cost ?? 0,
  }
  const upcoming: SteelEssenceOfferingInfo[] = rotationZh.length > 1
    ? rotationZh
        .map((_, offset) => rotationZh[(index + offset + 1) % rotationZh.length])
        .filter((item): item is SteelEssenceOfferingInfo => item !== undefined)
        .slice(0, rotationZh.length - 1)
    : []

  const expiry = raw.expiry?.getTime() ?? steelEssenceWeekExpiryUtc(now)
  const teshin = dict_zh[STEEL_ESSENCE_TESHIN_KEY]
    ?? dictZhExtra[STEEL_ESSENCE_TESHIN_KEY]
    ?? STEEL_ESSENCE_TESHIN_KEY
  const essence = dict_zh[STEEL_ESSENCE_KEY]
    ?? dictZhExtra[STEEL_ESSENCE_KEY]
    ?? STEEL_ESSENCE_KEY

  return {
    title: `${teshin} · ${essence}商店`,
    costLabel: essence,
    remaining: msToHumanReadable(expiry - now),
    expiry,
    current,
    upcoming,
  }
}

export async function getSteelEssenceFrom(
  snapshot?: { raw?: { steelPath?: RawSteelPathOfferings } },
  now: number = Date.now(),
): Promise<WarframeResult<SteelEssenceBoard>> {
  if (!snapshot?.raw) {
    return failure('common.fetchFailed', true)
  }

  const offerings = snapshot.raw.steelPath
  if (!offerings) {
    return failure('steelEssence.unavailable')
  }

  const data = await adaptSteelEssence(offerings, now)
  if (!data.current.name || data.expiry <= now) {
    return failure('steelEssence.unavailable')
  }

  return { ok: true, data }
}

export async function getSteelEssence(): Promise<WarframeResult<SteelEssenceBoard>> {
  try {
    return await getSteelEssenceFrom(await globalWorldState.get())
  }
  catch {
    return failure('common.fetchFailed', true)
  }
}

export async function getFissures(): Promise<WarframeResult<Fissure[]>> {
  const { fissures } = await globalWorldState.get()
  return fissures ? { ok: true, data: fissures } : failure('common.fetchFailed', true)
}

export async function getSteelPathFissures(): Promise<WarframeResult<Fissure[]>> {
  const { spFissures } = await globalWorldState.get()
  return spFissures ? { ok: true, data: spFissures } : failure('common.fetchFailed', true)
}

export async function getRailjackFissures(): Promise<WarframeResult<Fissure[]>> {
  const { rjFissures } = await globalWorldState.get()
  return rjFissures ? { ok: true, data: rjFissures } : failure('common.fetchFailed', true)
}

export async function getVoidTrader(): Promise<WarframeResult<VoidTrader>> {
  const { raw: worldState } = await globalWorldState.get()
  if (worldState.voidTraders.length === 0) {
    return failure('voidTrader.drifting')
  }

  const trader = worldState.voidTraders[0]

  if (trader && trader.activation && trader.activation.getTime() > Date.now()) {
    const diff = trader.activation.getTime() - Date.now()
    return failure('voidTrader.arriving', false, { time: msToHumanReadable(diff) })
  }

  const diff = trader.expiry!.getTime() - Date.now()
  const items = trader.inventory.map(getVoidTraderItem)

  return { ok: true, data: { expiry: msToHumanReadable(diff), items } }
}
