import type { Context } from 'koishi'

import type { PluginDependencies } from '../../src/types/config'

import { expect } from 'chai'

import { setupSchedules } from '../../src/schedules'
import { setupPrimedModHistorySchedule } from '../../src/schedules/pmod-history'

function createDeps(warn = vi.fn()): PluginDependencies {
  return {
    config: {
      channelIds: {},
      developerMode: false,
      ocrAPISecret: { id: '', key: '' },
    },
    logger: {
      info: vi.fn(),
      warn,
    },
    render: vi.fn(async () => ''),
  } as unknown as PluginDependencies
}

async function flushScheduledRun(): Promise<void> {
  await new Promise(resolve => setImmediate(resolve))
}

describe('pmod-history schedule', () => {
  it('registers the four daily refresh times and updates the cache', async () => {
    let expression = ''
    let callback!: () => void
    const ctx = {
      cron: (value: string, handler: () => void) => {
        expression = value
        callback = handler
      },
    } as unknown as Context
    const refresh = vi.fn(async () => undefined)

    setupPrimedModHistorySchedule(ctx, createDeps(), refresh)

    expect(expression).to.equal('0 0 0,6,12,18 * * *')
    callback()
    await flushScheduledRun()
    expect(refresh.mock.calls).to.have.length(1)
  })

  it('logs refresh failures without rejecting the cron callback', async () => {
    let callback!: () => void
    const ctx = {
      cron: (_value: string, handler: () => void) => {
        callback = handler
      },
    } as unknown as Context
    const warn = vi.fn()
    const deps = createDeps(warn)

    setupPrimedModHistorySchedule(ctx, deps, async () => {
      throw new Error('refresh failed')
    })

    callback()
    await flushScheduledRun()
    expect(warn.mock.calls).to.have.length(1)
  })

  it('is registered by the schedules entry point', () => {
    const expressions: string[] = []
    const ctx = {
      cron: (value: string, _handler: () => void) => {
        expressions.push(value)
      },
    } as unknown as Context

    setupSchedules(ctx, createDeps())

    expect(expressions).to.include('0 0 0,6,12,18 * * *')
  })
})
