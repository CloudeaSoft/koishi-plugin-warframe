import { loadAssetJson } from '../utils/assets'

export const {
  incarnons,
  warframes,
} = loadAssetJson<{
  incarnons: string[][]
  warframes: string[][]
}>('circuitRewards.json')
