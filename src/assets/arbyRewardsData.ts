import { loadAssetJson } from '../utils/assets'

export type ArbyRewards = Record<string, number>

export default loadAssetJson<ArbyRewards>('arbyRewards.json')
