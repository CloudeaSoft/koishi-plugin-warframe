import type { GlobalRivenItemWordPrefixCandidate } from '../../data/wfm/globalRivenItem'
import type { RivenItem } from '../../types/wfm'
import { globalRivenItemData } from '../../data/wfm/globalRivenItem'
import { fullWidthToHalfWidth, normalizeName } from '../../utils'

interface WFMRivenItemLookupData {
  globalRivenItemDict: Record<string, RivenItem>
  globalRivenItemNameToSlugDict: Record<string, string>
  globalRivenItemWordPrefixCandidates: GlobalRivenItemWordPrefixCandidate[]
}

export function normalizeWordPrefixName(input: string): string {
  return fullWidthToHalfWidth(input)
    .toLowerCase()
    .replace(/[·'()+【】[\]{}，。！？；：_]/g, ' ')
    .replace(/[-/\\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function splitWordPrefixTokens(input: string): string[] {
  const normalized = normalizeWordPrefixName(input)
  if (!normalized) {
    return []
  }

  return normalized.split(' ').filter(Boolean)
}

function buildRivenItemLookupData(
  globalRivenItemList: RivenItem[],
): WFMRivenItemLookupData {
  const globalRivenItemDict: Record<string, RivenItem> = {}
  const globalRivenItemNameToSlugDict: Record<string, string> = {}
  const globalRivenItemWordPrefixCandidates: GlobalRivenItemWordPrefixCandidate[] = []
  const seen = new Set<string>()

  for (const item of globalRivenItemList) {
    globalRivenItemDict[item.slug] = item

    const names = [
      item.i18n?.['zh-hans']?.name,
      item.i18n?.en?.name,
    ].filter((name): name is string => typeof name === 'string' && name.length > 0)

    for (const name of names) {
      const normalizedName = normalizeName(name)
      if (normalizedName && !globalRivenItemNameToSlugDict[normalizedName]) {
        globalRivenItemNameToSlugDict[normalizedName] = item.slug
      }

      const normalizedWordPrefixName = normalizeWordPrefixName(name)
      if (!normalizedWordPrefixName || seen.has(`${item.slug}:${normalizedWordPrefixName}`)) {
        continue
      }

      const tokens = splitWordPrefixTokens(normalizedWordPrefixName)
      if (tokens.length === 0) {
        continue
      }

      seen.add(`${item.slug}:${normalizedWordPrefixName}`)
      globalRivenItemWordPrefixCandidates.push({
        item,
        normalizedName: normalizedWordPrefixName,
        tokens,
      })
    }
  }

  return {
    globalRivenItemDict,
    globalRivenItemNameToSlugDict,
    globalRivenItemWordPrefixCandidates,
  }
}

export function matchBySlugDict(
  input: string,
  lookup: Pick<WFMRivenItemLookupData, 'globalRivenItemDict' | 'globalRivenItemNameToSlugDict'>,
): RivenItem | undefined {
  const slug = lookup.globalRivenItemNameToSlugDict[input]
  return slug ? lookup.globalRivenItemDict[slug] : undefined
}

export function shortHandProcess(
  input: string,
  lookup: Pick<WFMRivenItemLookupData, 'globalRivenItemDict' | 'globalRivenItemNameToSlugDict'>,
): RivenItem | undefined {
  const primeSuffix = 'prime'
  const fixPrime = input.endsWith(primeSuffix)
    ? input
    : input.endsWith('p')
      ? input.slice(0, input.length - 1) + primeSuffix
      : input + primeSuffix
  const fixPrimeRes = lookup.globalRivenItemNameToSlugDict[fixPrime]
  if (fixPrimeRes)
    return lookup.globalRivenItemDict[fixPrimeRes]

  const fixPrimeSpace = `${input} ${primeSuffix}`
  const fixPrimeSpaceRes = lookup.globalRivenItemNameToSlugDict[fixPrimeSpace]
  if (fixPrimeSpaceRes)
    return lookup.globalRivenItemDict[fixPrimeSpaceRes]

  return undefined
}

function compareWordPrefixCandidates(
  left: GlobalRivenItemWordPrefixCandidate,
  right: GlobalRivenItemWordPrefixCandidate,
  inputTokens: string[],
): number {
  const leftExtraTokenCount = left.tokens.length - inputTokens.length
  const rightExtraTokenCount = right.tokens.length - inputTokens.length
  if (leftExtraTokenCount !== rightExtraTokenCount) {
    return leftExtraTokenCount - rightExtraTokenCount
  }

  const leftRemainderKey = inputTokens
    .map((token, index) => left.tokens[index].slice(token.length))
    .join('\u0000')
  const rightRemainderKey = inputTokens
    .map((token, index) => right.tokens[index].slice(token.length))
    .join('\u0000')
  if (leftRemainderKey !== rightRemainderKey) {
    return leftRemainderKey.localeCompare(rightRemainderKey)
  }

  return left.normalizedName.localeCompare(right.normalizedName)
}

export function matchByWordPrefixSequence(
  input: string,
  lookup: Pick<WFMRivenItemLookupData, 'globalRivenItemWordPrefixCandidates'>,
): RivenItem | undefined {
  const inputTokens = splitWordPrefixTokens(input)
  if (inputTokens.length < 2) {
    return undefined
  }

  const matchedCandidates = lookup.globalRivenItemWordPrefixCandidates
    .filter((candidate) => {
      if (candidate.tokens.length < inputTokens.length) {
        return false
      }

      return inputTokens.every((token, index) =>
        candidate.tokens[index].startsWith(token),
      )
    })
    .sort((left, right) => compareWordPrefixCandidates(left, right, inputTokens))

  return matchedCandidates[0]?.item
}

function findFromLookup(
  input: string,
  lookup: WFMRivenItemLookupData,
): RivenItem | undefined {
  const normalizedInput = normalizeName(input)
  if (!normalizedInput) {
    return undefined
  }

  const slugMatchedItem = matchBySlugDict(normalizedInput, lookup)
  if (slugMatchedItem) {
    return slugMatchedItem
  }

  const shortHandMatchedItem = shortHandProcess(normalizedInput, lookup)
  if (shortHandMatchedItem) {
    return shortHandMatchedItem
  }

  const wordPrefixMatchedItem = matchByWordPrefixSequence(input, lookup)
  if (wordPrefixMatchedItem) {
    return wordPrefixMatchedItem
  }

  return undefined
}

export async function findRivenItemByName(
  input: string,
  globalRivenItemList?: RivenItem[],
): Promise<RivenItem | undefined> {
  if (globalRivenItemList) {
    return findFromLookup(input, buildRivenItemLookupData(globalRivenItemList))
  }

  return globalRivenItemData.get().then(lookup => findFromLookup(input, lookup))
}

export const matchByShortHand = shortHandProcess
export const stringToWFMItem = findRivenItemByName
