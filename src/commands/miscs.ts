import type { PluginDependencies } from '../types/config'
import { HotRivenComponent } from '../components/miscs'
import { globalHotRivenWeapons } from '../data/miscs/lab'

export function createMiscsCommands(deps: PluginDependencies) {
  const { logger, render } = deps

  return {
    hotRivenCommand: async () => {
      try {
        const result = await globalHotRivenWeapons.get()
        if (!result || result.length === 0) {
          return '暂无热门紫卡数据'
        }

        return await render(
          HotRivenComponent(result),
        )
      }
      catch (ex) {
        logger.error(ex)
        return '获取热门紫卡数据失败'
      }
    },
  }
}
