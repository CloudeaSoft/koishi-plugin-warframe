import type { Element } from 'koishi'
import type Puppeteer from 'koishi-plugin-puppeteer'
import { h } from 'koishi'
import { loadAssetText } from '../utils/assets'

const style = loadAssetText('render.css')
const svg = loadAssetText('render-icons.svg')
const template = loadAssetText('render.html')

const slots = {
  body: '<!-- __WARFRAME_RENDER_SLOT_BODY__ -->',
  title: '__WARFRAME_RENDER_SLOT_TITLE__',
  style: '/* __WARFRAME_RENDER_SLOT_STYLE__ */',
  svg: '<!-- __WARFRAME_RENDER_SLOT_SVG__ -->',
} as const

/**
 * Full HTML document for a rendered component body. Shared by the Puppeteer
 * outputs below and by `scripts/preview.mjs`, which screenshots components
 * outside Koishi for pull-request evidence.
 */
export function renderHtml(body: string, title: string = 'title'): string {
  return template
    .replace(slots.body, () => body)
    .replace(slots.title, () => title)
    .replace(slots.style, () => style)
    .replace(slots.svg, () => svg)
}

export async function generateImageOutput(
  puppe: Puppeteer,
  element: Element,
): Promise<string> {
  if (!puppe) {
    return '本功能需要启用 koishi-plugin-puppeteer 插件'
  }

  return puppe.render(
    renderHtml(element.toString()),
    async (page, next) => {
      const handle = await page.$('#root>*')
      return next(handle ?? undefined)
    },
  )
}

export async function generateImageElementOutput(
  puppe: Puppeteer,
  element: Element,
): Promise<Element> {
  return puppe.render(
    renderHtml(element.toString()),
    async (page): Promise<any> => {
      const handle = await page.$('#root>*')
      const clip = (await handle?.boundingBox()) ?? undefined
      const buffer = await page.screenshot({ clip })
      return h.image(buffer, 'image/png')
    },
  ) as unknown as Promise<Element>
}
