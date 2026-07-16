import type {
  ClosedStatisticsEntry,
  StatisticsCollection,
} from '../../../src/warframe/types/wfm'
import { expect } from 'chai'
import { computeItemStatistics } from '../../../src/warframe/services/wfm-service/wfm-service.statistics'
import modStats from '../../assets/test-item-statistics-mod.json'
import nonModStats from '../../assets/test-item-statistics.json'

function makeEntry(
  day: number,
  median: number,
  waPrice: number,
  volume: number,
  options: {
    minPrice?: number
    maxPrice?: number
    donchTop?: number
    donchBot?: number
    modRank?: number
  } = {},
): ClosedStatisticsEntry {
  const d = new Date(Date.UTC(2024, 0, day))
  return {
    datetime: d.toISOString(),
    volume,
    min_price: options.minPrice ?? median - 5,
    max_price: options.maxPrice ?? median + 5,
    open_price: median,
    closed_price: median,
    avg_price: median,
    wa_price: waPrice,
    median,
    moving_avg: median,
    donch_top: options.donchTop ?? median + 8,
    donch_bot: options.donchBot ?? median - 3,
    id: `entry-${day}`,
    mod_rank: options.modRank ?? 0,
  }
}

function makeStats(entries: ClosedStatisticsEntry[]): StatisticsCollection {
  return {
    statistics_closed: {
      '48hours': [],
      '90days': entries,
    },
    statistics_live: {
      '48hours': [],
      '90days': [],
    },
  }
}

