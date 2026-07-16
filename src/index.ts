import type { Context } from 'koishi'
import type { Config as PluginConfig, PluginDependencies } from './types/config'

import { Schema } from 'koishi'
import { setupCommands } from './commands'
import { generateImageOutput } from './components/render'
import { setupHooks } from './hooks'
import { setupSchedules } from './schedules'
import 'reflect-metadata' // Solves 'TypeError: Reflect.getMetadata is not a function' caused by warframe-worldstate-parser

export const name = 'warframe'

export const inject = {
  required: ['cron', 'database', 'puppeteer'],
}

export const Config: Schema<PluginConfig> = Schema.object({
  channelIds: Schema.dict(Schema.string()).default({}).description('用于接收推送的`channelId`列表, 需携带平台前缀, 如:`qq:123456789`'),
  developerMode: Schema.boolean().default(false),
  ocrAPISecret: Schema.object({
    id: Schema.string(),
    key: Schema.string(),
  }).description('OCR API 密钥'),
})

export function apply(ctx: Context): void {
  const deps: PluginDependencies = {
    config: ctx.config as PluginConfig,
    logger: ctx.logger('koishi-plugin-warframe'),
    render: async e => generateImageOutput(ctx.puppeteer, e),
  }

  setupHooks(ctx, deps)
  setupCommands(ctx, deps)
  setupSchedules(ctx, deps)
}
