import type { Element, Logger } from 'koishi'
import type { OcrAPISecret } from './ocr'

export type { OcrAPISecret } from './ocr'

export interface Config {
  developerMode: boolean
  ocrAPISecret: OcrAPISecret
}

export interface PluginDependencies {
  config: Config
  logger: Logger
  render: (element: Element) => Promise<string>
}
