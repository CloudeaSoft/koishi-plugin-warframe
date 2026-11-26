export type LichWeaponFamily = 'tenet' | 'coda'
export type CodaBatch = 'A' | 'B'

export type RawLichOffers = Partial<Record<string, { damage: string, percent: number }>>

export interface LichReport {
  offers: RawLichOffers
  updatedAt?: string
}

export interface LichRotation {
  family: LichWeaponFamily
  batch?: CodaBatch
  start: number
  expiresAt: number
  roster: readonly string[]
}

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
