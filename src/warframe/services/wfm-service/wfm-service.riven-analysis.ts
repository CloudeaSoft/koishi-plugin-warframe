import type { RivenAttributeShortInternal, RivenItem, RivenOrderInternal } from '../../types'
import { analyzeRiven } from '../riven/analysis'

export function analyzeRivenOrder(item: RivenItem, order: RivenOrderInternal): RivenOrderInternal {
  const attributes: RivenAttributeShortInternal[] = order.item.attributes.map((attr) => {
    const magnitude = Math.abs(attr.value)
    const sign = (attr.positive ? 1 : -1) * (attr.attribute?.positiveIsNegative ? -1 : 1)
    // The API uses the positive flag for effect direction; multipliers already
    // include their neutral 1, unlike ordinary signed bonuses.
    return { ...attr, displayValue: attr.attribute?.unit === 'multiply' ? attr.value : magnitude * sign }
  })
  const result = analyzeRiven({
    name: item.i18n?.en?.name ?? item.i18n?.['zh-hans']?.name ?? item.slug,
    rank: order.item.mod_rank,
    attributes: attributes.map(attr => ({ attr: attr.attribute ?? {}, value: attr.displayValue!, prefix: '' })),
  })
  if (!result.ok)
    return { ...order, item: { ...order.item, attributes }, analysisError: result.error }
  const grades = new Map([...result.data.buffs, ...result.data.curses].map(stat => [stat.sourceIndex, stat.percent]))
  return { ...order, analysis: result.data, item: {
    ...order.item,
    attributes: attributes.map((attr, index) => ({ ...attr, grade: grades.get(index) })),
  } }
}
