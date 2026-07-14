import type { ItemShort } from '../../types/wfm'
import { wfmClient } from '../../infrastructure/wfm-client'
import { createAsyncCache, fullWidthToHalfWidth, listToDict, normalizeName } from '../../utils'

export interface GlobalItemWordPrefixCandidate {
  item: ItemShort
  normalizedName: string
  tokens: string[]
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

export async function globalItemDataFactory(response?: ItemShort[]): Promise<{
  globalItemList: ItemShort[]
  globalItemDict: Record<string, ItemShort>
  globalItemNameToSlugDict: Record<string, string>
  globalItemGameRefDict: Record<string, ItemShort>
  globalItemWordPrefixCandidates: GlobalItemWordPrefixCandidate[]
}> {
  response ??= await wfmClient.items.getList()
  if (!response) {
    return {
      globalItemList: [],
      globalItemDict: {},
      globalItemNameToSlugDict: {},
      globalItemGameRefDict: {},
      globalItemWordPrefixCandidates: [],
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
      if (item.i18n['zh-hans']?.name) {
        result[normalizeName(item.i18n['zh-hans'].name)] = item.slug
      }
      if (item.i18n.en?.name) {
        result[normalizeName(item.i18n.en.name)] = item.slug
      }
    }
    return result
  })(globalItemList)
  const globalItemGameRefDict: Record<string, ItemShort>
    = listToDict<ItemShort>(data, i => [i.gameRef])
  const globalItemWordPrefixCandidates = buildGlobalItemWordPrefixCandidates(
    globalItemList,
  )

  return {
    globalItemList,
    globalItemDict,
    globalItemNameToSlugDict,
    globalItemGameRefDict,
    globalItemWordPrefixCandidates,
  }
}

export let globalItemData = createAsyncCache(globalItemDataFactory, -1)

export function overrideGlobalItemData(cache: AsyncCache<{
  globalItemList: ItemShort[]
  globalItemDict: Record<string, ItemShort>
  globalItemNameToSlugDict: Record<string, string>
  globalItemGameRefDict: Record<string, ItemShort>
  globalItemWordPrefixCandidates: GlobalItemWordPrefixCandidate[]
}>): void {
  globalItemData = cache
}
