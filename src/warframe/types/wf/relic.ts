export type RelicTier = 'Lith' | 'Meso' | 'Neo' | 'Axi' | 'Requiem' | 'Vanguard'
export type RelicQuality = 'Intact' | 'Exceptional' | 'Flawless' | 'Radiant'
export type RelicRewardRarity = 'COMMON' | 'UNCOMMON' | 'RARE'

export interface ExternalRelic {
  tier: RelicTier
  num: string
  quality: RelicQuality
  items: ExternalRelicReward[]
}

export interface ExternalRelicReward {
  name: string
  rate: number
}

export interface Relic {
  tier: RelicTier
  tierKey: string
  num: string
  items: RelicReward[]
}

export interface RelicReward {
  name: string
  rarity: RelicRewardRarity
  quantity: number
}

export interface OutputRelic {
  tier: string
  num: string
  items: OutputRelicReward[]
}

export interface OutputRelicReward extends RelicReward {
  ducats?: number
  platinum?: number
}
