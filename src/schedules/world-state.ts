import type { Context } from 'koishi'

import type { PluginDependencies } from '../types/config'
import type { WorldStateNotification } from '../warframe'

import {} from 'koishi-plugin-cron'
import { createWorldStateMessages } from '../messages/world-state'
import { refreshWorldState } from '../warframe'

type Refresh = () => Promise<WorldStateNotification[]>

export function setupWorldStateSchedule(
  ctx: Context,
  deps: PluginDependencies,
  refresh: Refresh = refreshWorldState,
): void {
  let running = false

  const run = async (): Promise<void> => {
    if (running) {
      return
    }
    running = true

    try {
      const messages = await createWorldStateMessages(await refresh(), deps.render)
      const channels = Object.values(deps.config.channelIds)

      if (!channels.length) {
        return
      }
      for (const message of messages) {
        await ctx.broadcast(channels, message)
      }
    }
    catch (error) {
      deps.logger.warn(error, '刷新 Warframe 世界状态失败')
    }
    finally {
      running = false
    }
  }

  ctx.cron('0 */5 * * * *', () => {
    void run()
  })
}
