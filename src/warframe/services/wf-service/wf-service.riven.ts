import type { WeeklyRiven } from 'warframe-weekly-rivens'

import type {
  OcrAPISecret,
  RivenAttribute,
  RivenStatAnalyzeResult,
  RivenStatAnalyzsis,
  RivenStatCountType,
  RivenStatResult,
  RivenWeaponType,
  WarframeResult,
} from '../../types'

import { rivenAttrValueDict } from '../../data/wf/rivenBaseValues'
import { weaponRivenDispositionDict } from '../../data/wf/rivenDisposition'
import { rivenStatFixFactor } from '../../data/wf/rivenStatData'
import { globalRivenAttribute } from '../../data/wfm/globalRivenAttribute'
import { globalRivenItemData } from '../../data/wfm/globalRivenItem'
import { extractTextFromImage } from '../../infrastructure/ocr-api'
import { failure } from '../../types/warframe-result'
import {
  fetchAsyncImage,
  normalizeName,
  normalSimilarity,
  removeSpace,
  tokenSimilarity,
} from '../../utils'

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
      v => v.i18n?.en?.name !== undefined && normalizeName(v.i18n.en.name) === key,
    )
    const baseValue = rivenAttrValues[key]
    const buffValue = baseValue * disposition * factor.buffFactor
    result.positive[key] = {
      name: data?.i18n?.['zh-hans']?.name ?? data?.i18n?.en?.name ?? key,
      max: buffValue * 1.1,
      min: buffValue * 0.9,
      unit: data?.unit ?? '',
    }

    if (result.negative) {
      const curseValue = baseValue * disposition * factor.curseFactor
      result.negative[key] = {
        name: data?.i18n?.['zh-hans']?.name ?? data?.i18n?.en?.name ?? key,
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

      const zhName = a.i18n?.['zh-hans']?.name
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

  const lookupBaseValue = (enName: string): number | undefined =>
    rivenAttrValueDict[weaponType]?.[normalizeName(enName)]

  const buildStat = (
    entry: { attr: RivenAttribute, value: number },
    factor: number,
    invertPercent: boolean,
  ): WarframeResult<RivenStatAnalyzsis> => {
    const enName = entry.attr.i18n?.en?.name
    if (!enName) {
      return failure('riven.statTypeError')
    }

    const baseValue = lookupBaseValue(enName)
    if (baseValue === undefined) {
      return failure('riven.statTypeError')
    }

    const unit = entry.attr.unit ?? ''
    const value = unit === 'multiply' ? entry.value - 1 : entry.value
    const standardValue = baseValue * factor * disposition
    const percent = invertPercent
      ? ((value - standardValue) / standardValue) * -1
      : (value - standardValue) / standardValue

    return {
      ok: true,
      data: {
        name: entry.attr.i18n?.['zh-hans']?.name ?? enName,
        unit,
        value: entry.value,
        percent,
        max: invertPercent ? standardValue * 0.9 : standardValue * 1.1,
        min: invertPercent ? standardValue * 1.1 : standardValue * 0.9,
      },
    }
  }

  const firstStatName = parseResult.attributes[0]?.attr.i18n?.en?.name
  if (!firstStatName) {
    return failure('riven.statTypeError')
  }

  let rivenStatCountType: RivenStatCountType
  if (parseResult.attributes.length === 4) {
    rivenStatCountType = '31'
  }
  else if (parseResult.attributes.length === 2) {
    rivenStatCountType = '2'
  }
  else {
    const firstStat = parseResult.attributes[0]
    const firstStatBaseValue = lookupBaseValue(firstStatName)
    if (firstStatBaseValue === undefined) {
      return failure('riven.statTypeError')
    }

    // Use the lowest value of 2_1 type riven to check the first stat
    rivenStatCountType = firstStat.value
      >= firstStatBaseValue * 1.2375 * 0.9 * disposition
      ? '21'
      : '3'
  }

  const { buffFactor, buffCount, curseFactor, curseCount }
    = rivenStatFixFactor[rivenStatCountType]

  const buffs: RivenStatAnalyzsis[] = []
  for (let i = 0; i < buffCount; i++) {
    const result = buildStat(parseResult.attributes[i], buffFactor, false)
    if (!result.ok) {
      return result
    }
    buffs.push(result.data)
  }

  const curses: RivenStatAnalyzsis[] = []
  for (let i = buffCount; i < buffCount + curseCount; i++) {
    const result = buildStat(parseResult.attributes[i], curseFactor, true)
    if (!result.ok) {
      return result
    }
    curses.push(result.data)
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
