import type { Element, Logger } from 'koishi'
import type { OcrAPISecret } from '../warframe'

export type { OcrAPISecret } from '../warframe'

export interface Config {
  channelIds: Record<string, string>
  ocrAPISecret: OcrAPISecret
  developerMode: boolean
}

export interface PluginDependencies {
  config: Config
  logger: Logger
  render: (element: Element) => Promise<string>
}
