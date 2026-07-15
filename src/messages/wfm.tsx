import type { Element } from 'koishi'
import type { ItemShort, OrderWithUser } from '../warframe'

export function wmMessage(img: Element, item: ItemShort, orders: OrderWithUser[]): Element {
  const lines = orders.slice(0, 3)
    .map(order => '\n'
      + `/w ${order.user.ingameName} Hi! I want to buy: "${item.i18n.en?.name}${!item.maxRank || item.maxRank === 0 ? '' : ` (rank ${order.rank})`}" for ${order.platinum} platinum. (warframe.market)`)
  return (
    <message>
      {img}
      <div>{lines.join('')}</div>
    </message>
  )
}
