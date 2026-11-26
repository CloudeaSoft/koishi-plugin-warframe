export type LichWeaponFamily = 'tenet' | 'coda'
export type CodaBatch = 'A' | 'B'

export interface LichBonus {
  element: string
  percent: number
  source: 'WarframeTR' | 'WARFRAME Wiki'
  compared: boolean
}

export interface LichOfferings {
  family: LichWeaponFamily
  batch?: CodaBatch
  expiresAt: number
  weapons: { name: string, bonus?: LichBonus }[]
}
