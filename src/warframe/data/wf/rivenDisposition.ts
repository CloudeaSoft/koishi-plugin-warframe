import type { RivenWeaponDisposition } from '../../types'
import type { RivenExportWeapon } from '../../types/wf/riven-export'
import { ExportUpgrades, ExportWeapons } from 'warframe-public-export-plus'
import { rivenPublicExport } from '../../assets/index'
import { getRivenWeaponParent, rivenDefinitionTypes } from '../../infrastructure/wf/riven-export-adapter'
import { normalizeName } from '../../utils'

// The enriched export supplies compatibility metadata, never numeric values.
const weaponTypes: Record<string, string> = {}
for (const [path, definition] of Object.entries(ExportUpgrades)) {
  const type = rivenDefinitionTypes[path.split('/').pop()!]
  if (!type)
    continue
  for (const item of definition.compatibleItems ?? []) weaponTypes[item] = type
}

export function buildWeaponRivenDispositionDict(
  weapons: RivenExportWeapon[],
  namesZh: Record<string, string>,
  types: Record<string, string>,
): Record<string, RivenWeaponDisposition> {
  const result: Record<string, RivenWeaponDisposition> = {}
  for (const weapon of weapons) {
    if (!Number.isFinite(weapon.omegaAttenuation) || weapon.omegaAttenuation <= 0)
      continue
    const type = types[weapon.uniqueName]
    if (!type)
      continue
    const add = (en: string, zh: string, disposition: number): void => {
      const data: RivenWeaponDisposition = {
        name: { en, zh },
        calc: { name: en, disposition, riventype: type, texture: '' },
        weapon,
      }
      result[normalizeName(en)] = result[normalizeName(zh)] = data
    }
    const zh = namesZh[weapon.uniqueName] ?? weapon.name
    if (type === 'Kitgun') {
      add(`${weapon.name} (Secondary)`, `${zh}（副武器）`, weapon.omegaAttenuation)
      if (weapon.primeOmegaAttenuation && Number.isFinite(weapon.primeOmegaAttenuation)) {
        add(`${weapon.name} (Primary)`, `${zh}（主武器）`, weapon.primeOmegaAttenuation)
      }
    }
    else {
      add(weapon.name, zh, weapon.omegaAttenuation)
    }
  }
  return result
}

// Only categories unambiguously identified by the export are safe fallbacks.
for (const weapon of rivenPublicExport.weapons) {
  if (weaponTypes[weapon.uniqueName])
    continue
  const metadata = ExportWeapons[weapon.uniqueName]
  const category = weapon.productCategory
  const type = category === 'Melee'
    ? 'Melee'
    : category === 'SpaceGuns'
      ? 'Archgun'
      : category === 'Pistols'
        ? 'Pistol'
        : category === 'LongGuns' && metadata?.holsterCategory ? (metadata.holsterCategory === 'SHOTGUN' ? 'Shotgun' : 'Rifle') : undefined
  if (type)
    weaponTypes[weapon.uniqueName] = type
}

export const weaponRivenDispositionDict = buildWeaponRivenDispositionDict(
  rivenPublicExport.weapons,
  rivenPublicExport.weaponNamesZh,
  weaponTypes,
)

const weaponsByPath = new Map(rivenPublicExport.weapons.map(weapon => [weapon.uniqueName, weapon]))

function familyRoot(path: string): string {
  const visited = new Set<string>()
  let parent = getRivenWeaponParent(path)
  // Follow actual exported weapons only, never a shared generic weapon class.
  while (parent && weaponsByPath.has(parent) && !visited.has(parent)) {
    visited.add(path)
    path = parent
    parent = getRivenWeaponParent(path)
  }
  return path
}

const familyByPath = new Map([...weaponsByPath.keys()].map(path => [path, familyRoot(path)]))
const weaponVariants = [...new Set(Object.values(weaponRivenDispositionDict))]

export function getRivenWeaponCandidates(name: string): RivenWeaponDisposition[] {
  const normalized = normalizeName(name)
  const weapon = weaponRivenDispositionDict[normalized]
    ?? weaponRivenDispositionDict[normalizeName(`${name} (Primary)`)]
    ?? weaponRivenDispositionDict[normalizeName(`${name}（主武器）`)]
    ?? weaponRivenDispositionDict[normalizeName(`${name} (Secondary)`)]
    ?? weaponRivenDispositionDict[normalizeName(`${name}（副武器）`)]
  if (!weapon)
    return []
  const family = familyByPath.get(weapon.weapon.uniqueName)
  return weaponVariants.filter(candidate => candidate.calc.riventype === weapon.calc.riventype
    && familyByPath.get(candidate.weapon.uniqueName) === family)
}
