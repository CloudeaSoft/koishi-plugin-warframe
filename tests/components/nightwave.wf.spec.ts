import type { NightwaveBoard } from '../../src/warframe'
import { expect } from 'chai'
import { NightwaveComponent } from '../../src/components/wf'

function board(overrides: Partial<NightwaveBoard> = {}): NightwaveBoard {
  return {
    title: '午夜电波',
    season: 16,
    phase: 0,
    expiry: Date.now() + 10 * 86_400_000,
    remaining: '10天',
    challenges: [
      {
        name: '交流者',
        description: '标记 5 个 Mod 或资源。',
        kind: 'daily',
        remaining: '1天',
        standing: 1000,
      },
      {
        name: '重型火炮',
        description: '使用曲翼枪械击杀 500 名敌人',
        kind: 'weekly',
        remaining: '5天',
        standing: 4500,
      },
      {
        name: '资源清道夫',
        description: '收集 20 种不同类型的资源。',
        kind: 'elite',
        remaining: '5天',
        standing: 7000,
      },
      {
        name: '任务完成 IX',
        description: '完成 15 项任务',
        kind: 'permanent',
        remaining: '5天',
        standing: 4500,
      },
    ],
    ...overrides,
  }
}

describe('nightwaveComponent tests', () => {
  it('renders a flat list with kind, names, standing, and remaining time on each act', () => {
    const html = String(NightwaveComponent(board()))

    expect(html).to.include('午夜电波')
    expect(html).to.include('第17季 · 剩余10天')
    expect(html).to.not.include('赛季剩余')
    expect(html).to.not.include('阶段')
    expect(html).to.include('不准确')
    expect(html).to.include('数月')
    expect(html).to.not.include('非官方')
    expect(html).to.not.include('border-left')

    expect(html).to.include('每日')
    expect(html).to.include('每周')
    expect(html).to.include('精英')
    expect(html).to.include('精选')

    expect(html).to.include('交流者')
    expect(html).to.include('标记 5 个 Mod 或资源。')
    expect(html).to.include('1000')
    expect(html).to.include('1天')

    expect(html).to.include('重型火炮')
    expect(html).to.include('4500')

    expect(html).to.include('资源清道夫')
    expect(html).to.include('7000')

    expect(html).to.include('任务完成 IX')
    expect(html).to.not.match(/<div[^>]*\/>/)
    expect(html).to.not.match(/<section[\s>]/)
  })

  it('omits unused kind labels when those acts are absent', () => {
    const html = String(NightwaveComponent(board({
      challenges: [
        {
          name: '交流者',
          description: '标记 5 个 Mod 或资源。',
          kind: 'daily',
          remaining: '1天',
          standing: 1000,
        },
        {
          name: '重型火炮',
          description: '使用曲翼枪械击杀 500 名敌人',
          kind: 'weekly',
          remaining: '5天',
          standing: 4500,
        },
      ],
    })))

    expect(html).to.include('每日')
    expect(html).to.include('每周')
    expect(html).to.not.include('精英')
    expect(html).to.not.include('精选')
    expect(html).to.not.match(/<div[^>]*\/>/)
  })
})
