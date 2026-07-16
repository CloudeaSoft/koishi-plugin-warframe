import type { RivenWeaponDisposition } from '../types'
import { loadAssetJson, loadAssetText } from '../utils/assets'

export interface BaroParsedItem {
  name: string
  last: string
  plats: number
}

export type ArbyRewards = Record<string, number>

export const {
  incarnons,
  warframes,
} = loadAssetJson<{
  incarnons: string[][]
  warframes: string[][]
}>('circuitRewards.json')

export const rivenAttrValues = loadAssetJson<
  Record<string, Record<string, number>>
>('rivenAttrValues.json')

export const rivenCalc = loadAssetJson<{
  weapons: RivenWeaponDisposition['calc'][]
}>('rivencalc.json')

export const dictEnExtra = loadAssetJson<Record<string, string>>('en.json')
export const dictZhExtra = loadAssetJson<Record<string, string>>('zh.json')

export const arbitrationScheduleText = loadAssetText('arbys.txt')
export const arbyRewards = loadAssetJson<ArbyRewards>('arbyRewards.json')

export const Baro = loadAssetText('baro.txt')
export const BaroParsed = loadAssetJson<BaroParsedItem[]>('baroParsed.json')

export const warframeAlias = loadAssetJson<Record<string, string[]>>('warframeAlias.json')