describe('computeItemStatistics', () => {
  it('computes chart, recent average, baseline median, range and online min', () => {
    const entries: ClosedStatisticsEntry[] = []
    const medians = [18, 19, 20, 20, 21, 21, 22, 22, 23, 23]
    for (let i = 0; i < 10; i++) {
      entries.push(makeEntry(i + 1, medians[i], medians[i], 10))
    }
    const result = computeItemStatistics(makeStats(entries), 0, 15)

    expect(result.onlineMin).to.equal(15)
    expect(result.chart).to.have.length(7)
    expect(result.chart[0].median).to.equal(20)
    expect(result.chart[6].median).to.equal(23)
    expect(result.recentVolume).to.equal(30)
    expect(result.recentAvg).to.equal(22.7)
    expect(result.baselineMedian).to.equal(22)
    expect(result.rangeMin).to.equal(13)
    expect(result.rangeMax).to.equal(28)
  })

  it('detects upward trend when recent average exceeds baseline by more than 2%', () => {
    const entries: ClosedStatisticsEntry[] = []
    const medians = [20, 20, 20, 20, 20, 20, 20, 25, 25, 25]
    for (let i = 0; i < 10; i++) {
      entries.push(makeEntry(i + 1, medians[i], medians[i], 10))
    }
    const result = computeItemStatistics(makeStats(entries), 0, 20)

    expect(result.trend).to.equal('up')
  })

  it('detects downward trend when recent average falls below baseline by more than 2%', () => {
    const entries: ClosedStatisticsEntry[] = []
    const medians = [25, 25, 25, 25, 25, 25, 25, 20, 20, 20]
    for (let i = 0; i < 10; i++) {
      entries.push(makeEntry(i + 1, medians[i], medians[i], 10))
    }
    const result = computeItemStatistics(makeStats(entries), 0, 25)

    expect(result.trend).to.equal('down')
  })

  it('reports flat trend when recent average is within 2% of baseline', () => {
    const entries: ClosedStatisticsEntry[] = []
    for (let i = 0; i < 10; i++) {
      entries.push(makeEntry(i + 1, 22, 22, 10))
    }
    const result = computeItemStatistics(makeStats(entries), 0, 22)

    expect(result.trend).to.equal('flat')
  })

  it('filters statistics by mod_rank', () => {
    const entries: ClosedStatisticsEntry[] = []
    for (let i = 0; i < 5; i++) {
      entries.push(makeEntry(i + 1, 20 + i, 20 + i, 10, { modRank: 0 }))
    }
    for (let i = 0; i < 5; i++) {
      entries.push(makeEntry(i + 6, 100 + i, 100 + i, 10, { modRank: 10 }))
    }
    const result = computeItemStatistics(makeStats(entries), 0, 15)

    expect(result.chart).to.have.length(5)
    expect(result.chart[0].median).to.equal(20)
    expect(result.chart[4].median).to.equal(24)
    expect(result.rangeMax).to.equal(29)
  })

  it('excludes zero-volume days from all computations', () => {
    const entries: ClosedStatisticsEntry[] = []
    for (let i = 0; i < 5; i++) {
      const vol = i === 4 ? 0 : 10
      entries.push(makeEntry(i + 1, 20, 20, vol))
    }
    const result = computeItemStatistics(makeStats(entries), 0, 15)

    expect(result.chart).to.have.length(4)
    expect(result.recentVolume).to.equal(30)
  })

  it('returns undefined aggregates when no data matches the target rank', () => {
    const entries: ClosedStatisticsEntry[] = []
    for (let i = 0; i < 5; i++) {
      entries.push(makeEntry(i + 1, 20 + i, 20 + i, 10, { modRank: 10 }))
    }
    const result = computeItemStatistics(makeStats(entries), 0, 15)

    expect(result.chart).to.have.length(0)
    expect(result.recentAvg).to.equal(undefined)
    expect(result.recentVolume).to.equal(0)
    expect(result.baselineMedian).to.equal(undefined)
    expect(result.rangeMin).to.equal(undefined)
    expect(result.rangeMax).to.equal(undefined)
    expect(result.onlineMin).to.equal(15)
  })

  it('handles fewer than seven days of data', () => {
    const entries: ClosedStatisticsEntry[] = []
    for (let i = 0; i < 3; i++) {
      entries.push(makeEntry(i + 1, 20 + i, 20 + i, 10))
    }
    const result = computeItemStatistics(makeStats(entries), 0, 15)

    expect(result.chart).to.have.length(3)
    expect(result.baselineMedian).to.equal(21)
    expect(result.recentAvg).to.equal(21)
    expect(result.recentVolume).to.equal(30)
  })

  it('handles a single day of data', () => {
    const entries = [makeEntry(1, 20, 20, 5)]
    const result = computeItemStatistics(makeStats(entries), 0, 15)

    expect(result.chart).to.have.length(1)
    expect(result.baselineMedian).to.equal(20)
    expect(result.recentAvg).to.equal(20)
    expect(result.recentVolume).to.equal(5)
    expect(result.trend).to.equal('flat')
  })

  it('weights recent average by daily volume', () => {
    const entries = [
      makeEntry(1, 30, 30, 2),
      makeEntry(2, 10, 10, 18),
    ]
    const result = computeItemStatistics(makeStats(entries), 0, 15)

    expect(result.recentVolume).to.equal(20)
    expect(result.recentAvg).to.equal(12)
  })
})

describe('computeItemStatistics - real fixtures', () => {
  const nonModPayload = (nonModStats as { payload: StatisticsCollection }).payload
  const modPayload = (modStats as { payload: StatisticsCollection }).payload

  it('handles a real non-mod item whose entries omit mod_rank (targetRank = undefined)', () => {
    const result = computeItemStatistics(nonModPayload, undefined, 65)

    expect(result.onlineMin).to.equal(65)
    expect(result.chart).to.have.length(7)
    expect(result.recentVolume).to.equal(246)
    expect(result.recentAvg).to.equal(67.7)
    expect(result.baselineMedian).to.equal(68)
    expect(result.rangeMin).to.equal(30)
    expect(result.rangeMax).to.equal(130)
    expect(result.trend).to.equal('flat')
    for (const p of result.chart) {
      expect(Number.isFinite(p.median)).to.equal(true)
      expect(Number.isFinite(p.waPrice)).to.equal(true)
      expect(Number.isFinite(p.donchTop)).to.equal(true)
      expect(Number.isFinite(p.donchBot)).to.equal(true)
    }
  })

  it('filters a real mod item by rank 0', () => {
    const result = computeItemStatistics(modPayload, 0, 240)

    expect(result.onlineMin).to.equal(240)
    expect(result.chart).to.have.length(7)
    expect(result.recentVolume).to.equal(374)
    expect(result.recentAvg).to.equal(255.1)
    expect(result.baselineMedian).to.equal(251)
    expect(result.rangeMin).to.equal(180)
    expect(result.rangeMax).to.equal(400)
  })

  it('filters a real mod item by rank 3', () => {
    const result = computeItemStatistics(modPayload, 3, 260)

    expect(result.onlineMin).to.equal(260)
    expect(result.chart).to.have.length(7)
    expect(result.recentVolume).to.equal(384)
    expect(result.recentAvg).to.equal(262.9)
    expect(result.baselineMedian).to.equal(262.5)
    expect(result.rangeMin).to.equal(180)
    expect(result.rangeMax).to.equal(425)
  })
})

