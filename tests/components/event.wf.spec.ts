import type { EventBoard, EventInfo, EventInterimStep } from '../../src/warframe'
import { expect } from 'chai'
import { EventComponent } from '../../src/components/wf'

function event(overrides: Partial<EventInfo> = {}): EventInfo {
  return {
    id: 'heat',
    name: '热美亚裂缝',
    description: '封印奥布山谷的裂缝',
    scoreLabel: '已封闭的热美亚裂缝',
    node: {
      name: '奥布山谷',
      system: '金星',
      type: '自由漫游',
      faction: 'Corpus',
      minLevel: 0,
      maxLevel: 0,
    },
    remaining: '1小时0秒',
    expiry: Date.now() + 3_600_000,
    currentScore: 14,
    maximumScore: 100,
    progress: 0.14,
    rewards: [{ name: '奥堤克光子枪·破坏者', count: 1 }],
    interimSteps: [{
      goal: 5,
      rewards: [{ name: '雪藏的恩怨徽章', count: 1 }],
    }],
    ...overrides,
  }
}

function board(overrides: Partial<EventBoard> = {}): EventBoard {
  return {
    title: '活动',
    events: [event()],
    ...overrides,
  }
}

describe('eventComponent tests', () => {
  it('renders title, name, location, progress, rewards, and remaining time', () => {
    const html = String(EventComponent(board()))

    expect(html).to.include('活动')
    expect(html).to.include('热美亚裂缝')
    expect(html).to.include('封印奥布山谷的裂缝')
    expect(html).to.include('金星 · 奥布山谷')
    expect(html).to.include('已封闭的热美亚裂缝')
    expect(html).to.include('14/100')
    expect(html).to.include('14%')
    expect(html).to.include('奥堤克光子枪·破坏者')
    expect(html).to.include('5 · 雪藏的恩怨徽章')
    expect(html).to.include('剩余')
    expect(html).to.include('1小时0秒')
    expect(html).to.not.include('自由漫游')
    expect(html).to.not.match(/<div[^>]*\/>/)
  })

  it('omits empty descriptions and progress without leaving empty tags', () => {
    const html = String(EventComponent(board({
      events: [event({
        description: undefined,
        scoreLabel: undefined,
        progress: undefined,
        rewards: [],
        interimSteps: [] as EventInterimStep[],
        remaining: undefined,
        expiry: 0,
      })],
    })))

    expect(html).to.include('热美亚裂缝')
    expect(html).to.not.include('封印奥布山谷的裂缝')
    expect(html).to.not.include('14/100')
    expect(html).to.not.include('剩余')
    expect(html).to.not.match(/<div[^>]*\/>/)
  })

  it('renders a health-only percent without a 0/0 score', () => {
    const html = String(EventComponent(board({
      events: [event({
        scoreLabel: undefined,
        currentScore: 0,
        maximumScore: 0,
        progress: 0.42,
        rewards: [],
        interimSteps: [],
      })],
    })))

    expect(html).to.include('42%')
    expect(html).to.not.include('0/0')
    expect(html).to.not.match(/<div[^>]*\/>/)
  })
})
