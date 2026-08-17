import type { AsyncCache, ItemShort } from '../../types'
import { wfmClient } from '../../infrastructure/wfm-client'
import { createAsyncCache, fullWidthToHalfWidth, listToDict, normalizeName } from '../../utils'

export interface GlobalItemWordPrefixCandidate {
  item: ItemShort
  normalizedName: string
  tokens: string[]
}

export interface GlobalItemData {
  globalItemList: ItemShort[]
  globalItemDict: Record<string, ItemShort>
  globalItemNameToSlugDict: Record<string, string>
  globalItemGameRefDict: Record<string, ItemShort>
  globalItemWordPrefixCandidates: GlobalItemWordPrefixCandidate[]
  globalItemArcaneShorthandDict: Record<string, ItemShort[]>
}

function normalizeWordPrefixName(input: string): string {
  return fullWidthToHalfWidth(input)
    .toLowerCase()
    .replace(/[·'()+【】[\]{}，。！？；：_]/g, ' ')
    .replace(/[-/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitWordPrefixTokens(input: string): string[] {
  const normalized = normalizeWordPrefixName(input)
  if (!normalized) {
    return []
  }

  return normalized.split(' ').filter(Boolean)
}

function buildGlobalItemWordPrefixCandidates(
  globalItemList: ItemShort[],
): GlobalItemWordPrefixCandidate[] {
  const candidates: GlobalItemWordPrefixCandidate[] = []
  const seen = new Set<string>()

  for (const item of globalItemList) {
    const names = [
      item.i18n?.en?.name,
      item.i18n?.['zh-hans']?.name,
    ].filter((name): name is string => typeof name === 'string' && name.length > 0)

    for (const name of names) {
      const normalizedName = normalizeWordPrefixName(name.toLowerCase())
      if (!normalizedName || seen.has(`${item.slug}:${normalizedName}`)) {
        continue
      }

      const tokens = splitWordPrefixTokens(normalizedName)
      if (tokens.length === 0) {
        continue
      }

      seen.add(`${item.slug}:${normalizedName}`)
      candidates.push({
        item,
        normalizedName,
        tokens,
      })
    }
  }

  return candidates
}

function buildGlobalItemArcaneShorthandDict(
  globalItemList: ItemShort[],
  globalItemNameToSlugDict: Record<string, string>,
): Record<string, ItemShort[]> {
  const result: Record<string, ItemShort[]> = {}

  for (const item of globalItemList) {
    if (!item.tags?.includes('arcane_enhancement')) {
      continue
    }

    const zhName = item.i18n?.['zh-hans']?.name
    if (!zhName) {
      continue
    }

    const separatorIndex = zhName.indexOf('·')
    if (separatorIndex <= 0 || separatorIndex === zhName.length - 1) {
      continue
    }

    const category = normalizeName(zhName.slice(0, separatorIndex))
    const shorthand = normalizeName(zhName.slice(separatorIndex + 1))
    if (!category || !shorthand) {
      continue
    }

    const suffixAlias = shorthand + category
    globalItemNameToSlugDict[suffixAlias] ??= item.slug
    ;(result[shorthand] ??= []).push(item)
  }

  return result
}

export async function globalItemDataFactory(response?: ItemShort[]): Promise<GlobalItemData> {
  response ??= await wfmClient.items.list()
  if (!response) {
    return {
      globalItemList: [],
      globalItemDict: {},
      globalItemNameToSlugDict: {},
      globalItemGameRefDict: {},
      globalItemWordPrefixCandidates: [],
      globalItemArcaneShorthandDict: {},
    }
  }

  const data = response

  const globalItemList: ItemShort[] = response
  const globalItemDict: Record<string, ItemShort> = listToDict<ItemShort>(
    data,
    i => [i.slug],
  )
  const globalItemNameToSlugDict: Record<string, string> = ((list) => {
    const result: Record<string, string> = {}
    for (const item of list) {
      const zhName = item.i18n?.['zh-hans']?.name
      if (zhName) {
        result[normalizeName(zhName)] = item.slug
      }
      const enName = item.i18n?.en?.name
      if (enName) {
        result[normalizeName(enName)] = item.slug
      }
    }
    return result
  })(globalItemList)
  const globalItemGameRefDict: Record<string, ItemShort>
    = listToDict<ItemShort>(data, i => [i.gameRef])
  const globalItemWordPrefixCandidates = buildGlobalItemWordPrefixCandidates(
    globalItemList,
  )
  const globalItemArcaneShorthandDict = buildGlobalItemArcaneShorthandDict(
    globalItemList,
    globalItemNameToSlugDict,
  )

  return {
    globalItemList,
    globalItemDict,
    globalItemNameToSlugDict,
    globalItemGameRefDict,
    globalItemWordPrefixCandidates,
    globalItemArcaneShorthandDict,
  }
}

export let globalItemData = createAsyncCache(globalItemDataFactory, -1)

export function overrideGlobalItemData(cache: AsyncCache<GlobalItemData>): void {
  globalItemData = cache
}
