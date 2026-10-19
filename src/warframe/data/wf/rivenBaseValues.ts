import { rivenPublicExport } from '../../assets/index'
import { adaptRivenDefinitions } from '../../infrastructure/wf/riven-export-adapter'

export type RivenAttrValueDict = Record<string, Record<string, number>>

export const rivenStatsByType = adaptRivenDefinitions(rivenPublicExport.upgrades)
export const rivenAttributes = [...new Map(Object.values(rivenStatsByType).flat().map(stat => [stat.gameRef, stat])).values()]
export const rivenAttrValueDict: RivenAttrValueDict = Object.fromEntries(
  Object.entries(rivenStatsByType).map(([type, stats]) => [
    type,
    Object.fromEntries(stats.filter(stat => stat.verified).map(stat => [stat.key, stat.baseValue])),
  ]),
)
