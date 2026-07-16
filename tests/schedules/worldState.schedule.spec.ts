import type { Context, Element } from 'koishi'

import type { PluginDependencies } from '../../src/types/config'
import type { WorldStateNotification } from '../../src/warframe'

import { expect } from 'chai'

import { setupWorldStateSchedule } from '../../src/schedules/world-state'

function createHarness(
  refresh: () => Promise<WorldStateNotification[]>,
  channelIds: Record<string, string> = { qq: 'qq:123' },
) {
  let expression = ''
  let callback!: () => void
  const broadcasts: Array<{ channels: string[], message: Element | string }> = []
  const warn = vi.fn()
  const info = vi.fn()
  const render = vi.fn(async () => '<img src="data:image/png;base64,world-state"/>')
  const ctx = {
    cron: (value: string, handler: () => void) => {
      expression = value
      callback = handler
    },
    broadcast: async (channels: string[], message: Element | string) => {
      broadcasts.push({ channels, message })
    },
  } as unknown as Context
  const deps = {
    config: {
      channelIds,
      developerMode: false,
      ocrAPISecret: { id: '', key: '' },
    },
    logger: { info, warn },
    render,
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
    info,
    render,
    warn,
  }
}

async function flushScheduledRun(): Promise<void> {
  await new Promise(resolve => setImmediate(resolve))
}

describe('world-state schedule', () => {
  it('registers a five-minute cron and broadcasts grouped text messages', async () => {
    const refresh = vi.fn(async (): Promise<WorldStateNotification[]> => [
      {
        type: 'fissure',
        id: 'f1',
        tier: '古纪',
        tierNum: 1,
        node: {
          name: 'E Prime',
          system: '地球',
          type: '歼灭',
          faction: 'Grineer',
          minLevel: 1,
          maxLevel: 3,
        },
        hard: false,
        category: 'normal',
        expiry: 0,
      },
      {
        type: 'fissure',
        id: 'f2',
        tier: '后纪',
        tierNum: 4,
        node: {
          name: 'Hydron',
          system: '赛德娜',
          type: '防御',
          faction: 'Grineer',
          minLevel: 30,
          maxLevel: 40,
        },
        hard: true,
        category: 'steel-path',
        expiry: 0,
      },
    ])
    const harness = createHarness(refresh)

    expect(harness.expression).to.equal('0 */5 * * * *')
    harness.callback()
    await flushScheduledRun()
    expect(harness.render.mock.calls).to.have.length(0)
    expect(harness.broadcasts.map(({ channels, message }) => ({
      channels,
      message: message.toString(),
    }))).to.deep.equal([{
      channels: ['qq:123'],
      message: '<message><div>新的虚空裂隙已出现:\n</div><div>[普通]古纪 - 地球 (歼灭) Grineer E Prime | \n[钢铁]后纪 - 赛德娜 (防御) Grineer Hydron | </div></message>',
    }])
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
