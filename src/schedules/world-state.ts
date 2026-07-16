import type { Context } from 'koishi'

import type { PluginDependencies } from '../types/config'

import { refreshWorldState, type WorldStateNotification } from '../warframe'
import {} from 'koishi-plugin-cron'

type Refresh = () => Promise<WorldStateNotification[]>

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

export function formatWorldStateNotifications(
  items: WorldStateNotification[],
): string[] {
  const fissures = items.filter(item => item.type === 'fissure')
  const traders = items.filter(item => item.type === 'void-trader')
  const deals = items.filter(item => item.type === 'daily-deal')
  const alerts = items.filter(item => item.type === 'alert')
  const messages: string[] = []

  if (fissures.length) {
    const lines = fissures.map((item) => {
      const category = item.category === 'steel-path'
        ? ' [钢铁之路]'
        : item.category === 'railjack'
          ? ' [九重天]'
          : ''
      return `${item.tier} - ${item.node}（${item.missionType}）${category}${suffixWithExpiry(item.expiry)}`
    })
    messages.push(`【新虚空裂隙】\n${lines.join('\n')}`)
  }

  if (traders.length) {
    const lines = traders.map(item =>
      `${item.character} 已到达 ${item.location}${suffixWithExpiry(item.expiry)}`)
    messages.push(`【虚空商人到达】\n${lines.join('\n')}`)
  }

  if (deals.length) {
    const lines = deals.map(item =>
      `${item.item}：${item.salePrice} 白金（-${item.discount}%，原价 ${item.originalPrice}）${suffixWithExpiry(item.expiry)}`)
    messages.push(`【新每日特惠】\n${lines.join('\n')}`)
  }

  if (alerts.length) {
    const lines = alerts.map((item) => {
      const reward = item.reward ? ` | 奖励：${item.reward}` : ''
      return `${item.description} | ${item.node} ${item.missionType}${reward}${suffixWithExpiry(item.expiry)}`
    })
    messages.push(`【新警报】\n${lines.join('\n')}`)
  }

  return messages
}

export function setupWorldStateSchedule(
  ctx: Context,
  deps: PluginDependencies,
  refresh: Refresh = refreshWorldState,
): void {
  let running = false

  ctx.cron('0 */5 * * * *', async () => {
    if (running) {
      return
    }
    running = true

    try {
      const messages = formatWorldStateNotifications(await refresh())
      const channels = Object.values(deps.config.channelIds)
      if (!channels.length) {
        return
      }
      for (const message of messages) {
        await ctx.broadcast(channels, message)
      }
    }
    catch (error) {
      deps.logger.warn(error, '刷新 Warframe 世界状态失败')
    }
    finally {
      running = false
    }
  })
}
