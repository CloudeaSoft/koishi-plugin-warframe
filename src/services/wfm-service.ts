import type { ServiceResult } from '../types/result'
import type {
  ItemShort,
  OrderWithUser,
  PrimedModHistoryItem,
  RivenAttributeShortInternal,
  RivenItem,
  RivenOrderInternal,
} from '../types/wfm'
import { dict_zh } from 'warframe-public-export-plus'

import { globalDucatnatorIDDict } from '../data/wfm/globalDucatnator'

import { globalItemData } from '../data/wfm/globalItem'
import { globalRivenAttribute } from '../data/wfm/globalRivenAttribute'
import { globalRivenItemData } from '../data/wfm/globalRivenItem'
import { getVoidTraderHistory } from '../infrastructure/wf/wf-api'
import { wfmClient } from '../infrastructure/wfm-client'
import {
  createAsyncCache,
  normalizeName,
  pascalToSpaced,
  toTimeStamp,
} from '../utils'
import { stringToWFMItem } from './wfm-item-matcher'

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
      return `${task.name}: 成功`
    }
    else {
      return `${task.name}: 失败 - ${result.reason}`
    }
  })

  return lines.join('\n')
}

export async function getItemOrders(input: string): Promise<ServiceResult<{ item: ItemShort, orders: OrderWithUser[] }>> {
  if (!input) {
    return { ok: false, message: 'wfm.inputItemName' }
  }
  input = normalizeName(input)

  // 1. Process global option
  const isFullLevel = /^满级|满级$/.test(input)
  if (isFullLevel) {
    if (input.startsWith('满级')) {
      input = input.slice(2, input.length)
    }
    else if (input.endsWith('满级')) {
      input = input.slice(0, input.length - 2)
    }
  }

  // 2. Search item
  const targetItem = await stringToWFMItem(input)
  if (!targetItem) {
    return { ok: false, message: 'wfm.itemNotFound', params: { input } }
  }

  // 3. Fetch orders
  const itemId = targetItem.slug
  const data = await wfmClient.items.getOrders(itemId)
  if (!data) {
    return { ok: false, message: 'wfm.orderFetchFailed' }
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
    .slice(0, 5) // Top 5

  if (result.length === 0) {
    return { ok: false, message: 'wfm.noOnlineSeller' }
  }

  return {
    ok: true,
    data: { item: targetItem, orders: result },
  }
}

export async function getRivenOrders(input: string): Promise<ServiceResult<{ item: RivenItem, orders: RivenOrderInternal[] }>> {
  const { globalRivenItemList } = await globalRivenItemData.get()
  const { globalRivenAttributeDict } = await globalRivenAttribute.get()

  const targetItem
    = globalRivenItemList.find(item =>
      compareRivenItemName(input, item.i18n?.['zh-hans']?.name ?? ''),
    )
    ?? globalRivenItemList.find(item =>
      compareRivenItemName(input, item.i18n?.en?.name ?? ''),
    )
  if (!targetItem) {
    return { ok: false, message: 'wfm.rivenWeaponNotFound', params: { input } }
  }

  const itemId = targetItem.slug
  const data = await wfmClient.rivens.getOrders(itemId)
  if (!data) {
    return { ok: false, message: 'wfm.rivenOrderFetchFailed' }
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
    return { ok: false, message: 'wfm.noOnlineRivenSeller' }
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
        ducats: 0,
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

function compareRivenItemName(input: string, standard: string): boolean {
  if (
    !input
    || !standard
    || typeof input !== 'string'
    || typeof standard !== 'string'
  ) {
    return false
  }

  // 2. 标准化名称
  const normalizedInput = normalizeName(input)
  const normalizedStandard = normalizeName(standard)

  if (!normalizedInput || !normalizedStandard)
    return false

  return normalizedInput === normalizedStandard
}
