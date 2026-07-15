import type { Context, Element } from 'koishi'

import type { PluginDependencies } from '../types/config'
import {} from 'koishi-plugin-cron'

export function setupSchedules(ctx: Context, deps: PluginDependencies): void {
  testCorn(ctx, deps)
}

async function broadcast(ctx: Context, deps: PluginDependencies, message: Element | string): Promise<void> {
  try {
    await ctx.broadcast(Object.values(deps.config.channelIds), message)
  }
  catch {
  }
}

export function testCorn(ctx: Context, deps: PluginDependencies): void {
  ctx.cron('*/10 * * * * *', () => {
    broadcast(ctx, deps, 'Hello, my world!').catch(() => {})
  })
}
