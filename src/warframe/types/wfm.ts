import type { RivenAttribute, RivenOrder } from 'wfm-api-client'
import type { WarframeError } from './warframe-result'
import type { RivenStatAnalyzeResult } from './wf/riven'

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

export interface RivenOrderFilters {
  positiveStats?: string[]
  negativeStat?: string
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
    attribute?: RivenAttribute
    displayValue?: number
    grade?: number
  }

export type RivenOrderInternal = Omit<RivenOrder, 'item'> & {
  analysis?: RivenStatAnalyzeResult
  analysisError?: WarframeError
  item: Omit<RivenOrder['item'], 'attributes'> & {
    attributes: RivenAttributeShortInternal[]
  }
}
