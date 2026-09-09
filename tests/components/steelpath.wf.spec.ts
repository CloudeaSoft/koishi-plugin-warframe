import type { SteelPathBoard, SteelPathOfferingInfo } from '../../src/warframe'
import { expect } from 'chai'
import { SteelPathComponent } from '../../src/components/wf'

function offering(
  name: string,
  cost: number,
): SteelPathOfferingInfo {
  return { name, cost }
}

function board(overrides: Partial<SteelPathBoard> = {}): SteelPathBoard {
  return {
    title: 'Teshin · 钢铁精华商店',
    costLabel: '钢铁精华',
    remaining: '1天0秒',
    expiry: Date.now() + 86_400_000,
    current: offering('Umbra Forma 蓝图', 150),
    upcoming: [
      offering('50,000 赤毒', 55),
      offering('组合枪裂罅 Mod', 75),
    ],
    ...overrides,
  }
}

describe('steelPathComponent tests', () => {
  it('renders title, current offering, cost, remaining time, and upcoming', () => {
    const html = String(SteelPathComponent(board()))

    expect(html).to.include('Teshin · 钢铁精华商店')
    expect(html).to.include('本周')
    expect(html).to.include('Umbra Forma 蓝图')
    expect(html).to.include('150')
    expect(html).to.include('钢铁精华')
    expect(html).to.include('剩余')
    expect(html).to.include('1天0秒')
    expect(html).to.include('即将轮换')
    expect(html).to.include('下周')
    expect(html).to.include('50,000 赤毒')
    expect(html).to.include('组合枪裂罅 Mod')
    expect(html).to.not.match(/<div[^>]*\/>/)
  })

  it('omits the upcoming section when the rotation has no later items', () => {
    const html = String(SteelPathComponent(board({ upcoming: [] })))

    expect(html).to.include('Umbra Forma 蓝图')
    expect(html).to.not.include('即将轮换')
    expect(html).to.not.include('下周')
    expect(html).to.not.match(/<div[^>]*\/>/)
  })
})
