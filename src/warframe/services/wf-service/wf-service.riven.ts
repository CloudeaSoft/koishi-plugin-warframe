import type { WeeklyRiven } from 'warframe-weekly-rivens'

import type {
  OcrAPISecret,
  RivenStatAnalyzeResult,
  RivenStatCountType,
  RivenStatResult,
  RivenWeaponType,
  WarframeResult,
} from '../../types'
import type { OcrTextBlock } from '../../types/ocr'
import type { ParsedRiven } from '../riven/ocr'
import { rivenStatsByType } from '../../data/wf/rivenBaseValues'
import { rivenStatFixFactor } from '../../data/wf/rivenStatData'
import { globalRivenItemData } from '../../data/wfm/globalRivenItem'
import { extractTextFromImage } from '../../infrastructure/ocr-api'
import { failure } from '../../types/warframe-result'
import {
  fetchAsyncImage,
  normalizeName,
} from '../../utils'
import { analyzeRiven } from '../riven/analysis'
import { parseRivenOcr } from '../riven/ocr'

export { analyzeRivenStat, getWeaponRivenDisposition } from '../riven/analysis'

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

  return analyzeRiven(parseResult, variant)
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

export async function parseOCRResult(ocrResult: readonly (string | OcrTextBlock)[]): Promise<ParsedRiven | undefined> {
  return parseRivenOcr(ocrResult)
}
