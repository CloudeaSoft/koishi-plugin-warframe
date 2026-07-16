import type { WFRegionShort } from './region'

export interface ArchonHunt {
  name: string
  missions: ArchonHuntMissions[]
}

export interface ArchonHuntMissions {
  type: string
  node: WFRegionShort
}

export interface ArchiMedea {
  name: string
  missions: ArchiMedeaMission[]
  peronal: ArchiMedeaDebuff[]
}

export interface ArchiMedeaMission {
  type: string
  deviation: ArchiMedeaDebuff
  risks: ArchiMedeaDebuff[]
}

export interface ArchiMedeaDebuff {
  name: string
  desc: string
}
