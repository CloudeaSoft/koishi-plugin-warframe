import type { WFRegionShort } from './region'

export interface AlertReward {
  name: string
  count: number
}

export interface AlertInfo {
  description?: string
  type: string
  node: WFRegionShort
  rewards: AlertReward[]
  remaining: string
  expiry: number
  nightmare?: string
}

export interface AlertBoard {
  title: string
  alerts: AlertInfo[]
}
