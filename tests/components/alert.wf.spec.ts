import type { AlertBoard, AlertInfo } from '../../src/warframe'
import { expect } from 'chai'
import { AlertComponent } from '../../src/components/wf'

function alert(overrides: Partial<AlertInfo> = {}): AlertInfo {
  return {
    type: '拦截',
    node: {
      name: '乌戈塔',
      system: '虚空',
      type: '捕获',
      faction: '奥罗金',
      minLevel: 65,
      maxLevel: 70,
    },
    rewards: [
      { name: '电磁力场装置', count: 1 },
      { name: '12200 现金', count: 1 },
    ],
    remaining: '1小时0秒',
    expiry: Date.now() + 3_600_000,
    ...overrides,
  }
}

function board(overrides: Partial<AlertBoard> = {}): AlertBoard {
  return {
    title: '警报',
    alerts: [alert()],
    ...overrides,
  }
}

describe('alertComponent tests', () => {
  it('renders type, location, level, rewards, and remaining time', () => {
    const html = String(AlertComponent(board()))

    expect(html).to.include('警报')
    expect(html).to.include('拦截')
    expect(html).to.include('虚空 · 乌戈塔 · 奥罗金')
    expect(html).to.include('Lv.65-70')
    expect(html).to.include('电磁力场装置')
    expect(html).to.include('12200 现金')
    expect(html).to.include('剩余')
    expect(html).to.include('1小时0秒')
    expect(html).to.not.include('捕获')
    expect(html).to.not.match(/<div[^>]*\/>/)
  })

  it('shows the mapped nightmare word and stacked counts without empty tags', () => {
    const html = String(AlertComponent(board({
      alerts: [alert({
        nightmare: '噩梦',
        rewards: [{ name: '电磁力场装置', count: 3 }],
      })],
    })))

    expect(html).to.include('噩梦')
    expect(html).to.include('3×电磁力场装置')
    expect(html).to.not.match(/<div[^>]*\/>/)
  })
})
