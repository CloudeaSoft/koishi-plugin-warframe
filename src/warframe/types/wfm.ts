import type { RivenAttribute, RivenOrder } from 'wfm-api-client'

export type {
  ClosedStatisticsEntry,
  Ducatnator,
  ItemShort,
  LiveStatisticsEntry,
  OrderWithUser,
  RivenAttribute,
  RivenAttributeUnit,
  RivenItem,
  RivenOrder,
  StatisticsCollection,
  WFMLang,
} from 'wfm-api-client'

export interface PrimedModHistoryItem {
  name: string | undefined
  last: string
  plats?: number
}

export interface ItemStatisticsPoint {
  datetime: string
  median: number
  waPrice: number
  volume: number
  donchTop: number
  donchBot: number
}

export interface ItemStatisticsSummary {
  chart: ItemStatisticsPoint[]
  recentAvg?: number
  recentVolume: number
  baselineMedian?: number
  trend: 'up' | 'down' | 'flat'
  rangeMin?: number
  rangeMax?: number
  onlineMin: number
}

export type RivenAttributeShortInternal
  = RivenOrder['item']['attributes'][number] & {
    attribute: RivenAttribute
  }

export type RivenOrderInternal = Omit<RivenOrder, 'item'> & {
  item: Omit<RivenOrder['item'], 'attributes'> & {
    attributes: RivenAttributeShortInternal[]
  }
}
