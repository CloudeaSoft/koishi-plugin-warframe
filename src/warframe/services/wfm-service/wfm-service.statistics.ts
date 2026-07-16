import type {
  ItemStatisticsPoint,
  ItemStatisticsSummary,
  StatisticsCollection,
} from '../../types'

const TREND_THRESHOLD = 0.02
const CHART_DAYS = 7
const RECENT_DAYS = 3

function medianOf(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted[mid]
}

export function computeItemStatistics(
  stats: StatisticsCollection,
  targetRank: number | undefined,
  onlineMin: number,
): ItemStatisticsSummary {
  const closed90 = stats.statistics_closed['90days'].filter(
    e => e.mod_rank === targetRank && e.volume > 0,
  )

  let rangeMin: number | undefined
  let rangeMax: number | undefined
  for (const e of closed90) {
    if (rangeMin === undefined || e.min_price < rangeMin)
      rangeMin = e.min_price
    if (rangeMax === undefined || e.max_price > rangeMax)
      rangeMax = e.max_price
  }

  const chartSlice = closed90.slice(-CHART_DAYS)
  const chart: ItemStatisticsPoint[] = chartSlice.map(e => ({
    datetime: e.datetime,
    median: e.median,
    waPrice: e.wa_price,
    volume: e.volume,
    donchTop: e.donch_top,
    donchBot: e.donch_bot,
  }))

  let baselineMedian: number | undefined
  if (chartSlice.length > 0) {
    baselineMedian = medianOf(chartSlice.map(e => e.median))
  }

  const recentSlice = closed90.slice(-RECENT_DAYS)
  let recentAvg: number | undefined
  let recentVolume = 0
  if (recentSlice.length > 0) {
    let weightedSum = 0
    let totalVolume = 0
    for (const e of recentSlice) {
      weightedSum += e.wa_price * e.volume
      totalVolume += e.volume
    }
    recentVolume = totalVolume
    if (totalVolume > 0) {
      recentAvg = Math.round((weightedSum / totalVolume) * 10) / 10
    }
  }

  let trend: 'up' | 'down' | 'flat' = 'flat'
  if (recentAvg !== undefined && baselineMedian !== undefined && baselineMedian > 0) {
    const ratio = recentAvg / baselineMedian
    if (ratio > 1 + TREND_THRESHOLD)
      trend = 'up'
    else if (ratio < 1 - TREND_THRESHOLD)
      trend = 'down'
  }

  return {
    chart,
    recentAvg,
    recentVolume,
    baselineMedian,
    trend,
    rangeMin,
    rangeMax,
    onlineMin,
  }
}
