import type { Context } from 'koishi'

import type { PluginDependencies } from '../types/config'

import {} from 'koishi-plugin-cron'
import { primedModHistory } from '../warframe'

type Refresh = () => Promise<unknown>

export function setupPrimedModHistorySchedule(
  ctx: Context,
  deps: PluginDependencies,
  refresh: Refresh = async () => primedModHistory.update(),
): void {
  const run = async (): Promise<void> => {
    try {
      await refresh()
    }
    catch (error) {
      deps.logger.warn(error, '刷新 Primed MOD 历史缓存失败')
    }
  }

  ctx.cron('0 0 0,6,12,18 * * *', () => {
    void run()
  })
}
