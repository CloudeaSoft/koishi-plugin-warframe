import type { WeeklyRiven } from 'warframe-weekly-rivens'

import type {
  Arbitration,
  ArchiMedea,
  ArchiMedeaDebuff,
  ArchiMedeaMission,
  ArchonHunt,
  Fissure,
  OcrAPISecret,
  Relic,
  RivenAttribute,
  RivenStatAnalyzeResult,
  RivenStatAnalyzsis,
  RivenStatCountType,
  RivenStatResult,
  RivenWeaponType,
  VoidTrader,
  WarframeResult,
} from '../types'

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
} from '../assets/index'
import { arbitrationSchedule } from '../data/wf/arbitrationSchedule'
import { globalWorldState } from '../data/wf/globalWorldState'
import { relics } from '../data/wf/relics'
import { rivenAttrValueDict } from '../data/wf/rivenBaseValues'
import { weaponRivenDispositionDict } from '../data/wf/rivenDisposition'
import { rivenStatFixFactor } from '../data/wf/rivenStatData'
import { globalRivenAttribute } from '../data/wfm/globalRivenAttribute'
import { globalRivenItemData } from '../data/wfm/globalRivenItem'
import { extractTextFromImage } from '../infrastructure/ocr-api'
import { regionToShort } from '../infrastructure/wf/wf-export-adapter'
import {
  getMissionTypeKey,
  getVoidTraderItem,
} from '../infrastructure/wf/wfcd-adapter'
import { failure } from '../types/warframe-result'
import {
  fetchAsyncImage,
  msToHumanReadable,
  normalizeName,
  normalSimilarity,
  removeSpace,
  tokenSimilarity,
} from '../utils'

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

