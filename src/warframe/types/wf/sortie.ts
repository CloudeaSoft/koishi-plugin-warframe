import type { WFRegionShort } from './region'

export interface RawSortieVariant {
  missionType?: string
  modifierType?: string
  node?: string
}

export interface RawSortie {
  Boss?: string
  Variants?: RawSortieVariant[]
  Activation?: { $date?: { $numberLong?: string } }
  Expiry?: { $date?: { $numberLong?: string } }
}

export interface SortieMission {
  type: string
  node: WFRegionShort
  modifier: string
}

export interface Sortie {
  modeName: string
  boss: string
  faction: string
  expiry: number
  remaining: string
  missions: SortieMission[]
}
