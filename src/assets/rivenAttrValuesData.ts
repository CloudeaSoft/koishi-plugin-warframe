import { loadAssetJson } from '../utils/assets'

export const rivenAttrValues = loadAssetJson<
  Record<string, Record<string, number>>
>('rivenAttrValues.json')