export async function getWeekly(): Promise<WarframeResult<{
  archonHunt: ArchonHunt
  deepArchimedea: ArchiMedea
  temporalArchimedea: ArchiMedea
}>> {
  const snapshot = await globalWorldState.get()
  if (!snapshot) {
    return failure('common.fetchFailed', true)
  }
  const { raw: worldState } = snapshot

  const archon: ArchonHunt = {
    name: dict_zh[
      `/Lotus/Language/Narmer/${removeSpace(worldState.archonHunt.boss)}`
    ],
    missions: [],
  }

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

export async function getEnvironment(): Promise<string> {
  const snapshot = await globalWorldState.get()
  if (!snapshot) {
    return '内部错误，获取最新信息失败'
  }
  const { raw: worldState } = snapshot

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

export async function getFissures(): Promise<WarframeResult<Fissure[]>> {
  const snapshot = await globalWorldState.get()
  return snapshot
    ? { ok: true, data: snapshot.fissures }
    : failure('common.fetchFailed', true)
}

export async function getSteelPathFissures(): Promise<WarframeResult<Fissure[]>> {
  const snapshot = await globalWorldState.get()
  return snapshot
    ? { ok: true, data: snapshot.spFissures }
    : failure('common.fetchFailed', true)
}

export async function getRailjackFissures(): Promise<WarframeResult<Fissure[]>> {
  const snapshot = await globalWorldState.get()
  return snapshot
    ? { ok: true, data: snapshot.rjFissures }
    : failure('common.fetchFailed', true)
}

export async function getAnalyzedRiven(secret: OcrAPISecret, url: string): Promise<WarframeResult<RivenStatAnalyzeResult>> {
  const img = await fetchAsyncImage(url)
  if (!img) {
    return failure('riven.imageFetchFailed', true)
  }

  const extractResult = await extractTextFromImage(img, secret)
  if (!extractResult) {
    return failure('riven.imageParseFailed')
  }

  const parseResult = await parseOCRResult(extractResult)
  if (
    !parseResult
    || parseResult.attributes.length < 2
    || parseResult.attributes.length > 4
  ) {
    return failure('riven.imageParseFailed')
  }

  return analyzeRivenStat(parseResult)
}

export async function getVoidTrader(): Promise<WarframeResult<VoidTrader>> {
  const snapshot = await globalWorldState.get()
  if (!snapshot) {
    return failure('common.fetchFailed', true)
  }
  const { raw: worldState } = snapshot

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

export function filterWeeklyRivens(
  data: WeeklyRiven[],
  minPrice: number,
  minPop = 5,
): WeeklyRiven[] {
  const median = (item: WeeklyRiven): number => item.median ?? item.avg

  return data
    .filter(
      (item) => {
        return !item.rerolled
          && median(item) >= minPrice
          && item.pop >= minPop
      },
    )
    .sort((a, b) => {
      if (median(b) !== median(a)) {
        return median(b) - median(a)
      }
      if (b.pop !== a.pop) {
        return b.pop - a.pop
      }
      return b.avg - a.avg
    })
}

export async function getWeeklyRivens(
  minPrice: number,
): Promise<WeeklyRiven[]> {
  const { createClient } = await import('warframe-weekly-rivens')
  const client = createClient()
  const data = await client.getLatestWeeklyRivens('PC')
  const result = filterWeeklyRivens(data, minPrice, 5)

  const { globalRivenItemDict, globalRivenItemNameToSlugDict } = await globalRivenItemData.get()
  return result.map((e) => {
    const slug = e.compatibility ? globalRivenItemNameToSlugDict[normalizeName(e.compatibility)] : undefined
    const item = slug ? globalRivenItemDict[slug] : undefined
    const compatibility = item?.i18n?.['zh-hans']?.name

    return {
      ...e,
      compatibility: compatibility ?? e.compatibility,
    }
  })
}

export async function getStaticRivenStats(weaponType: string, statType: string, disposition: number): Promise<WarframeResult<RivenStatResult>> {
  // Process inputs
  if (disposition > 1.55 || disposition < 0.5) {
    return failure('riven.dispositionError')
  }

  const weaponTypes = [
    '步枪',
    '手枪',
    '霰弹枪',
    'Archwing枪械',
    '近战',
    'Rifle',
    'Shotgun',
    'Pistol',
    'Archgun',
    'Melee',
  ]
  const matchedWeaponType = weaponTypes.find(v =>
    normalizeName(v).startsWith(normalizeName(weaponType)),
  )
  if (!matchedWeaponType) {
    return failure('riven.weaponTypeError')
  }

  const weaponTypeKeys: Record<string, RivenWeaponType> = {
    步枪: 'Rifle',
    手枪: 'Pistol',
    霰弹枪: 'Shotgun',
    近战: 'Melee',
    Archwing枪械: 'Archgun',
  }

  const weaponTypeKey = weaponTypeKeys[matchedWeaponType] ?? matchedWeaponType

  const statTypes: RivenStatCountType[] = ['2', '3', '21', '31']
  if (!statTypes.includes(statType as RivenStatCountType)) {
    return failure('riven.statTypeError')
  }

  const rivenAttrValues = rivenAttrValueDict[weaponTypeKey]
  const factor = rivenStatFixFactor[statType as RivenStatCountType]
  const result: RivenStatResult = {
    positive: {},
    negative: factor.curseCount > 0 ? {} : undefined,
  }

  const { globalRivenAttributeList } = await globalRivenAttribute.get()
  for (const key in rivenAttrValues) {
    const data = globalRivenAttributeList.find(
      v => normalizeName(v.i18n.en.name) === key,
    )
    const baseValue = rivenAttrValues[key]
    const buffValue = baseValue * disposition * factor.buffFactor
    result.positive[key] = {
      name: data?.i18n['zh-hans'].name ?? key,
      max: buffValue * 1.1,
      min: buffValue * 0.9,
      unit: data?.unit ?? '',
    }

    if (result.negative) {
      const curseValue = baseValue * disposition * factor.curseFactor
      result.negative[key] = {
        name: data?.i18n['zh-hans'].name ?? key,
        max: curseValue * 0.9,
        min: curseValue * 1.1,
        unit: data?.unit ?? '',
      }
    }
  }

  return { ok: true, data: result }
}

// ================ privates ===================

export function getWeaponRivenDisposition(
  name: string,
): (typeof weaponRivenDispositionDict)[string] | undefined {
  const normalizedName = normalizeName(name)
  const normalRes = weaponRivenDispositionDict[normalizedName]
  if (normalRes) {
    return normalRes
  }

  const withPrimeSuffix = `${normalizedName}prime`
  const withPrimeRes = weaponRivenDispositionDict[withPrimeSuffix]
  if (withPrimeRes) {
    return withPrimeRes
  }

  return undefined
}

export async function parseOCRResult(ocrResult: string[]): Promise<
  | {
    name: string
    attributes: {
      attr: RivenAttribute
      value: number
      prefix: string
    }[]
  }
  | undefined
> {
  const { globalRivenAttributeList } = await globalRivenAttribute.get()

  const list = ocrResult
  if (!list.length) {
    return
  }

  function similarity(standard: string, input: string): number {
    if (!standard || !input) {
      return 0
    }

    standard = normalizeName(standard)
    input = normalizeName(input)

    if (input === '伤害') {
      return standard === '基础伤害' ? 1 : 0
    }

    if (input === '弹药最大值') {
      return standard === '弹药上限' ? 1 : 0
    }

    if (standard === '基础伤害' && /^伤害$|近战伤害/.test(input)) {
      return 1
    }

    if (standard === '暴击率') {
      standard = '暴击几率'
    }

    if (
      standard.includes(input)
      || input.includes(standard)
      || standard.split('/').some(x => !!x && input.includes(x))
    ) {
      return 1
    }

    const t = tokenSimilarity(standard, input)
    const s = normalSimilarity(standard, input)
    return Math.max(t, s)
  }

  const texts = list
  const attributes: {
    attr: RivenAttribute
    value: number
    prefix: string
  }[] = []
  const statLines: string[] = []
  for (const t of texts) {
    if (!t || !/^[x+-]|^\d/.test(t)) {
      continue
    }

    const prefix = /^[x+-]/.test(t) ? t[0] : ''

    const attrNamePart = removeSpace(t ?? '').replace(/^[^\u4E00-\u9FA5]+/u, '')
    const attr = globalRivenAttributeList.find((a) => {
      if (!a)
        return false

      const zhName = a.i18n['zh-hans']?.name
      if (!zhName)
        return false
      const sim = similarity(zhName, attrNamePart)
      if (sim < 0.8)
        return false

      return true
    })

    if (!attr) {
      continue
    }

    statLines.push(t)

    const value = (function extractStatValue(text) {
      // Normalize
      const t = text.replace(/\s+/g, '')

      // Case 1: multiply format like "x1.07"
      const multMatch = t.match(/x(\d+(?:\.\d+)?)/i)
      if (multMatch) {
        return {
          value: Number.parseFloat(multMatch[1]),
          type: 'multiply',
        }
      }

      // Case 2: percentage format like "+15.8%" or "-12%"
      const percentMatch = t.match(/([+-]?\d+(?:\.\d+)?)%/)
      if (percentMatch) {
        return {
          value: Number.parseFloat(percentMatch[1]),
          type: 'percent',
        }
      }

      // Case 3: plain number (rare but possible)
      const numMatch = t.match(/([+-]?\d+(?:\.\d+)?)/)
      if (numMatch) {
        return {
          value: Number.parseFloat(numMatch[1]),
          type: 'number',
        }
      }

      return undefined
    })(t)
    if (!value) {
      return undefined
    }

    attributes.push({ attr, value: value.value, prefix })
  }

  const weaponName = (function extractWeaponName(ocrData: string[]) {
    const rejectPatterns = [
      /%/,
      /x\d/i,
      /\d/, // numbers, %, multipliers
      /伤害/,
      /暴击/,
      /射速/,
      /攻击/,
      /后坐力/,
      /段位/,
      /加倍/,
      /效/,
      /武器/,
      /果/,
      /\)/,
      /\(/, // junk OCR fragments
    ]

    // Step 1: filter out obvious non-name items
    const candidates = ocrData.filter((str) => {
      const s = str.trim()

      // reject pure numbers
      if (/^\d+$/.test(s))
        return false

      // reject lines with % or multipliers
      if (/[+%]/.test(s))
        return false

      // must contain at least some letters (Latin or Chinese)
      if (!/[A-Z\u4E00-\u9FA5]/i.test(s))
        return false

      // reject anything containing stat words or junk
      if (rejectPatterns.some(p => p.test(s)))
        return false

      return true
    })

    // Step 2: merge adjacent fragments (common OCR issue)
    const merged = candidates.join('')

    function removeRivenSuffix(name: string): string {
      // Remove spaces
      const s = name.replace(/\s+/g, '')

      // Pattern: <latin>-<latin> at the end
      // Example: Pura-cronitis | Acricron | Visisaticron
      const rivenPattern = /(?:[A-Z]+-[A-Z]+|[A-Z]{2,})$/i

      return s.replace(rivenPattern, '')
    }

    return merged ? removeRivenSuffix(merged) : null
  })(texts.filter(t => !statLines.includes(t)))

  if (!weaponName || !attributes.length) {
    return undefined
  }

  return {
    name: weaponName,
    attributes,
  }
}

export function analyzeRivenStat(parseResult: {
  name: string
  attributes: {
    attr: RivenAttribute
    value: number
    prefix: string
  }[]
}): WarframeResult<RivenStatAnalyzeResult> {
  const weaponRiven = getWeaponRivenDisposition(parseResult.name)
  if (!weaponRiven) {
    return failure('riven.weaponNotFound', false, {
      weapon: parseResult.name,
    })
  }

  const disposition = weaponRiven.calc.disposition
  const weaponType = weaponRiven.calc.riventype
  const rivenStatCountType: RivenStatCountType = (function () {
    if (parseResult.attributes.length === 4) {
      return '31'
    }
    else if (parseResult.attributes.length === 2) {
      return '2'
    }

    const firstStat = parseResult.attributes[0]
    const firstStatBaseValue
      = rivenAttrValueDict[weaponType][
        normalizeName(firstStat.attr.i18n.en.name)
      ]

    // Use the lowest value of 2_1 type riven to check the first stat
    if (firstStat.value >= firstStatBaseValue * 1.2375 * 0.9 * disposition) {
      return '21'
    }
    else {
      return '3'
    }
  })()

  const { buffFactor, buffCount, curseFactor, curseCount }
    = rivenStatFixFactor[rivenStatCountType]

  const buffs: RivenStatAnalyzsis[] = []
  for (let i = 0; i < buffCount; i++) {
    const attr = parseResult.attributes[i]
    const baseValue
      = rivenAttrValueDict[weaponType][normalizeName(attr.attr.i18n.en.name)]
    const value = attr.attr.unit === 'multiply' ? attr.value - 1 : attr.value
    const standardValue = baseValue * buffFactor * disposition
    const percent = (value - standardValue) / standardValue
    buffs.push({
      name: attr.attr.i18n['zh-hans'].name,
      unit: attr.attr.unit,
      value: attr.value,
      percent,
      max: standardValue * 1.1,
      min: standardValue * 0.9,
    })
  }

  const curses: RivenStatAnalyzsis[] = []
  if (curseCount > 0) {
    for (let i = buffCount; i < buffCount + curseCount; i++) {
      const attr = parseResult.attributes[i]
      const baseValue
        = rivenAttrValueDict[weaponType][
          normalizeName(attr.attr.i18n.en.name)
        ]
      const value = attr.attr.unit === 'multiply' ? attr.value - 1 : attr.value
      const standardValue = baseValue * curseFactor * disposition
      const percent = ((value - standardValue) / standardValue) * -1
      curses.push({
        name: attr.attr.i18n['zh-hans'].name,
        unit: attr.attr.unit,
        value: attr.value,
        percent,
        max: standardValue * 0.9,
        min: standardValue * 1.1,
      })
    }
  }

  return {
    ok: true,
    data: {
      name: weaponRiven.name.zh,
      disposition,
      buffs,
      curses,
    },
  }
}
