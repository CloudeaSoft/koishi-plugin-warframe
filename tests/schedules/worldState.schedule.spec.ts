import type { Context } from 'koishi'

import type { PluginDependencies } from '../../src/types/config'
import type { WorldStateNotification } from '../../src/warframe'

import { expect } from 'chai'

import {
  formatWorldStateNotifications,
  setupWorldStateSchedule,
} from '../../src/schedules/world-state'

function createHarness(
  refresh: () => Promise<WorldStateNotification[]>,
  channelIds: Record<string, string> = { qq: 'qq:123' },
) {
  let expression = ''
  let callback!: () => void
  const broadcasts: Array<{ channels: string[], message: string }> = []
  const warn = vi.fn()
  const ctx = {
    cron: (value: string, handler: () => void) => {
      expression = value
      callback = handler
    },
    broadcast: async (channels: string[], message: string) => {
      broadcasts.push({ channels, message })
    },
  } as unknown as Context
  const deps = {
    config: {
      channelIds,
      developerMode: false,
      ocrAPISecret: { id: '', key: '' },
    },
    logger: { warn },
    render: async () => '',
  } as unknown as PluginDependencies

  setupWorldStateSchedule(ctx, deps, refresh)

  return {
    get expression() {
      return expression
    },
    get callback() {
      return callback
    },
    broadcasts,
    warn,
  }
}

async function flushScheduledRun(): Promise<void> {
  await new Promise(resolve => setImmediate(resolve))
}

describe('world-state schedule', () => {
  it('registers a five-minute cron and broadcasts grouped messages', async () => {
    const refresh = vi.fn(async (): Promise<WorldStateNotification[]> => [
      {
        type: 'fissure',
        id: 'f1',
        tier: 'Lith',
        node: 'E Prime',
        missionType: 'Exterminate',
        category: 'normal',
        expiry: 0,
      },
      {
        type: 'fissure',
        id: 'f2',
        tier: 'Axi',
        node: 'Hydron',
        missionType: 'Defense',
        category: 'steel-path',
        expiry: 0,
      },
    ])
    const harness = createHarness(refresh)

    expect(harness.expression).to.equal('0 */5 * * * *')
    harness.callback()
    await flushScheduledRun()
    expect(harness.broadcasts).to.deep.equal([{
      channels: ['qq:123'],
      message: '【新虚空裂隙】\nLith - E Prime（Exterminate）\nAxi - Hydron（Defense） [钢铁之路]',
    }])
  })

  it('formats one message per populated category', () => {
    const expiry = new Date('2026-07-16T00:00:00Z').getTime()
    const messages = formatWorldStateNotifications([
      {
        type: 'fissure',
        id: 'f1',
        tier: 'Axi',
        node: 'Hydron',
        missionType: 'Defense',
        category: 'railjack',
        expiry,
      },
      {
        type: 'void-trader',
        id: 'v1',
        character: 'Baro Ki\'Teer',
        location: 'Mercury Relay',
        expiry,
      },
      {
        type: 'daily-deal',
        id: 'd1',
        item: 'Braton',
        originalPrice: 225,
        salePrice: 157,
        discount: 30,
        expiry,
      },
      {
        type: 'alert',
        id: 'a1',
        description: 'Lotus Gift',
        node: 'Earth',
        missionType: 'Defense',
        reward: 'Forma',
        expiry,
      },
    ])

    expect(messages).to.have.length(4)
    expect(messages[0]).to.include('新虚空裂隙')
    expect(messages[0]).to.include('九重天')
    expect(messages[1]).to.include('虚空商人到达')
    expect(messages[1]).to.include('截止')
    expect(messages[2]).to.include('新每日特惠')
    expect(messages[3]).to.include('新警报')
    expect(messages[3]).to.include('奖励：Forma')
  })

  it('logs refresh failures and emits no broadcasts', async () => {
    const harness = createHarness(async () => {
      throw new Error('fetch failed')
    })

    harness.callback()
    await flushScheduledRun()
    expect(harness.warn.mock.calls).to.have.length(1)
    expect(harness.broadcasts).to.deep.equal([])
  })

  it('skips an overlapping run', async () => {
    let release!: () => void
    const refresh = vi.fn(() => new Promise<WorldStateNotification[]>((resolve) => {
      release = () => resolve([])
    }))
    const harness = createHarness(refresh)

    harness.callback()
    harness.callback()
    expect(refresh.mock.calls).to.have.length(1)
    release()
    await flushScheduledRun()
  })

  it('refreshes without broadcasting when no channels are configured', async () => {
    const refresh = vi.fn(async (): Promise<WorldStateNotification[]> => [{
      type: 'daily-deal',
      id: 'd1',
      item: 'Braton',
      originalPrice: 225,
      salePrice: 157,
      discount: 30,
      expiry: 0,
    }])
    const harness = createHarness(refresh, {})

    harness.callback()
    await flushScheduledRun()
    expect(refresh.mock.calls).to.have.length(1)
    expect(harness.broadcasts).to.deep.equal([])
  })
})
