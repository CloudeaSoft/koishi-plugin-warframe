import type {
  ItemShort,
  ItemStatisticsSummary,
  OrderWithUser,
  OutputRelic,
  OutputRelicReward,
  PrimedModHistoryItem,
  Relic,
  RivenAttributeShortInternal,
  RivenItem,
  RivenOrderInternal,
  WarframeResult,
} from '../../types'
import { dict_zh } from 'warframe-public-export-plus'

import { globalDucatnatorIDDict } from '../../data/wfm/globalDucatnator'

import { globalItemData } from '../../data/wfm/globalItem'
import { globalRivenAttribute } from '../../data/wfm/globalRivenAttribute'
import { globalRivenItemData } from '../../data/wfm/globalRivenItem'
import { getVoidTraderHistory } from '../../infrastructure/wf/wf-api'
import { wfmClient } from '../../infrastructure/wfm-client'
import { failure } from '../../types/warframe-result'
import {
  createAsyncCache,
  normalizeName,
  pascalToSpaced,
  toTimeStamp,
} from '../../utils'
import { stringToWFMItem } from './wfm-service.item-matcher'
import { findRivenItemByName } from './wfm-service.riven-item-matcher'
import { computeItemStatistics } from './wfm-service.statistics'

export { stringToWFMItem }

// ================ features ===================
export async function updateCache(): Promise<string> {
  const updateTasks = [
    { name: 'globalItemData', fn: globalItemData.update() },
    { name: 'globalRivenAttribute', fn: globalRivenAttribute.update() },
    { name: 'globalRivenItemData', fn: globalRivenItemData.update() },
    { name: 'globalDucatnatorIDDict', fn: globalDucatnatorIDDict.update() },
  ]

  const results = await Promise.allSettled(updateTasks.map(async task => task.fn))

  const lines = updateTasks.map((task, index) => {
    const result = results[index]
    if (result.status === 'fulfilled') {
      // Soft failures (e.g. HTTP helpers returning undefined) fulfill without throwing.
      if (result.value == null) {
        return `${task.name}: 失败 - 无有效数据`
      }
      return `${task.name}: 成功`
    }

    const reason = result.reason instanceof Error
      ? result.reason.message
      : String(result.reason)
    return `${task.name}: 失败 - ${reason}`
  })

  return lines.join('\n')
}

export async function getItemOrders(input: string): Promise<WarframeResult<{ item: ItemShort, orders: OrderWithUser[], statistics?: ItemStatisticsSummary }>> {
  if (!input || !input.trim()) {
    return failure('wfm.inputItemName')
  }
  input = input.trim()

  // 1. Process global option
  const isFullLevel = /^满级|满级$/.test(normalizeName(input))
  if (isFullLevel) {
    if (input.startsWith('满级')) {
      input = input.slice(2, input.length).trimStart()
    }
    else if (input.endsWith('满级')) {
      input = input.slice(0, input.length - 2).trimEnd()
    }
  }

  // 2. Search item
  const targetItem = await stringToWFMItem(input)
  if (!targetItem) {
    return failure('wfm.itemNotFound', false, { input })
  }

  // 3. Fetch orders and statistics in parallel
  const itemId = targetItem.slug
  const targetRank = isFullLevel ? targetItem.maxRank : targetItem.maxRank === undefined ? undefined : 0
  const [data, statsData] = await Promise.all([
    wfmClient.items.getOrders(itemId),
    wfmClient.items.getStatistics(itemId),
  ])

  if (!data) {
    return failure('wfm.orderFetchFailed', true)
  }

  // 4. Process result
  const result = data
    .filter(
      order =>
        order.user.status === 'ingame'
        && order.visible
        && order.type === 'sell'
        && (!isFullLevel || order.rank === targetItem.maxRank),
    )
    .sort((a, b) => toTimeStamp(b.updatedAt) - toTimeStamp(a.updatedAt)) // Update Time DESC
    .sort((a, b) => a.platinum - b.platinum) // Price ASC
    .slice(0, 8) // Top 8

  if (result.length === 0) {
    return failure('wfm.noOnlineSeller')
  }

  // 5. Compute statistics summary (best-effort, degrades gracefully).
  // Any failure here must not prevent orders from being returned.
  let statistics: ItemStatisticsSummary | undefined
  if (statsData) {
    try {
      statistics = computeItemStatistics(statsData, targetRank, result[0].platinum)
    }
    catch {
      statistics = undefined
    }
  }

  return {
    ok: true,
    data: { item: targetItem, orders: result, ...(statistics ? { statistics } : {}) },
  }
}

