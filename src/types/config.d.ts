import type { Element, Logger } from "koishi";

import type Puppeteer from "koishi-plugin-puppeteer";

export interface OcrAPISecret {
  id: string;
  key: string;
}

export interface Config {
  developerMode: boolean;
  ocrAPISecret: OcrAPISecret;
}

export interface PluginDependencies {
  config: Config;
  logger: Logger;
  puppeteer: Puppeteer;
  render: (element: Element) => Promise<string>;
}

declare global {
  interface OcrAPISecret {
    id: string;
    key: string;
  }
}
