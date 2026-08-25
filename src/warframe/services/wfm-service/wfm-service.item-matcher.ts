import type { GlobalItemWordPrefixCandidate } from '../../data/wfm/globalItem'
import type { ItemShort } from '../../types'
import { warframeAlias } from '../../assets'
import { globalItemData } from '../../data/wfm/globalItem'
import { fullWidthToHalfWidth, normalizeName } from '../../utils'

export type WFMItemMatchResult
  = | { type: 'matched', item: ItemShort }
    | { type: 'ambiguous', candidates: ItemShort[] }
    | { type: 'not-found' }

interface WFMItemLookupData {
  globalItemDict: Record<string, ItemShort>
  globalItemNameToSlugDict: Record<string, string>
  globalItemArcaneShorthandDict: Record<string, ItemShort[]>
}

export const wfmItemMatcher = (() => {
  const setSuffix = '一套'
  const bpSuffix = '蓝图'
  const bpAliasSuffix = '总图'
  const bpShortSuffix = '图'
  const primeSuffix = 'prime'
  const relicSuffix = '遗物'
  const relicEnSuffix = 'relic'
  const neuropticsSuffix = '头部神经光元'
  const cerebrumSuffix = '头部'
  const headShortSuffix = '头'
  const partSuffixes = [
    neuropticsSuffix,
    '项圈扣',
    '项圈带',
    '连接器',
    '下弓臂',
    '上弓臂',
    '系统',
    '机体',
    '外壳',
    '外甲',
    '机翼',
    cerebrumSuffix,
    '枪管',
    '枪托',
    '枪机',
    '弓弦',
    '弓身',
    '刀刃',
    '爪刃',
    '握柄',
    '握把',
    '拳套',
    '圆盘',
    '镖袋',
    '护手',
    '饰物',
    '锤头',
    '链条',
    '星镖',
    '靴子',
    '手套',
  ].sort((left, right) => right.length - left.length)
  const headSuffixLookup = [neuropticsSuffix, cerebrumSuffix]
  const warframeAliasDict: Record<string, string> = ((aliasObject) => {
    const transformedObject: Record<string, string> = {}
    for (const [key, aliases] of Object.entries(aliasObject)) {
      const normalizedKey = normalizeName(key)
      transformedObject[normalizedKey] = normalizedKey
      for (const alias of aliases) {
        if (typeof alias !== 'string' || alias.length === 0) {
          continue
        }

        const normalizedAlias = normalizeName(alias)
        transformedObject[normalizedAlias] = normalizedKey
        const warframeNameWithSuffix = normalizeName(`${alias}甲`)
        transformedObject[warframeNameWithSuffix] = normalizedKey
      }
    }

    return transformedObject
  })(warframeAlias)

  function resolvePartSuffixes(suffix: string): string[] {
    if (suffix === neuropticsSuffix || suffix === cerebrumSuffix || suffix === headShortSuffix) {
      return headSuffixLookup
    }

    return suffix ? [suffix] : ['']
  }

  function removeNameSuffix(input: string): { pure: string, suffix: string } {
    let hasBPSuffix = false
    if (input.endsWith(bpSuffix) || input.endsWith(bpAliasSuffix) || input.endsWith(bpShortSuffix)) {
      input = input.replace(new RegExp(`(?:${bpSuffix}|${bpAliasSuffix}|${bpShortSuffix})$`), '')
      hasBPSuffix = true
    }

    if (input.endsWith(setSuffix)) {
      input = input.replace(new RegExp(`${setSuffix}$`), '')
    }

    if (input.endsWith(bpSuffix) || input.endsWith(bpAliasSuffix) || input.endsWith(bpShortSuffix)) {
      input = input.replace(new RegExp(`(?:${bpSuffix}|${bpAliasSuffix}|${bpShortSuffix})$`), '')
      hasBPSuffix = true
    }

    const matchedPartSuffix = partSuffixes.find(value => input.endsWith(value))
    if (matchedPartSuffix) {
      return {
        pure: input.slice(0, input.length - matchedPartSuffix.length),
        suffix: matchedPartSuffix === cerebrumSuffix ? neuropticsSuffix : matchedPartSuffix,
      }
    }

    if (input.endsWith(headShortSuffix)) {
      return {
        pure: input.slice(0, input.length - headShortSuffix.length),
        suffix: neuropticsSuffix,
      }
    }

    return {
      pure: input,
      suffix: hasBPSuffix ? bpSuffix : '',
    }
  }

  function buildPrimeNameCandidates(input: string): string[] {
    if (input.endsWith(primeSuffix)) {
      return [input]
    }

    const candidates = [input + primeSuffix]
    if (input.endsWith('p')) {
      candidates.push(input.slice(0, input.length - 1) + primeSuffix)
    }

    return candidates
  }

  function lookupByNormalizedName(
    name: string,
    lookup: Pick<WFMItemLookupData, 'globalItemDict' | 'globalItemNameToSlugDict'>,
  ): ItemShort | undefined {
    const slug = lookup.globalItemNameToSlugDict[name]
    return slug ? lookup.globalItemDict[slug] : undefined
  }

  function shortHandProcess(
    input: string,
    lookup: Pick<WFMItemLookupData, 'globalItemDict' | 'globalItemNameToSlugDict'>,
  ): ItemShort | undefined {
    const { pure: inputNoSuffix, suffix } = removeNameSuffix(input)
    if (inputNoSuffix === input) {
      const fixSetRes = lookupByNormalizedName(input + setSuffix, lookup)
      if (fixSetRes)
        return fixSetRes

      const fixPrimeCandidates = buildPrimeNameCandidates(input)
      for (const fixPrime of fixPrimeCandidates) {
        const fixPrimeRes = lookupByNormalizedName(fixPrime, lookup)
        if (fixPrimeRes)
          return fixPrimeRes

        const fixPrimeSetRes = lookupByNormalizedName(fixPrime + setSuffix, lookup)
        if (fixPrimeSetRes)
          return fixPrimeSetRes
      }

      const fixBPRes = lookupByNormalizedName(input + bpSuffix, lookup)
      if (fixBPRes)
        return fixBPRes

      for (const fixPrime of fixPrimeCandidates) {
        const fixPrimeBPRes = lookupByNormalizedName(fixPrime + bpSuffix, lookup)
        if (fixPrimeBPRes)
          return fixPrimeBPRes
      }

      const fixRelicRes = lookupByNormalizedName(input + relicSuffix, lookup)
      if (fixRelicRes)
        return fixRelicRes

      const fixRelicEnRes = lookupByNormalizedName(input + relicEnSuffix, lookup)
      if (fixRelicEnRes)
        return fixRelicEnRes
    }
    else {
      const fixPrimeCandidates = buildPrimeNameCandidates(inputNoSuffix)
      for (const resolvedSuffix of resolvePartSuffixes(suffix)) {
        const fixBPRes = lookupByNormalizedName(inputNoSuffix + resolvedSuffix + bpSuffix, lookup)
        if (fixBPRes)
          return fixBPRes

        for (const fixPrime of fixPrimeCandidates) {
          const fixPrimeRes = lookupByNormalizedName(fixPrime + resolvedSuffix, lookup)
          if (fixPrimeRes)
            return fixPrimeRes

          const fixPrimeBPRes = lookupByNormalizedName(fixPrime + resolvedSuffix + bpSuffix, lookup)
          if (fixPrimeBPRes)
            return fixPrimeBPRes
        }
      }
    }
  }

  function matchBySlugDict(
    input: string,
    lookup: WFMItemLookupData,
  ): ItemShort | undefined {
    const slug = lookup.globalItemNameToSlugDict[input]
    return slug ? lookup.globalItemDict[slug] : undefined
  }

  function matchByShortHand(
    input: string,
    lookup: WFMItemLookupData,
  ): ItemShort | undefined {
    return shortHandProcess(input, lookup)
  }

  function getItemDisplayName(item: ItemShort): string {
    return item.i18n?.['zh-hans']?.name
      ?? item.i18n?.en?.name
      ?? item.slug
  }

  function compareItemDisplayName(left: ItemShort, right: ItemShort): number {
    const leftDisplayName = normalizeName(getItemDisplayName(left))
    const rightDisplayName = normalizeName(getItemDisplayName(right))
    if (leftDisplayName !== rightDisplayName) {
      return leftDisplayName < rightDisplayName ? -1 : 1
    }

    const leftSlug = normalizeName(left.slug)
    const rightSlug = normalizeName(right.slug)
    return leftSlug < rightSlug ? -1 : leftSlug > rightSlug ? 1 : 0
  }

  function matchByArcaneShorthand(
    input: string,
    lookup: WFMItemLookupData,
  ): WFMItemMatchResult | undefined {
    const candidates = lookup.globalItemArcaneShorthandDict[input]
    if (!candidates?.length) {
      return undefined
    }

    const sortedCandidates = [...candidates].sort(compareItemDisplayName)
    if (sortedCandidates.length === 1) {
      return { type: 'matched', item: sortedCandidates[0] }
    }

    return { type: 'ambiguous', candidates: sortedCandidates }
  }

  function transformByWarframeAlias(input: string): string | undefined {
    const { pure: inputNoSuffix, suffix } = removeNameSuffix(input)
    const aliasHasEndP = inputNoSuffix.endsWith(primeSuffix)
      ? inputNoSuffix.replace(new RegExp(`${primeSuffix}$`), '')
      : inputNoSuffix
    const mappedAliasHasEndP = warframeAliasDict[aliasHasEndP]
    if (mappedAliasHasEndP) {
      return normalizeName(mappedAliasHasEndP) + suffix
    }

    if (inputNoSuffix.endsWith('p')) {
      const aliasNoEndP = inputNoSuffix.replace(/p$/, '')
      const mappedAliasNoEndP = warframeAliasDict[aliasNoEndP]
      if (mappedAliasNoEndP) {
        return normalizeName(mappedAliasNoEndP) + suffix
      }
    }

    return undefined
  }

  function buildSuffixVariantCandidates(input: string): string[] {
    const candidates = new Set<string>()
    const { pure, suffix } = removeNameSuffix(input)

    const addVariants = (base: string): void => {
      candidates.add(base)
      candidates.add(base + bpSuffix)
      candidates.add(`${base}blueprint`)
      candidates.add(base + setSuffix)
      candidates.add(`${base}set`)
    }

    addVariants(input)
    for (const resolvedSuffix of resolvePartSuffixes(suffix)) {
      if (!resolvedSuffix) {
        continue
      }

      addVariants(pure + resolvedSuffix)
    }

    return [...candidates]
  }

  function matchBySuffixVariantLookup(
    input: string,
    lookup: WFMItemLookupData,
  ): ItemShort | undefined {
    for (const candidate of buildSuffixVariantCandidates(input)) {
      const slug = lookup.globalItemNameToSlugDict[candidate]
      if (slug)
        return lookup.globalItemDict[slug]
    }

    return undefined
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

  function compareWordPrefixCandidates(
    left: GlobalItemWordPrefixCandidate,
    right: GlobalItemWordPrefixCandidate,
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

  function matchByWordPrefixSequence(
    input: string,
    lookup: WFMItemLookupData & {
      globalItemWordPrefixCandidates: GlobalItemWordPrefixCandidate[]
    },
  ): ItemShort | undefined {
    const inputTokens = splitWordPrefixTokens(input)
    if (inputTokens.length < 2) {
      return undefined
    }

    const matchedCandidates = lookup.globalItemWordPrefixCandidates
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

  async function matchWFMItem(input: string): Promise<WFMItemMatchResult> {
    const {
      globalItemDict,
      globalItemNameToSlugDict,
      globalItemWordPrefixCandidates,
      globalItemArcaneShorthandDict,
    }
      = await globalItemData.get()

    const normalizedInput = normalizeName(input)
    const lookup = {
      globalItemDict,
      globalItemNameToSlugDict,
      globalItemWordPrefixCandidates,
      globalItemArcaneShorthandDict,
    }

    const slugMatchedItem = matchBySlugDict(normalizedInput, lookup)
    if (slugMatchedItem)
      return { type: 'matched', item: slugMatchedItem }

    const shortHandMatchedItem = matchByShortHand(normalizedInput, lookup)
    if (shortHandMatchedItem)
      return { type: 'matched', item: shortHandMatchedItem }

    const aliasInput = transformByWarframeAlias(normalizedInput)
    if (aliasInput) {
      const aliasShortHandMatchedItem = matchByShortHand(aliasInput, lookup)
      if (aliasShortHandMatchedItem)
        return { type: 'matched', item: aliasShortHandMatchedItem }
    }

    const suffixMatchedItem = matchBySuffixVariantLookup(normalizedInput, lookup)
    if (suffixMatchedItem)
      return { type: 'matched', item: suffixMatchedItem }

    if (aliasInput) {
      const aliasSuffixMatchedItem = matchBySuffixVariantLookup(aliasInput, lookup)
      if (aliasSuffixMatchedItem)
        return { type: 'matched', item: aliasSuffixMatchedItem }
    }

    const wordPrefixMatchedItem = matchByWordPrefixSequence(input, lookup)
    if (wordPrefixMatchedItem)
      return { type: 'matched', item: wordPrefixMatchedItem }

    const arcaneShorthandMatchedItem = matchByArcaneShorthand(normalizedInput, lookup)
    if (arcaneShorthandMatchedItem)
      return arcaneShorthandMatchedItem

    // 5. TODO: Fuzzy word match
    // Not implemented

    // 6. TODO: AI?

    return { type: 'not-found' }
  }

  async function stringToWFMItem(input: string): Promise<ItemShort | undefined> {
    const result = await matchWFMItem(input)
    return result.type === 'matched' ? result.item : undefined
  }

  return {
    buildSuffixVariantCandidates,
    matchByArcaneShorthand,
    matchByShortHand,
    matchBySlugDict,
    matchBySuffixVariantLookup,
    matchByWordPrefixSequence,
    removeNameSuffix,
    splitWordPrefixTokens,
    shortHandProcess,
    stringToWFMItem,
    transformByWarframeAlias,
    normalizeWordPrefixName,
    matchWFMItem,
  }
})()

export const buildSuffixVariantCandidates = wfmItemMatcher.buildSuffixVariantCandidates
export const matchByArcaneShorthand = wfmItemMatcher.matchByArcaneShorthand
export const matchByShortHand = wfmItemMatcher.matchByShortHand
export const matchBySlugDict = wfmItemMatcher.matchBySlugDict
export const matchBySuffixVariantLookup = wfmItemMatcher.matchBySuffixVariantLookup
export const matchByWordPrefixSequence = wfmItemMatcher.matchByWordPrefixSequence
export const normalizeWordPrefixName = wfmItemMatcher.normalizeWordPrefixName
export const removeNameSuffix = wfmItemMatcher.removeNameSuffix
export const splitWordPrefixTokens = wfmItemMatcher.splitWordPrefixTokens
export const shortHandProcess = wfmItemMatcher.shortHandProcess
export const stringToWFMItem = wfmItemMatcher.stringToWFMItem
export const transformByWarframeAlias = wfmItemMatcher.transformByWarframeAlias
export const matchWFMItem = wfmItemMatcher.matchWFMItem
