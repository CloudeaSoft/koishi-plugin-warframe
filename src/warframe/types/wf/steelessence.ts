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

export interface SteelEssenceOfferingInfo {
  name: string
  cost: number
}

export interface SteelEssenceBoard {
  title: string
  costLabel: string
  remaining: string
  expiry: number
  current: SteelEssenceOfferingInfo
  upcoming: SteelEssenceOfferingInfo[]
}
