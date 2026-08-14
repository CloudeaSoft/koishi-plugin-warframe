import type { ItemShort, ItemStatisticsSummary, OrderWithUser } from '../../src/warframe'
import { expect } from 'chai'
import { h } from 'koishi'
import { wmMessage } from '../../src/messages/wfm'

const img = h('img', { src: 'data:image/png;base64,test' })

function item(overrides: {
  slug?: string
  maxRank?: number
  en?: string
} = {}): ItemShort {
  return {
    slug: overrides.slug ?? 'primed_continuity',
    maxRank: overrides.maxRank,
    i18n: {
      en: { name: overrides.en ?? 'Primed Continuity' },
    },
  } as unknown as ItemShort
}

function order(ingameName: string, platinum: number, rank = 0): OrderWithUser {
  return {
    user: { ingameName },
    platinum,
    rank,
  } as unknown as OrderWithUser
}

const statistics: ItemStatisticsSummary = {
  chart: [],
  recentAvg: 100,
  recentVolume: 12,
  baselineMedian: 95,
  trend: 'up',
  onlineMin: 90,
}

describe('wm messages', () => {
  it('includes copyable whispers and rank for wmi output', () => {
    const output = wmMessage(
      img,
      item({ maxRank: 10 }),
      [order('SellerOne', 50, 8), order('SellerTwo', 55, 10)],
      statistics,
      true,
    ).toString()

    expect(output).to.include('/w SellerOne Hi! I want to buy: "Primed Continuity (rank 8)" for 50 platinum. (warframe.market)')
    expect(output).to.include('/w SellerTwo Hi! I want to buy: "Primed Continuity (rank 10)" for 55 platinum. (warframe.market)')
    expect(output).to.include('近3天均价 100p')
  })

  it('omits rank from whispers when the item has no max rank', () => {
    const output = wmMessage(
      img,
      item(),
      [order('SellerOne', 50)],
      statistics,
      true,
    ).toString()

    expect(output).to.include('/w SellerOne Hi! I want to buy: "Primed Continuity" for 50 platinum. (warframe.market)')
    expect(output).to.not.include('(rank')
  })

  it('omits copyable whispers from wm output but keeps statistics', () => {
    const output = wmMessage(
      img,
      item(),
      [order('SellerOne', 50), order('SellerTwo', 55)],
      statistics,
      false,
    ).toString()

    expect(output).to.not.include('/w')
    expect(output).to.include('近3天均价 100p')
    expect(output).to.include('↑7天95p')
    expect(output).to.include('成交12笔')
  })

  it('does not leave a trailing blank line on wm output', () => {
    const output = wmMessage(
      img,
      item(),
      [order('SellerOne', 50), order('SellerTwo', 55)],
      statistics,
      false,
    ).toString()

    expect(output).to.equal(
      '<message><img src="data:image/png;base64,test"/><div>\n近3天均价 100p | ↑7天95p | 成交12笔</div></message>',
    )
  })

  it('returns the image unchanged when there is no statistics text and no whispers', () => {
    expect(wmMessage(img, item(), [order('SellerOne', 50)], undefined, false)).to.equal(img)
  })
})
