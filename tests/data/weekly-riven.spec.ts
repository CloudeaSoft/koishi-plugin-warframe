import type { WeeklyRiven } from 'warframe-weekly-rivens'
import { expect } from 'chai'
import { filterWeeklyRivens } from '../../src/warframe/services'
import { weekRiven } from '../assets/weeklyRivensPC'

describe('weekly Riven Data Tests', () => {
  const allItems: WeeklyRiven[] = weekRiven

  it('should load weekly riven data correctly', () => {
    expect(allItems).to.be.an('array')
    expect(allItems.length).to.be.greaterThan(0)
  })

  it('each item should have required fields', () => {
    for (const item of allItems) {
      expect(item.itemType).to.be.a('string')
      expect(item.rerolled).to.be.a('boolean')
      expect(item.avg).to.be.a('number')
      expect(item.stddev).to.be.a('number')
      expect(item.min).to.be.a('number')
      expect(item.max).to.be.a('number')
      expect(item.pop).to.be.a('number')
      expect(item.median).to.be.a('number')
    }
  })

  it('should filter rerolled=false items correctly', () => {
    const unrolled = allItems.filter(item => !item.rerolled)
    const rolled = allItems.filter(item => item.rerolled)

    expect(unrolled.length).to.be.greaterThan(0)
    expect(rolled.length).to.be.greaterThan(0)
    expect(unrolled.length + rolled.length).to.equal(allItems.length)
  })

  it('should filter by minimum median reference price correctly (rerolled=false)', () => {
    const minPrice = 500
    const filtered = filterWeeklyRivens(allItems, minPrice, 0)

    for (const item of filtered) {
      expect(item.median).to.be.at.least(minPrice)
      expect(item.rerolled).to.equal(false)
    }

    for (let i = 1; i < filtered.length; i++) {
      expect(filtered[i - 1].median).to.be.at.least(filtered[i].median!)
    }
  })

  it('should find high-value unrolled rivens by median reference price', () => {
    const highValue = filterWeeklyRivens(allItems, 1000, 1)

    expect(highValue.length).to.be.greaterThan(0)

    const dualSkana = highValue.find(
      item => item.compatibility === 'Dual Skana',
    )
    expect(dualSkana).to.not.equal(undefined)
    if (dualSkana) {
      expect(dualSkana.median).to.equal(4300)
    }
  })

  it('items with compatibility should have valid string values', () => {
    const withCompatibility = allItems.filter(item => item.compatibility)
    expect(withCompatibility.length).to.be.greaterThan(0)

    for (const item of withCompatibility) {
      expect(item.compatibility).to.be.a('string')
      expect(item.compatibility!.length).to.be.greaterThan(0)
    }
  })

  it('should have some non-null compatibility items that are rerolled=false', () => {
    const specific = allItems.filter(
      item => !item.rerolled && item.compatibility !== null,
    )
    expect(specific.length).to.be.greaterThan(0)

    const ax52 = specific.find(
      item => item.compatibility === 'AX-52' && item.rerolled === false,
    )
    expect(ax52).to.not.equal(undefined)
  })

  it('should correctly filter by minimum reference price and return results', () => {
    const minPrice = 100
    const result = filterWeeklyRivens(allItems, minPrice, 0)

    expect(result.length).to.be.greaterThan(0)

    for (const item of result) {
      expect(item.median).to.be.at.least(minPrice)
    }
  })

  it('should return top N items correctly', () => {
    const minPrice = 200
    const topN = 5
    const totalFiltered = filterWeeklyRivens(allItems, minPrice, 0).length
    const filtered = filterWeeklyRivens(allItems, minPrice, 0).slice(0, topN)

    expect(filtered.length).to.be.at.most(topN)

    if (totalFiltered >= topN) {
      expect(filtered.length).to.equal(topN)
    }
    else {
      expect(filtered.length).to.equal(totalFiltered)
    }
  })

  it('should handle empty results when threshold is too high', () => {
    const result = filterWeeklyRivens(allItems, 999999, 0)

    expect(result.length).to.equal(0)
  })

  it('should not rank low-median avg outliers as high-value references', () => {
    const result = filterWeeklyRivens(allItems, 500, 0)

    expect(result.length).to.be.at.least(2)
    expect(result.some(item => item.compatibility === 'Akbolto')).to.equal(
      false,
    )
    expect(result[0].compatibility).to.equal('Dual Skana')
    expect(result[0].median).to.equal(4300)
  })

  it('should include high-median rows even with wide price spread (pop>=0)', () => {
    const noisyOutlier: WeeklyRiven = {
      itemType: 'Melee Riven Mod',
      compatibility: 'Twin Basolk',
      rerolled: false,
      avg: 15020,
      stddev: 14980,
      min: 40,
      max: 30000,
      pop: 1,
      median: 15020,
    }

    const result = filterWeeklyRivens([...allItems, noisyOutlier], 500, 0)

    expect(
      result.some(item => item.compatibility === 'Twin Basolk'),
    ).to.equal(true)
  })
})
