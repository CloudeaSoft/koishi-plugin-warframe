import { loadAssetJson, loadAssetText } from '../utils/assets'

export interface BaroParsedItem {
  name: string
  last: string
  plats: number
}

export const Baro = loadAssetText('baro.txt')
export const BaroParsed = loadAssetJson<BaroParsedItem[]>('baroParsed.json')