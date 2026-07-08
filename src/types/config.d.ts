import type { Element, Logger } from 'koishi'

export interface OcrAPISecret {
  id: string
  key: string
}

export interface Config {
  developerMode: boolean
  ocrAPISecret: OcrAPISecret
}

export interface PluginDependencies {
  config: Config
  logger: Logger
  render: (element: Element) => Promise<string>
}
