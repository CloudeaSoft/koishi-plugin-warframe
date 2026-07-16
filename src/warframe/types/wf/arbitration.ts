import type { WFRegionShort } from './region'

export interface ArbitrationShort {
  time: number
  node: string
}

export interface Arbitration extends WFRegionShort {
  time: string
  rewards: number
}
