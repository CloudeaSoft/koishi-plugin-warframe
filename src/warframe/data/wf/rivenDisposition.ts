import type { RivenWeaponDisposition } from '../../types'
import type { RivenExportWeapon } from '../../types/wf/riven-export'
import { ExportUpgrades, ExportWeapons } from 'warframe-public-export-plus'
import { rivenPublicExport } from '../../assets/index'
import { rivenDefinitionTypes } from '../../infrastructure/wf/riven-export-adapter'
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
