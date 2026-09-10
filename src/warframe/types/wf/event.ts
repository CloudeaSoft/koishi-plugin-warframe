import type { RawMongoDate } from './nightwave'
import type { WFRegionShort } from './region'

export interface RawEventCountedItem {
  ItemType?: string
  ItemCount?: number
  type?: string
  key?: string
  count?: number
}

export interface RawEventReward {
  items?: string[]
  countedItems?: RawEventCountedItem[]
  credits?: number
}

export interface RawWorldEvent {
  _id?: { $oid?: string, $id?: string }
  Activation?: RawMongoDate
  Expiry?: RawMongoDate
  Node?: string
  Count?: number
  Goal?: number
  HealthPct?: number
  Desc?: string
  ToolTip?: string
  ScoreLocTag?: string
  Tag?: string
  Reward?: RawEventReward
  InterimGoals?: number[]
  InterimRewards?: RawEventReward[]
}

export interface EventReward {
  name: string
  count: number
}

export interface EventInterimStep {
  goal: number
  rewards: EventReward[]
}

export interface EventInfo {
  id: string
  name: string
  description?: string
  scoreLabel?: string
  node?: WFRegionShort
  remaining?: string
  expiry: number
  currentScore: number
  maximumScore: number
  progress?: number
  rewards: EventReward[]
  interimSteps: EventInterimStep[]
}

export interface EventBoard {
  title: string
  events: EventInfo[]
}
