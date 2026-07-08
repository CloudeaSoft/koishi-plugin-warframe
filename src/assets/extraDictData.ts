import { loadAssetJson } from '../utils/assets'

export const dictEnExtra = loadAssetJson<Record<string, string>>('en.json')
export const dictZhExtra = loadAssetJson<Record<string, string>>('zh.json')
