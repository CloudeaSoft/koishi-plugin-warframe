import type { Context } from 'koishi'

import type { PluginDependencies } from '../types/config'

export function setupHooks(ctx: Context, deps: PluginDependencies): void {
  const { config, logger } = deps
  ctx.on('message', (session) => {
    if (config.developerMode) {
      logger.info(
        `Koishi recieved message: ${session.content}
        Platform: ${session.platform}
        User: ${session.author.name}`,
      )
    }
  })
  ctx.on('command/before-execute', (action) => {
    if (config.developerMode) {
      logger.info(
        `WFM Plugin received command ${action.command?.name}
        arguments: ${JSON.stringify(action.args)}`,
      )
    }
  })
}
