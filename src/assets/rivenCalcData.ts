import type { RivenWeaponDisposition } from '../types/wf/riven'
import { loadAssetJson } from '../utils/assets'

export const rivenCalc = loadAssetJson<{
  weapons: RivenWeaponDisposition['calc'][]
}>('rivencalc.json')
