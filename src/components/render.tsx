import type { Element } from 'koishi'
import type Puppeteer from 'koishi-plugin-puppeteer'
import { loadAssetText } from '../utils/assets'

const style = loadAssetText('render.css')
const svg = loadAssetText('render-icons.svg')
const template = loadAssetText('render.html')

function htmlString(htmlString: string, title: string = 'title'): string {
  return template
    .replace('{{htmlString}}', htmlString)
    .replace('{{title}}', title)
    .replace('{{style}}', style)
    .replace('{{svg}}', svg)
}

export async function generateImageOutput(
  puppe: Puppeteer,
  element: Element,
): Promise<string> {
  if (!puppe) {
    return '本功能需要启用 koishi-plugin-puppeteer 插件'
  }

  return puppe.render(
    htmlString(element.toString()),
    async (page, next) => {
      const handle = await page.$('#root>*')
      return next(handle ?? undefined)
    },
  )
}
