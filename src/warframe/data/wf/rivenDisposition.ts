import type { IWeapon } from 'warframe-public-export-plus'
import type { RivenWeaponDisposition } from '../../types'
import { dict_en, dict_zh, ExportWeapons } from 'warframe-public-export-plus'
import { rivenCalc } from '../../assets/index'
import { listToDict, normalizeName } from '../../utils'

function uniqueNameTail(uniqueName: string): string | undefined {
  const parts = uniqueName.split('/')
  if (parts.length <= 0) {
    return undefined
  }
  return parts[parts.length - 1]
}

function findExportWeapon(
  calcName: string,
  exportWeapons: Record<string, IWeapon>,
  dictEn: Record<string, string>,
): IWeapon | undefined {
  const normalizedCalcName = normalizeName(calcName)
  for (const weaponKey in exportWeapons) {
    const weapon = exportWeapons[weaponKey]
    const tail = uniqueNameTail(weapon.name)
    if (tail === undefined) {
      continue
    }

    if (normalizeName(tail) === normalizedCalcName) {
      return weapon
    }

    const weaponEN = dictEn[weapon.name]
    if (weaponEN && normalizeName(weaponEN) === normalizedCalcName) {
      return weapon
    }
  }
  return undefined
}

export function buildWeaponRivenDispositionDict(
  calcWeapons: RivenWeaponDisposition['calc'][],
  exportWeapons: Record<string, IWeapon>,
  dictEn: Record<string, string>,
  dictZh: Record<string, string>,
): Record<string, RivenWeaponDisposition> {
  const mapped: RivenWeaponDisposition[] = []
  for (const element of calcWeapons) {
    const weapon = findExportWeapon(element.name, exportWeapons, dictEn)
    if (!weapon) {
      continue
    }

    mapped.push({
      name: {
        en: dictEn[weapon.name],
        zh: dictZh[weapon.name],
      },
      calc: element,
      weapon,
    })
  }

  return listToDict(mapped, e => [
    normalizeName(e.name.zh),
    normalizeName(e.name.en),
  ])
}

export const weaponRivenDispositionDict = buildWeaponRivenDispositionDict(
  rivenCalc.weapons,
  ExportWeapons,
  dict_en,
  dict_zh,
)