describe('computeItemStatistics - malformed data', () => {
  it('does not throw when statistics_closed is missing', () => {
    const broken = { statistics_live: { '48hours': [], '90days': [] } } as unknown as StatisticsCollection
    const result = computeItemStatistics(broken, 0, 15)

    expect(result.chart).to.have.length(0)
    expect(result.recentAvg).to.equal(undefined)
    expect(result.recentVolume).to.equal(0)
    expect(result.baselineMedian).to.equal(undefined)
    expect(result.rangeMin).to.equal(undefined)
    expect(result.rangeMax).to.equal(undefined)
    expect(result.onlineMin).to.equal(15)
  })

  it('does not throw when 90days is missing', () => {
    const broken = {
      statistics_closed: { '48hours': [] },
      statistics_live: { '48hours': [], '90days': [] },
    } as unknown as StatisticsCollection
    const result = computeItemStatistics(broken, 0, 15)

    expect(result.chart).to.have.length(0)
    expect(result.onlineMin).to.equal(15)
  })

  it('does not throw when 90days is not an array', () => {
    const broken = {
      statistics_closed: { '48hours': [], '90days': null },
      statistics_live: { '48hours': [], '90days': [] },
    } as unknown as StatisticsCollection
    const result = computeItemStatistics(broken, 0, 15)

    expect(result.chart).to.have.length(0)
    expect(result.onlineMin).to.equal(15)
  })

  it('does not throw when stats is null', () => {
    const result = computeItemStatistics(null as unknown as StatisticsCollection, 0, 15)

    expect(result.chart).to.have.length(0)
    expect(result.onlineMin).to.equal(15)
  })

  it('does not throw when stats is undefined', () => {
    const result = computeItemStatistics(undefined as unknown as StatisticsCollection, 0, 15)

    expect(result.chart).to.have.length(0)
    expect(result.onlineMin).to.equal(15)
  })

  it('defaults onlineMin to 0 when not a finite number', () => {
    const result = computeItemStatistics(makeStats([]), 0, Number.NaN)

    expect(result.onlineMin).to.equal(0)
  })

  it('skips entries with NaN numeric fields from chart and aggregates', () => {
    const entries: ClosedStatisticsEntry[] = [
      makeEntry(1, 20, 20, 10),
      {
        ...makeEntry(2, 25, 25, 10),
        median: Number.NaN,
      },
      {
        ...makeEntry(3, 30, 30, 10),
        wa_price: Number.NaN,
      },
      makeEntry(4, 22, 22, 10),
    ]
    const result = computeItemStatistics(makeStats(entries), 0, 15)

    expect(result.chart).to.have.length(2)
    expect(result.chart[0].median).to.equal(20)
    expect(result.chart[1].median).to.equal(22)
  })

  it('skips entries with undefined numeric fields from range computation', () => {
    const entries: ClosedStatisticsEntry[] = [
      { ...makeEntry(1, 20, 20, 10), min_price: undefined as unknown as number },
      makeEntry(2, 30, 30, 10, { minPrice: 25, maxPrice: 40 }),
    ]
    const result = computeItemStatistics(makeStats(entries), 0, 15)

    expect(result.rangeMin).to.equal(25)
    expect(result.rangeMax).to.equal(40)
  })

  it('handles entries whose only data is zero-volume days', () => {
    const entries = [makeEntry(1, 20, 20, 0)]
    const result = computeItemStatistics(makeStats(entries), 0, 15)

    expect(result.chart).to.have.length(0)
    expect(result.recentVolume).to.equal(0)
    expect(result.recentAvg).to.equal(undefined)
  })
})