export async function getRivenOrders(input: string): Promise<WarframeResult<{ item: RivenItem, orders: RivenOrderInternal[] }>> {
  if (!input || !input.trim()) {
    return failure('wfm.inputItemName')
  }
  input = input.trim()

  const { globalRivenAttributeDict } = await globalRivenAttribute.get()

  const targetItem = await findRivenItemByName(input)
  if (!targetItem) {
    return failure('wfm.rivenWeaponNotFound', false, { input })
  }

  const itemId = targetItem.slug
  const data = await wfmClient.rivens.getOrders(itemId)
  if (!data) {
    return failure('wfm.rivenOrderFetchFailed', true)
  }

  const top5 = data
    .filter(
      order =>
        order.owner.status === 'ingame'
        && order.visible
        && !order.private
        && !order.closed
        && order.is_direct_sell,
    )
    .sort((a, b) => toTimeStamp(b.updated) - toTimeStamp(a.updated)) // Update Time DESC
    .sort((a, b) => a.starting_price - b.starting_price) // Price ASC
    .slice(0, 5) // Top 5

  if (top5.length === 0) {
    return failure('wfm.noOnlineRivenSeller')
  }

  const orders = top5.map((e) => {
    const transformed: RivenAttributeShortInternal[] = e.item.attributes.map(
      (attr) => {
        return {
          ...attr,
          attribute: globalRivenAttributeDict[attr.url_name],
        }
      },
    )

    e.item.attributes = transformed
    return e as RivenOrderInternal
  })

  return { ok: true, data: { item: targetItem, orders } }
}

export async function applyRelicData(relic: Relic): Promise<OutputRelic> {
  const tier = dict_zh[relic.tierKey] ?? relic.tier

  const { globalItemGameRefDict } = await globalItemData.get()
  const wfmDict = await globalDucatnatorIDDict.get()

  const loadedItems = relic.items.map((element): OutputRelicReward => {
    const item = globalItemGameRefDict[element.name]
    if (!item) {
      const nameArr = element.name.split('/')
      const name = pascalToSpaced(nameArr[nameArr.length - 1]).replace(
        'Blueprint',
        '蓝图',
      )
      const quantityPrefix
        = element.quantity > 1 ? `${element.quantity} X ` : ''
      return {
        ...element,
        name: quantityPrefix + name,
        ducats: undefined,
        platinum: undefined,
      }
    }

    const platinum = wfmDict ? wfmDict[item.id]?.median : undefined

    return {
      ...element,
      name: item.i18n?.['zh-hans']?.name ?? item.i18n?.en?.name ?? element.name,
      ducats: item.ducats,
      platinum,
    }
  })

  return {
    tier,
    num: relic.num,
    items: loadedItems,
  }
}

export const primedModHistory = createAsyncCache(async () => {
  const history = await getVoidTraderHistory()

  const primeModHistory: { Name: string, Last: string }[] = []
  for (const key in history) {
    const item = history[key]
    if (item.Name.startsWith('Primed') && item.Type.includes('Mod')) {
      primeModHistory.push({
        Name: item.Name,
        Last: item.OfferingDates?.at(-1) ?? '',
      })
    }
  }

  primeModHistory.sort((a, b) => {
    const timeA = a.Last ? new Date(a.Last).getTime() : 0
    const timeB = b.Last ? new Date(b.Last).getTime() : 0
    return (Number.isNaN(timeA) ? 0 : timeA) - (Number.isNaN(timeB) ? 0 : timeB)
  })

  const result: Array<PrimedModHistoryItem> = []
  const { globalItemDict, globalItemNameToSlugDict }
    = await globalItemData.get()

  for (const mod of primeModHistory) {
    const name = normalizeName(mod.Name)
    const slug = globalItemNameToSlugDict[name]
    if (!slug) {
      result.push({ name: mod.Name, last: mod.Last })
      continue
    }

    const item = globalItemDict[slug]
    if (!item) {
      result.push({ name: mod.Name, last: mod.Last })
      continue
    }

    const data = await wfmClient.items.getStatistics(slug)

    if (data) {
      const zeroRankList = data.statistics_closed['90days'].filter(
        e => e.mod_rank === 0,
      )
      const lastThree = zeroRankList.slice(-3)
      const avg = lastThree.length > 0
        ? Math.round((lastThree.reduce((acc, e) => acc + e.median, 0) / lastThree.length) * 10) / 10
        : undefined
      result.push({
        name: item.i18n['zh-hans']?.name,
        last: mod.Last,
        plats: avg,
      })
    }
    else {
      result.push({
        name: item.i18n['zh-hans']?.name,
        last: mod.Last,
      })
    }
  }

  return result
}, 43_200_000)
