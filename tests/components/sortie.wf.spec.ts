import type { Sortie } from '../../src/warframe'
import { expect } from 'chai'
import { SortieComponent } from '../../src/components/wf'

function mission(
  type: string,
  modifier: string,
  minLevel: number,
  maxLevel: number,
): Sortie['missions'][number] {
  return {
    type,
    modifier,
    node: {
      name: 'Metis',
      system: '木星',
      type: '救援',
      faction: 'Corpus',
      minLevel,
      maxLevel,
    },
  }
}

describe('sortieComponent tests', () => {
  it('renders title, boss, faction, remaining time, and mission cards', () => {
    const data: Sortie = {
      modeName: '突击',
      boss: 'Alad V',
      faction: 'Corpus',
      expiry: Date.now() + 3_600_000,
      remaining: '1小时0秒',
      missions: [
        mission('破坏', '辐射灾害', 50, 60),
        mission('移动防御', '卓越者大本营', 65, 80),
        mission('救援', '突击步枪 限定', 80, 100),
      ],
    }

    const html = String(SortieComponent(data))

    expect(html).to.include('突击: Alad V (Corpus)')
    expect(html).to.include('剩余')
    expect(html).to.include('1小时0秒')
    expect(html).to.include('破坏')
    expect(html).to.include('移动防御')
    expect(html).to.include('救援')
    expect(html).to.include('width:320px')
    expect(html).to.include('木星 · Metis · Lv.50-60')
    expect(html).to.include('Lv.65-80')
    expect(html).to.include('Lv.80-100')
    expect(html).to.include('辐射灾害')
    expect(html).to.include('卓越者大本营')
    expect(html).to.include('突击步枪 限定')
    expect(html).to.include('条件')
    expect(html).to.not.match(/<div[^>]*\/>/)
    expect(html).to.not.include('戰甲的能量上限降低為四分之一')
    expect(html).to.not.include('救援 ·')
    expect(html).to.not.include('木星 · Metis · Corpus')
  })
})
