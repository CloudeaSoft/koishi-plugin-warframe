import { rivenAttrValues } from '../../assets/index'
import { normalizeName } from '../../utils'

export type RivenAttrValueDict = Record<string, Record<string, number>>

function wfmKeyForRivenAttr(attrKey: string): string {
  const removeDamageSuffix
    = attrKey.endsWith('Damage')
      && attrKey !== 'Damage'
      && attrKey !== 'Finisher Damage'
      && !attrKey.startsWith('Critical')
  return removeDamageSuffix
    ? normalizeName(attrKey.replace('Damage', ''))
    : normalizeName(attrKey)
}

export function buildRivenAttrValueDict(
  source: RivenAttrValueDict,
): RivenAttrValueDict {
  const dict: RivenAttrValueDict = {}
  for (const weaponType in source) {
    const attrs = source[weaponType]
    dict[weaponType] = {}
    for (const attrKey in attrs) {
      dict[weaponType][wfmKeyForRivenAttr(attrKey)] = attrs[attrKey]
    }
  }
  return dict
}

export const rivenAttrValueDict = buildRivenAttrValueDict(rivenAttrValues)
