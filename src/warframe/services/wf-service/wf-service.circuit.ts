import { dict_zh } from 'warframe-public-export-plus'

import {
  incarnons as incarnonRewards,
  warframes as warframeRewards,
} from '../../assets/index'

export function getCircuitWeek(): {
  currentIncarnons: number
  currentWarframes: number
  allIncarnons: string[][]
  allWarframes: string[][]
} {
  const EPOCH = 1734307200 * 1000
  const week = Math.trunc((Date.now() - EPOCH) / 604800000)
  const index1 = (week + 1) % incarnonRewards.length
  const index2 = (week + 8) % warframeRewards.length
  const incarnons = incarnonRewards.map(v => v.map(i => dict_zh[i]))
  const warframes = warframeRewards.map(v => v.map(i => dict_zh[i]))
  return {
    currentIncarnons: index1,
    currentWarframes: index2,
    allIncarnons: incarnons,
    allWarframes: warframes,
  }
}
