export interface RawSteelPathOffering {
  name?: string
  cost?: number
}

export interface RawSteelPathOfferings {
  currentReward?: RawSteelPathOffering
  activation?: Date
  expiry?: Date
  rotation?: RawSteelPathOffering[]
}

export interface SteelPathOfferingInfo {
  name: string
  cost: number
}

export interface SteelPathBoard {
  title: string
  costLabel: string
  remaining: string
  expiry: number
  current: SteelPathOfferingInfo
  upcoming: SteelPathOfferingInfo[]
}
