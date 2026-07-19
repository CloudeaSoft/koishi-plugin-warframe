import type { Element } from 'koishi'
import type { WorldStateNotification } from '../warframe'

import { VoidTraderComponent } from '../components/wf'
import { msToHumanReadable } from '../warframe'

type Render = (element: Element) => Promise<string>

function formatExpiry(expiry: number): string {
  if (!expiry) {
    return ''
  }
  return new Date(expiry).toLocaleString('zh-CN', {
    hour12: false,
    timeZone: 'Asia/Shanghai',
  })
}

function suffixWithExpiry(expiry: number): string {
  const formatted = formatExpiry(expiry)
  return formatted ? `，截止 ${formatted}` : ''
}

function suffixWithTimeRemaining(expiry: number): string {
  return expiry > Date.now()
    ? `剩余${msToHumanReadable(expiry - Date.now())}`
    : ''
}

function titleLinesMessage(title: string, lines: string[]): Element | undefined {
  if (!lines.length) {
    return undefined
  }
  return (
    <message>
      <div>{`${title}\n`}</div>
      <div>{lines.join('\n')}</div>
    </message>
  ) as Element
}

export function createFissureMessages(items: WorldStateNotification[]): Element[] {
  const message = titleLinesMessage(
    '新的虚空裂隙已出现:',
    items
      .filter(item => item.type === 'fissure')
      .map((item) => {
        const category = item.category === 'steel-path'
          ? '[钢铁]'
          : item.category === 'railjack'
            ? '[九重天]'
            : '[普通]'
        const faction = item.node.faction ? `${item.node.faction}` : ''
        return `${category}${item.tier} - ${item.node.system} (${item.node.type}) ${faction} ${item.node.name} | ${suffixWithTimeRemaining(item.expiry)}`
      }),
  )
  return message ? [message] : []
}

export async function createVoidTraderMessages(
  items: WorldStateNotification[],
  render: Render,
): Promise<Element[]> {
  const messages: Element[] = []
  const voidTraders = items.filter(item => item.type === 'void-trader')
  for (const item of voidTraders) {
    let img = ''
    try {
      img = await render(
        VoidTraderComponent({ expiry: '', items: item.items }),
      )
    }
    catch {
      // Fall back to text-only when inventory image rendering fails.
    }
    const text = `虚空商人到达\n${item.character} 已到达 ${item.location}${suffixWithExpiry(item.expiry)}`
    messages.push((
      img
        ? (
            <message>
              <div>{text}</div>
              <img src={img} />
            </message>
          )
        : (
            <message>
              <div>{text}</div>
            </message>
          )
    ) as Element)
  }
  return messages
}

export function createDailyDealMessages(items: WorldStateNotification[]): Element[] {
  const message = titleLinesMessage(
    '新每日特惠',
    items
      .filter(item => item.type === 'daily-deal')
      .map(item => `${item.item}：${item.salePrice} 白金（-${item.discount}%，原价 ${item.originalPrice}）${suffixWithExpiry(item.expiry)}`),
  )
  return message ? [message] : []
}

export function createAlertMessages(items: WorldStateNotification[]): Element[] {
  const message = titleLinesMessage(
    '新警报',
    items
      .filter(item => item.type === 'alert')
      .map((item) => {
        const reward = item.reward ? ` | 奖励：${item.reward}` : ''
        return `${item.description} | ${item.node} ${item.missionType}${reward}${suffixWithExpiry(item.expiry)}`
      }),
  )
  return message ? [message] : []
}

export async function createWorldStateMessages(
  items: WorldStateNotification[],
  render: Render,
): Promise<Element[]> {
  return [
    ...createFissureMessages(items),
    ...(await createVoidTraderMessages(items, render)),
    ...createDailyDealMessages(items),
    ...createAlertMessages(items),
  ]
}
