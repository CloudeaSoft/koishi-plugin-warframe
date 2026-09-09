import type { SteelEssenceBoard, SteelEssenceOfferingInfo } from '../../src/warframe'
import { expect } from 'chai'
import { SteelEssenceComponent } from '../../src/components/wf'

function offering(
  name: string,
  cost: number,
): SteelEssenceOfferingInfo {
  return { name, cost }
}

function board(overrides: Partial<SteelEssenceBoard> = {}): SteelEssenceBoard {
  return {
    title: 'Teshin · 钢铁精华商店',
    costLabel: '钢铁精华',
    remaining: '1天0秒',
    expiry: Date.now() + 86_400_000,
    current: offering('Umbra Forma 蓝图', 150),
    upcoming: [
      offering('50,000 赤毒', 55),
      offering('狙击枪裂罅 Mod', 75),
    ],
    ...overrides,
  }
}

describe('steelEssenceComponent tests', () => {
  it('renders title, current offering, cost, remaining time, and upcoming', () => {
    const html = String(SteelEssenceComponent(board()))

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
    expect(html).to.include('狙击枪裂罅 Mod')
    expect(html).to.not.match(/<div[^>]*\/>/)
  })

  it('omits the upcoming section when the rotation has no later items', () => {
    const html = String(SteelEssenceComponent(board({ upcoming: [] })))

    expect(html).to.include('Umbra Forma 蓝图')
    expect(html).to.not.include('即将轮换')
    expect(html).to.not.include('下周')
    expect(html).to.not.match(/<div[^>]*\/>/)
  })
})
