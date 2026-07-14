import type { RivenItem } from '../../types/wfm'
import { wfmClient } from '../../infrastructure/wfm-client'
import { createAsyncCache, fullWidthToHalfWidth, listToDict, normalizeName } from '../../utils'

export interface GlobalRivenItemWordPrefixCandidate {
  item: RivenItem
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

function buildGlobalRivenItemWordPrefixCandidates(
  globalRivenItemList: RivenItem[],
): GlobalRivenItemWordPrefixCandidate[] {
  const candidates: GlobalRivenItemWordPrefixCandidate[] = []
  const seen = new Set<string>()

  for (const item of globalRivenItemList) {
    const names = [
      item.i18n?.en?.name,
      item.i18n?.['zh-hans']?.name,
    ].filter((name): name is string => typeof name === 'string' && name.length > 0)

    for (const name of names) {
      const normalizedName = normalizeWordPrefixName(name)
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

export async function globalRivenItemFactory(rivenData?: RivenItem[]): Promise<{
  globalRivenItemList: RivenItem[]
  globalRivenItemDict: Record<string, RivenItem>
  globalRivenItemNameToSlugDict: Record<string, string>
  globalRivenItemWordPrefixCandidates: GlobalRivenItemWordPrefixCandidate[]
}> {
  rivenData ??= await wfmClient.rivens.getItems()
  if (!rivenData) {
    throw new Error('Failed to fetch riven items from Warframe Market API.')
  }

  const data = rivenData

  const globalRivenItemList = data
  const globalRivenItemDict = listToDict(data, i => [i.slug])
  const globalRivenItemNameToSlugDict: Record<string, string> = ((list) => {
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
  })(data)
  const globalRivenItemWordPrefixCandidates = buildGlobalRivenItemWordPrefixCandidates(data)

  return {
    globalRivenItemList,
    globalRivenItemDict,
    globalRivenItemNameToSlugDict,
    globalRivenItemWordPrefixCandidates,
  }
}

export const globalRivenItemData = createAsyncCache(async () => {
  return globalRivenItemFactory()
}, -1)
