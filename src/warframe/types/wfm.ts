import type {
  ItemShort as WfmItemShort,
  OrderWithUser as WfmOrderWithUser,
  RivenAttribute as WfmRivenAttribute,
  RivenAttributeI18N,
  RivenOrder,
  WFMLang,
} from 'wfm-api-client'

export type {
  ClosedStatisticsEntry,
  Ducatnator,
  LiveStatisticsEntry,
  RivenAttributeUnit,
  RivenItem,
  RivenOrder,
  StatisticsCollection,
  WFMLang,
} from 'wfm-api-client'

export type ItemShort = Omit<WfmItemShort, 'i18n'> & {
  i18n: NonNullable<WfmItemShort['i18n']>
}

export type OrderWithUser = Omit<WfmOrderWithUser, 'user'> & {
  user: NonNullable<WfmOrderWithUser['user']>
}

type RequiredRivenAttributeI18N = RivenAttributeI18N & {
  name: string
}

export type RivenAttribute = Omit<WfmRivenAttribute, 'i18n' | 'unit'> & {
  i18n: Partial<Record<WFMLang, RequiredRivenAttributeI18N>> & {
    en: RequiredRivenAttributeI18N
    'zh-hans': RequiredRivenAttributeI18N
  }
  unit: string
}

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
