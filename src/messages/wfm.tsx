import type { Element } from 'koishi'
import type { ItemShort, ItemStatisticsSummary, OrderWithUser } from '../warframe'

function buildStatisticsTextLine(stats: ItemStatisticsSummary): string {
  const parts: string[] = []
  if (stats.recentAvg !== undefined) {
    parts.push(`近3天均价 ${stats.recentAvg}p`)
    if (stats.baselineMedian !== undefined) {
      const arrow
        = stats.trend === 'up' ? '↑' : stats.trend === 'down' ? '↓' : '≈'
      parts.push(`${arrow}7天${stats.baselineMedian}p`)
    }
  }
  else if (stats.baselineMedian !== undefined) {
    parts.push(`7天中位 ${stats.baselineMedian}p`)
  }
  if (stats.recentVolume > 0) {
    parts.push(`成交${stats.recentVolume}笔`)
  }
  return parts.length > 0 ? parts.join(' | ') : ''
}

export function wmMessage(
  img: Element,
  item: ItemShort,
  orders: OrderWithUser[],
  statistics?: ItemStatisticsSummary,
): Element {
  const lines = orders.slice(0, 3)
    .map(order => '\n'
      + `/w ${order.user.ingameName} Hi! I want to buy: "${item.i18n.en?.name}${!item.maxRank || item.maxRank === 0 ? '' : ` (rank ${order.rank})`}" for ${order.platinum} platinum. (warframe.market)`)
  const statLine = statistics ? buildStatisticsTextLine(statistics) : ''
  return (
    <message>
      {img}
      <div>
        {statLine ? `\n${statLine}\n` : ''}
        {lines.join('')}
      </div>
    </message>
  )
}
