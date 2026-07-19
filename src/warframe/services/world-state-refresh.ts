import type WorldState from 'warframe-worldstate-parser'
import type { VoidTraderItem, WFRegionShort } from '../types'

import {
  adaptFissure,
  globalWorldState,
} from '../data/wf/globalWorldState'
import { getVoidTraderItem } from '../infrastructure/wf/wfcd-adapter'

export type WorldStateSnapshot = Awaited<
  ReturnType<typeof globalWorldState.get>
>

type ParsedFissure = WorldState['fissures'][number]
type ParsedVoidTrader = WorldState['voidTraders'][number]
type ParsedDailyDeal = WorldState['dailyDeals'][number]
type ParsedAlert = WorldState['alerts'][number]

export type WorldStateNotification
  = | {
    type: 'fissure'
    id: string
    tier: string
    tierNum: number
    node: WFRegionShort
    hard: boolean
    category: 'normal' | 'steel-path' | 'railjack'
    expiry: number
  }
  | {
    type: 'void-trader'
    id: string
    character: string
    location: string
    expiry: number
    items: VoidTraderItem[]
  }
  | {
    type: 'daily-deal'
    id: string
    item: string
    originalPrice: number
    salePrice: number
    discount: number
    expiry: number
  }
  | {
    type: 'alert'
    id: string
    description: string
    node: string
    missionType: string
    reward: string
    expiry: number
  }

function time(value?: Date): number {
  return value?.getTime() ?? 0
}

function fissureId(value: ParsedFissure): string {
  return value.id ?? [
    time(value.activation),
    time(value.expiry),
    value.node,
    value.tier,
    value.isHard,
    value.isStorm,
  ].join(':')
}

function dailyDealId(value: ParsedDailyDeal): string {
  return value.id ?? [
    time(value.activation),
    time(value.expiry),
    value.uniqueName ?? value.item,
  ].join(':')
}

function alertId(value: ParsedAlert): string {
  return value.id ?? [
    time(value.activation),
    time(value.expiry),
    value.mission?.nodeKey ?? value.mission?.node ?? '',
    value.tag ?? '',
  ].join(':')
}

function traderId(value: ParsedVoidTrader): string {
  return value.id ?? [
    time(value.activation),
    value.character,
    value.location,
  ].join(':')
}

function alertReward(alert: ParsedAlert): string {
  const reward = alert.mission?.reward
  if (!reward) {
    return ''
  }

  const values = [
    ...reward.items,
    ...reward.countedItems.map(item => `${item.key} x${item.count}`),
  ]
  if (reward.credits) {
    values.push(`${reward.credits} 现金`)
  }
  return values.join('、')
}

export async function diffWorldStates(
  previous: WorldStateSnapshot,
  current: WorldStateSnapshot,
): Promise<WorldStateNotification[]> {
  const notifications: WorldStateNotification[] = []
  const previousFissures = new Set(previous.raw.fissures.map(fissureId))
  for (const fissure of current.raw.fissures) {
    const id = fissureId(fissure)
    if (!previousFissures.has(id)) {
      const mapped = await adaptFissure(fissure)
      notifications.push({
        type: 'fissure',
        id,
        tier: mapped.tier,
        tierNum: mapped.tierNum,
        node: mapped.node,
        hard: mapped.hard,
        category: fissure.isStorm
          ? 'railjack'
          : fissure.isHard
            ? 'steel-path'
            : 'normal',
        expiry: time(fissure.expiry),
      })
    }
  }

  const previousTimestamp = previous.raw.timestamp.getTime()
  const currentTimestamp = current.raw.timestamp.getTime()
  for (const trader of current.raw.voidTraders) {
    const activation = time(trader.activation)
    if (activation > previousTimestamp && activation <= currentTimestamp) {
      notifications.push({
        type: 'void-trader',
        id: traderId(trader),
        character: trader.character,
        location: trader.location,
        expiry: time(trader.expiry),
        items: trader.inventory.map(getVoidTraderItem),
      })
    }
  }

  for (const deal of current.raw.dailyDeals) {
    const activation = time(deal.activation)
    if (activation > previousTimestamp && activation <= currentTimestamp) {
      notifications.push({
        type: 'daily-deal',
        id: dailyDealId(deal),
        item: deal.item,
        originalPrice: deal.originalPrice,
        salePrice: deal.salePrice,
        discount: deal.discount,
        expiry: time(deal.expiry),
      })
    }
  }

  const previousAlerts = new Set(previous.raw.alerts.map(alertId))
  for (const alert of current.raw.alerts) {
    const id = alertId(alert)
    if (!previousAlerts.has(id)) {
      notifications.push({
        type: 'alert',
        id,
        description: alert.description,
        node: alert.mission?.node ?? '',
        missionType: alert.mission?.type ?? '',
        reward: alertReward(alert),
        expiry: time(alert.expiry),
      })
    }
  }

  return notifications
}

export interface WorldStateSource {
  update: () => Promise<WorldStateSnapshot>
}

export function createWorldStateRefresher(
  source: WorldStateSource = globalWorldState,
): () => Promise<WorldStateNotification[]> {
  let previous: WorldStateSnapshot | undefined

  return async () => {
    const current = await source.update()
    if (!previous) {
      previous = current
      return []
    }

    const notifications = await diffWorldStates(previous, current)
    previous = current
    return notifications
  }
}

export const refreshWorldState = createWorldStateRefresher()
