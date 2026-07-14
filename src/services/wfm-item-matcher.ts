import type { ItemShort } from '../types/wfm'
import { warframeAlias } from '../assets'
import { globalItemData } from '../data/wfm/globalItem'
import { normalizeName } from '../utils'

interface WFMItemLookupData {
  globalItemDict: Record<string, ItemShort>
  globalItemNameToSlugDict: Record<string, string>
}

export const wfmItemMatcher = (() => {
  const setSuffix = '一套'
  const bpSuffix = '蓝图'
  const primeSuffix = 'prime'
  const warframePartSuffix = ['系统', '头部神经光元', '机体']
  const weaponPartSuffix = [
    '枪管',
    '枪托',
    '枪机',
    '弓弦',
    '上弓臂',
    '下弓臂',
    '刀刃',
    '握柄',
    '拳套',
    '圆盘',
    '连接器',
  ]

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

  function removeNameSuffix(input: string): { pure: string, suffix: string } {
    let hasBPSuffix = false
    if (input.endsWith(bpSuffix)) {
      input = input.replace(new RegExp(`${bpSuffix}$`), '')
      hasBPSuffix = true
    }

    if (input.endsWith(setSuffix)) {
      input = input.replace(new RegExp(`${setSuffix}$`), '')
    }

    if (input.endsWith(bpSuffix)) {
      input = input.replace(new RegExp(`${bpSuffix}$`), '')
      hasBPSuffix = true
    }

    const suffix
      = warframePartSuffix.find(value => input.endsWith(value))
        ?? weaponPartSuffix.find(value => input.endsWith(value))
        ?? (input.endsWith('头') ? '头部神经光元' : undefined)
        ?? (hasBPSuffix ? bpSuffix : undefined)
        ?? ''

    if (suffix) {
      input = input.endsWith('头') ? input.replace(/头$/, '') : input
      const pure = input.replace(new RegExp(`${suffix}$`), '')
      return {
        pure,
        suffix,
      }
    }
    else {
      return {
        pure: input,
        suffix,
      }
    }
  }

  function shortHandProcess(
    input: string,
    lookup: Pick<WFMItemLookupData, 'globalItemDict' | 'globalItemNameToSlugDict'>,
  ): ItemShort | undefined {
    const { pure: inputNoSuffix, suffix } = removeNameSuffix(input)
    if (inputNoSuffix === input) {
      const fixSet = input + setSuffix
      const fixSetRes = lookup.globalItemNameToSlugDict[fixSet]
      if (fixSetRes)
        return lookup.globalItemDict[fixSetRes]

      const fixPrime = input.endsWith(primeSuffix)
        ? input
        : input.endsWith('p')
          ? input.slice(0, input.length - 1) + primeSuffix
          : input + primeSuffix
      const fixPrimeRes = lookup.globalItemNameToSlugDict[fixPrime]
      if (fixPrimeRes)
        return lookup.globalItemDict[fixPrimeRes]

      const fixPrimeSet = fixPrime + setSuffix
      const fixPrimeSetRes = lookup.globalItemNameToSlugDict[fixPrimeSet]
      if (fixPrimeSetRes)
        return lookup.globalItemDict[fixPrimeSetRes]

      const fixBP = input + bpSuffix
      const fixBPRes = lookup.globalItemNameToSlugDict[fixBP]
      if (fixBPRes)
        return lookup.globalItemDict[fixBPRes]

      const fixPrimeBP = fixPrime + bpSuffix
      const fixPrimeBPRes = lookup.globalItemNameToSlugDict[fixPrimeBP]
      if (fixPrimeBPRes)
        return lookup.globalItemDict[fixPrimeBPRes]
    }
    else {
      const fixBP = inputNoSuffix + suffix + bpSuffix
      const fixBPRes = lookup.globalItemNameToSlugDict[fixBP]
      if (fixBPRes)
        return lookup.globalItemDict[fixBPRes]

      const fixPrime = inputNoSuffix.endsWith(primeSuffix)
        ? inputNoSuffix
        : inputNoSuffix.endsWith('p')
          ? inputNoSuffix.slice(0, inputNoSuffix.length - 1) + primeSuffix
          : inputNoSuffix + primeSuffix
      const fixPrimeRes = lookup.globalItemNameToSlugDict[fixPrime + suffix]
      if (fixPrimeRes)
        return lookup.globalItemDict[fixPrimeRes]

      const fixPrimeBP = fixPrime + suffix + bpSuffix
      const fixPrimeBPRes = lookup.globalItemNameToSlugDict[fixPrimeBP]
      if (fixPrimeBPRes)
        return lookup.globalItemDict[fixPrimeBPRes]
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

    candidates.add(input)
    candidates.add(input + bpSuffix)
    candidates.add(`${input}blueprint`)
    candidates.add(input + setSuffix)
    candidates.add(`${input}set`)

    if (suffix) {
      const base = pure + suffix
      candidates.add(base)
      candidates.add(base + bpSuffix)
      candidates.add(`${base}blueprint`)
      candidates.add(base + setSuffix)
      candidates.add(`${base}set`)
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

  async function stringToWFMItem(input: string): Promise<ItemShort | undefined> {
    const { globalItemDict, globalItemNameToSlugDict }
      = await globalItemData.get()

    const normalizedInput = normalizeName(input)
    const lookup = {
      globalItemDict,
      globalItemNameToSlugDict,
    }

    const slugMatchedItem = matchBySlugDict(normalizedInput, lookup)
    if (slugMatchedItem)
      return slugMatchedItem

    const shortHandMatchedItem = matchByShortHand(normalizedInput, lookup)
    if (shortHandMatchedItem)
      return shortHandMatchedItem

    const aliasInput = transformByWarframeAlias(normalizedInput)
    if (aliasInput) {
      const aliasShortHandMatchedItem = matchByShortHand(aliasInput, lookup)
      if (aliasShortHandMatchedItem)
        return aliasShortHandMatchedItem
    }

    const suffixMatchedItem = matchBySuffixVariantLookup(normalizedInput, lookup)
    if (suffixMatchedItem)
      return suffixMatchedItem

    if (aliasInput) {
      const aliasSuffixMatchedItem = matchBySuffixVariantLookup(aliasInput, lookup)
      if (aliasSuffixMatchedItem)
        return aliasSuffixMatchedItem
    }

    // 4. TODO: First char compare
    // Not implemented

    // 5. TODO: Fuzzy word match
    // Not implemented

    // 6. TODO: AI?

    return undefined
  }

  return {
    buildSuffixVariantCandidates,
    matchByShortHand,
    matchBySlugDict,
    matchBySuffixVariantLookup,
    removeNameSuffix,
    shortHandProcess,
    stringToWFMItem,
    transformByWarframeAlias,
  }
})()

export const buildSuffixVariantCandidates = wfmItemMatcher.buildSuffixVariantCandidates
export const matchByShortHand = wfmItemMatcher.matchByShortHand
export const matchBySlugDict = wfmItemMatcher.matchBySlugDict
export const matchBySuffixVariantLookup = wfmItemMatcher.matchBySuffixVariantLookup
export const removeNameSuffix = wfmItemMatcher.removeNameSuffix
export const shortHandProcess = wfmItemMatcher.shortHandProcess
export const stringToWFMItem = wfmItemMatcher.stringToWFMItem
export const transformByWarframeAlias = wfmItemMatcher.transformByWarframeAlias
