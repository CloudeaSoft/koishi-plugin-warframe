import type { Element } from 'koishi'
import type { WorldStateNotification } from '../warframe'

import { msToHumanReadable } from '../warframe'

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
  return expiry > 0
    ? `剩余${msToHumanReadable(expiry - Date.now())}`
    : ''
}

export async function createWorldStateMessages(
  items: WorldStateNotification[],
): Promise<Element[]> {
  const messages: Element[] = []
  const push = async (title: string, lines: string[]): Promise<void> => {
    if (lines.length) {
      messages.push((
        <message>
          <div>{`${title}\n`}</div>
          <div>{lines.join('\n')}</div>
        </message>
      ) as Element)
    }
  }

  await push('新的虚空裂隙已出现:', items
    .filter(item => item.type === 'fissure')
    .map((item) => {
      const category = item.category === 'steel-path'
        ? '[钢铁]'
        : item.category === 'railjack'
          ? '[九重天]'
          : '[普通]'
      const faction = item.node.faction ? `${item.node.faction}` : ''
      return `${category}${item.tier} - ${item.node.system} (${item.node.type}) ${faction} ${item.node.name} | ${suffixWithTimeRemaining(item.expiry)}`
    }))

  await push('虚空商人到达', items
    .filter(item => item.type === 'void-trader')
    .map(item => `${item.character} 已到达 ${item.location}${suffixWithExpiry(item.expiry)}`))

  await push('新每日特惠', items
    .filter(item => item.type === 'daily-deal')
    .map(item => `${item.item}：${item.salePrice} 白金（-${item.discount}%，原价 ${item.originalPrice}）${suffixWithExpiry(item.expiry)}`))

  await push('新警报', items
    .filter(item => item.type === 'alert')
    .map((item) => {
      const reward = item.reward ? ` | 奖励：${item.reward}` : ''
      return `${item.description} | ${item.node} ${item.missionType}${reward}${suffixWithExpiry(item.expiry)}`
    }))

  return messages
}
