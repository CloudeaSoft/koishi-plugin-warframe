import type { CalendarBoard, CalendarDayInfo, CalendarEventInfo } from '../../src/warframe'
import { expect } from 'chai'
import { CalendarComponent } from '../../src/components/wf'

function event(overrides: Partial<CalendarEventInfo> = {}): CalendarEventInfo {
  return {
    kind: 'challenge',
    kindLabel: '待办事项',
    name: '净化感染',
    description: '击杀 250 名科腐者',
    ...overrides,
  }
}

function day(overrides: Partial<CalendarDayInfo> = {}): CalendarDayInfo {
  return {
    day: 96,
    dateLabel: '1999年4月6日',
    events: [event()],
    ...overrides,
  }
}

function board(overrides: Partial<CalendarBoard> = {}): CalendarBoard {
  return {
    title: '1999 春季',
    season: '春季',
    remaining: '6天23小时',
    expiry: Date.now() + 6 * 86_400_000,
    days: [
      day(),
      day({
        day: 97,
        dateLabel: '1999年4月7日',
        events: [
          event({
            kind: 'upgrade',
            kindLabel: '覆写',
            name: '硬质化',
            description: '过载护盾上限增加 50%。击杀时恢复 50 点护盾。',
          }),
        ],
      }),
    ],
    ...overrides,
  }
}

describe('calendarComponent tests', () => {
  it('renders season title, remaining time, dates, and event names', () => {
    const html = String(CalendarComponent(board()))

    expect(html).to.include('1999 春季')
    expect(html).to.include('剩余')
    expect(html).to.include('6天23小时')
    expect(html).to.include('1999年4月6日')
    expect(html).to.include('待办事项')
    expect(html).to.include('净化感染')
    expect(html).to.include('击杀 250 名科腐者')
    expect(html).to.include('覆写')
    expect(html).to.include('硬质化')
    expect(html).to.not.match(/<div[^>]*\/>/)
  })

  it('omits empty descriptions without leaving empty tags', () => {
    const html = String(CalendarComponent(board({
      days: [day({
        events: [event({
          kind: 'reward',
          kindLabel: '大奖！',
          name: '赋能助力',
          description: undefined,
        })],
      })],
    })))

    expect(html).to.include('大奖！')
    expect(html).to.include('赋能助力')
    expect(html).to.not.include('击杀 250 名科腐者')
    expect(html).to.not.match(/<div[^>]*\/>/)
  })
})
