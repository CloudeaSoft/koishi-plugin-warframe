export interface RawInvasionCountedItem {
  ItemType: string
  ItemCount: number
}

export interface RawInvasionReward {
  items?: string[]
  countedItems?: RawInvasionCountedItem[]
  credits?: number
}

export interface RawInvasionMissionInfo {
  seed?: number
  faction?: string
}

export interface RawInvasion {
  _id?: { $oid?: string, $id?: string }
  Faction?: string
  DefenderFaction?: string
  Node: string
  Count?: number
  Goal?: number
  LocTag?: string
  Completed?: boolean
  AttackerReward?: RawInvasionReward | unknown[]
  DefenderReward?: RawInvasionReward | unknown[]
  AttackerMissionInfo?: RawInvasionMissionInfo
  DefenderMissionInfo?: RawInvasionMissionInfo
}

export interface InvasionReward {
  name: string
  count: number
}

export type InvasionFactionTone = 'grineer' | 'corpus' | 'infested' | 'other'

export interface InvasionSide {
  faction: string
  tone: InvasionFactionTone
  rewards: InvasionReward[]
}

export interface Invasion {
  id: string
  planet: string
  node: string
  attacker: InvasionSide
  defender: InvasionSide
  vsInfestation: boolean
  completion: number
}

export interface InvasionPlanetGroup {
  planet: string
  title: string
  completion: number
  invasions: Invasion[]
}

export interface InvasionBoard {
  title: string
  planets: InvasionPlanetGroup[]
}
