import type { WeeklyRiven } from 'warframe-weekly-rivens'

import type { RivenCalculationStat } from '../../infrastructure/wf/riven-export-adapter'

import type {
  OcrAPISecret,
  RivenStatAnalyzeResult,
  RivenStatAnalyzsis,
  RivenStatCountType,
  RivenStatResult,
  RivenWeaponType,
  WarframeResult,
} from '../../types'
import type { RivenCalculationAttribute } from '../../types/wf/riven'
import { rivenAttributes, rivenStatsByType } from '../../data/wf/rivenBaseValues'
import { weaponRivenDispositionDict } from '../../data/wf/rivenDisposition'
import { rivenStatFixFactor } from '../../data/wf/rivenStatData'
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

export async function getAnalyzedRiven(secret: OcrAPISecret, url: string, variant?: string): Promise<WarframeResult<RivenStatAnalyzeResult>> {
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

  return analyzeRivenStat(parseResult, variant)
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
  if (!Number.isFinite(disposition) || disposition > 1.55 || disposition < 0.5) {
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
    'Kitgun',
    'Zaw',
    '组合枪',
    '组合近战',
  ]
  if (!normalizeName(weaponType))
    return failure('riven.weaponTypeError')
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
    组合枪: 'Kitgun',
    组合近战: 'Zaw',
    Archwing枪械: 'Archgun',
  }

  const weaponTypeKey = weaponTypeKeys[matchedWeaponType] ?? matchedWeaponType

  const statTypes: RivenStatCountType[] = ['2', '3', '21', '31']
  if (!statTypes.includes(statType as RivenStatCountType)) {
    return failure('riven.statTypeError')
  }

  const stats = rivenStatsByType[weaponTypeKey]
  const factor = rivenStatFixFactor[statType as RivenStatCountType]
  const result: RivenStatResult = {
    positive: {},
    negative: factor.curseCount > 0 ? {} : undefined,
    notes: ['满级参考范围；融合词条使用现有范围模型，实际融合数值的继承方式尚未验证。'],
  }
  for (const stat of stats) {
    if (!stat.verified) {
      result.notes!.push(`${stat.name}：显示换算待确认，暂不计算。`)
      continue
    }
    const range = (factor: number): RivenStatResult['positive'][string] => {
      const value = stat.baseValue * disposition * factor
      return { name: `${stat.name}${stat.spliced ? '（融合）' : ''}`, unit: stat.unit, min: Math.min(value * 0.9, value * 1.1), max: Math.max(value * 0.9, value * 1.1) }
    }
    if (stat.canBeBuff)
      result.positive[stat.key] = range(factor.buffFactor)
    if (result.negative && stat.canBeCurse)
      result.negative[stat.key] = range(factor.curseFactor)
  }
  if (weaponTypeKey === 'Archgun')
    result.notes!.push('收枪装填：官方导出缺少基础值，暂不计算。')

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
      attr: RivenCalculationAttribute
      value: number
      prefix: string
    }[]
  }
  | undefined
