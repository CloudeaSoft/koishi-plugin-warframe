import type {
  TMissionType,
} from 'warframe-public-export-plus'
import type { VoidTraderItem } from '../../types'
import {
  dict_zh,
  ExportBoosterPacks,
  ExportBundles,
  ExportCustoms,
  ExportFlavour,
  ExportKeys,
  ExportRecipes,
  ExportRelics,
  ExportResources,
  ExportUpgrades,
  ExportVirtuals,
  ExportWeapons,
} from 'warframe-public-export-plus'
import { dictToKeyDict, toPascalCase } from '../../utils'
import { getItemIconUrl } from './wf-api'
import { relicEraToTransKey } from './wf-export-adapter'

function relicToFullNameZH(tier: string, category: string): string {
  return `${
    dict_zh[relicEraToTransKey(tier)] ?? toPascalCase(tier)
  } ${category} 遗物`
}

let solNodesEnDict: Record<string, string>

export async function getSolNodeKey(name: string): Promise<string> {
  const worldstateData = await import('warframe-worldstate-data')
  if (!solNodesEnDict) {
    solNodesEnDict = dictToKeyDict(worldstateData.default.solNodes, n => [
      n.value,
    ])
  }
  return solNodesEnDict[name]
}

let missionTypeEnDict: Record<string, TMissionType>

export async function getMissionTypeKey(name: string): Promise<TMissionType> {
  const worldstateData = await import('warframe-worldstate-data')
  if (!missionTypeEnDict) {
    missionTypeEnDict = dictToKeyDict(
      worldstateData.default.missionTypes,
      n => [n.value],
    ) as Record<string, TMissionType>
  }

  if (name === 'Disruption')
    return 'MT_ARTIFACT'

  return missionTypeEnDict[name]
}

export const fissureTierName = {
  1: '/Lotus/Language/Relics/Era_LITH',
  2: '/Lotus/Language/Relics/Era_MESO',
  3: '/Lotus/Language/Relics/Era_NEO',
  4: '/Lotus/Language/Relics/Era_AXI',
  5: '/Lotus/Language/Relics/Era_REQUIEM',
  6: '/Lotus/Language/Relics/Era_OMNI',
  7: '/Lotus/Language/Relics/Era_VANGUARD',
}

export function fissureTierNumToNumber(a: number | string): number {
  return typeof a === 'string' ? Number(a.charAt(5)) : a
}

export async function translateSortieBoss(key: string): Promise<string> {
  const { sortieBoss } = await import('warframe-worldstate-data/utilities')
  return sortieBoss(key, 'zh')
}

export async function translateSortieFaction(key: string): Promise<string> {
  const { sortieFaction } = await import('warframe-worldstate-data/utilities')
  return sortieFaction(key, 'zh')
}

export async function translateSortieModifier(key: string): Promise<string> {
  const { sortieModifier } = await import('warframe-worldstate-data/utilities')
  return sortieModifier(key, 'zh')
}

export async function translateLanguageString(key: string): Promise<string> {
  const { languageString } = await import('warframe-worldstate-data/utilities')
  return languageString(key, 'zh')
}

export function getVoidTraderItem(i: {
  item: string
  uniqueName: string
  ducats: number
  credits: number
}): VoidTraderItem {
  const entry = getVoidTraderExport(i.uniqueName)
  const key = entry?.name
  const name = key ? (dict_zh[key] ?? (key.includes('/') ? i.item : key)) : i.item
  const icon = entry?.icon
  const iconUrl = icon && getItemIconUrl(icon)
  return { name, ducats: i.ducats, credits: i.credits, ...(iconUrl && { iconUrl }) }
}

export interface SteelPathCatalogOffering {
  name: string
  cost: number
}

export interface SteelPathCatalog {
  rotation: SteelPathCatalogOffering[]
  evergreen: SteelPathCatalogOffering[]
}

export async function getSteelPathCatalogs(): Promise<{
  zh: SteelPathCatalog
  en: SteelPathCatalog
}> {
  const { steelPath } = await import('warframe-worldstate-data/utilities')
  return {
    zh: steelPath('zh'),
    en: steelPath('en'),
  }
}

function getVoidTraderExport(sourceKey: string): { name?: string, icon?: string } | undefined {
  const fixedKey = sourceKey.replace('/StoreItems', '')
  const item = ExportFlavour[fixedKey] ?? ExportWeapons[fixedKey] ?? ExportUpgrades[fixedKey]
  if (item)
    return item
  const relic = ExportRelics[fixedKey]
  if (relic)
    return { name: relicToFullNameZH(relic.era, relic.category), icon: relic.icon }

  const recipe = ExportRecipes[fixedKey]
  return ExportCustoms[fixedKey]
    ?? (recipe && ExportKeys[recipe.resultType])
    ?? ExportVirtuals[fixedKey]
    ?? ExportResources[fixedKey]
    ?? ExportBundles[sourceKey]
    ?? ExportBoosterPacks[fixedKey]
}