> {
  const globalRivenCalculationAttributeList = rivenAttributes

  const list = ocrResult
  if (!list.length) {
    return
  }

  function normalizeStatName(text: string): string {
    return normalizeName(text).replace(/的/g, '').replace(/暴击率/g, '暴击几率').replace(/弹药最大值/g, '弹药上限').replace(/^伤害$/, '基础伤害').replace(/触发伤害/g, '异常状态伤害').replace(/orokin/g, '奥罗金').replace(/techrot/g, '科腐者').replace(/scaldra/g, '炽蛇军')
  }

  function similarity(standard: string, input: string): number {
    standard = normalizeStatName(standard)
    input = normalizeStatName(input)
    if (!standard || !input)
      return 0
    if (standard === input)
      return 2
    // Longer, more specific names win; never let 伤害 swallow 弱点伤害.
    if (input.startsWith(standard))
      return 1 + standard.length / input.length * 0.5
    if (standard.split('/').includes(input))
      return 1.8
    if (standard.split('/').some(x => input.startsWith(x)))
      return 1.2
    return Math.max(tokenSimilarity(standard, input), normalSimilarity(standard, input))
  }

  const texts = list
  const attributes: {
    attr: RivenCalculationAttribute
    value: number
    prefix: string
  }[] = []
  const statLines: string[] = []
  for (const t of texts) {
    if (!t || !/^[x×+−-]|^\d/i.test(t)) {
      continue
    }

    if (/^(?:\d+\s*(?:段位|等级|次|循环)|(?:段位|等级|循环)\s*\d+)$/.test(t.trim()))
      continue
    const prefix = /^[x×+−-]/i.test(t) ? t[0] : ''

    const attrNamePart = removeSpace(t).replace(/^[xX×+−-]?\d+(?:\.\d+)?[%s]?/, '')
    // Rank and reroll counters are numeric-only OCR fragments.
    if (!attrNamePart || !/[A-Z\u4E00-\u9FA5]/i.test(attrNamePart))
      continue
    if (!prefix && /^[a-z]{1,2}$/i.test(attrNamePart))
      continue
    const matches = globalRivenCalculationAttributeList.map(attr => ({
      attr,
      score: Math.max(...attr.aliases.map(name => similarity(name, attrNamePart))),
    })).sort((a, b) => b.score - a.score)
    const best = matches[0]
    if (!best || best.score < 0.8)
      return undefined
    const attr = best.attr

    statLines.push(t)

    const value = (function extractStatValue(text) {
      // Normalize
      const t = text.replace(/\s+/g, '').replace(/×/g, 'x').replace(/−/g, '-')

      // Case 1: multiply format like "x1.07"
      const multMatch = t.match(/^x(\d+(?:\.\d+)?)/i)
      if (multMatch) {
        return {
          value: Number.parseFloat(multMatch[1]),
          type: 'multiply',
        }
      }

      // Case 2: percentage format like "+15.8%" or "-12%"
      const percentMatch = t.match(/^([+-]?\d+(?:\.\d+)?)%/)
      if (percentMatch) {
        return {
          value: Number.parseFloat(percentMatch[1]),
          type: 'percent',
        }
      }

      // Case 3: plain number (rare but possible)
      const numMatch = t.match(/^([+-]?\d+(?:\.\d+)?)/)
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
    const exact = ocrData.find(text =>
      getWeaponRivenDisposition(text.trim())
      || getWeaponRivenDisposition(`${text.trim()} (Primary)`)
      || getWeaponRivenDisposition(`${text.trim()} (Secondary)`)
      || getWeaponRivenDisposition(`${text.trim()}（主武器）`)
      || getWeaponRivenDisposition(`${text.trim()}（副武器）`),
    )
    if (exact)
      return exact.trim()
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
    attr: RivenCalculationAttribute
    value: number
    prefix: string
  }[]
}, variant?: string): WarframeResult<RivenStatAnalyzeResult> {
  if (variant && variant !== 'primary' && variant !== 'secondary')
    return failure('riven.variantError')
  const primary = getWeaponRivenDisposition(`${parseResult.name} (Primary)`) ?? getWeaponRivenDisposition(`${parseResult.name}（主武器）`)
  const secondary = getWeaponRivenDisposition(`${parseResult.name} (Secondary)`) ?? getWeaponRivenDisposition(`${parseResult.name}（副武器）`)
  if (!variant && (primary || secondary))
    return failure('riven.variantRequired')
  const weaponRiven = (variant === 'primary' ? primary : variant === 'secondary' ? secondary : undefined) ?? getWeaponRivenDisposition(parseResult.name)
  if (!weaponRiven) {
    return failure('riven.weaponNotFound', false, {
      weapon: parseResult.name,
    })
  }

  const disposition = weaponRiven.calc.disposition
  const stats = rivenStatsByType[weaponRiven.calc.riventype]
  if (!stats || parseResult.attributes.length < 2 || parseResult.attributes.length > 4) {
    return failure('riven.statTypeError')
  }
  const entries: { stat: RivenCalculationStat, value: number, displayedValue: number, positive: boolean }[] = []
  for (const entry of parseResult.attributes) {
    const stat = stats.find(s => s.gameRef === entry.attr.gameRef)
      ?? stats.find(s => s.key === normalizeName(entry.attr.i18n?.en?.name ?? ''))
    if (!stat || !Number.isFinite(entry.value) || !stat.baseValue)
      return failure('riven.statTypeError')
    if (!stat.verified)
      return failure('riven.unverifiedStat', false, { stat: stat.name })
    const value = stat.unit === 'multiply' ? entry.value - 1 : entry.value
    const positive = value / stat.baseValue > 0
    if (value === 0 || (positive ? !stat.canBeBuff : !stat.canBeCurse))
      return failure('riven.statTypeError')
    if (entries.some(e => e.stat.gameRef === stat.gameRef))
      return failure('riven.statTypeError')
    entries.push({ stat, value, displayedValue: entry.value, positive })
  }
  const buffs = entries.filter(e => e.positive)
  const curses = entries.filter(e => !e.positive)
  if ((buffs.length !== 2 && buffs.length !== 3) || curses.length > 1)
    return failure('riven.statTypeError')
  const layout = `${buffs.length}${curses.length ? '1' : ''}` as RivenStatCountType
  const factors = rivenStatFixFactor[layout]
  const analyze = (entry: typeof entries[number]): RivenStatAnalyzsis => {
    const standard = entry.stat.baseValue * disposition * (entry.positive ? factors.buffFactor : factors.curseFactor)
    const offset = entry.stat.unit === 'multiply' ? 1 : 0
    return {
      name: `${entry.stat.name}${entry.stat.spliced ? '（融合）' : ''}`,
      unit: entry.stat.unit,
      value: entry.displayedValue,
      percent: (entry.value / standard - 1) * (entry.positive ? 1 : -1),
      min: Math.min(standard * 0.9, standard * 1.1) + offset,
      max: Math.max(standard * 0.9, standard * 1.1) + offset,
    }
  }
  return { ok: true, data: {
    name: weaponRiven.name.zh,
    disposition,
    buffs: buffs.map(analyze),
    curses: curses.map(analyze),
    notes: entries.some(e => e.stat.spliced) ? ['融合词条为参考范围；实际融合数值的继承方式尚未验证。'] : undefined,
  } }
}
