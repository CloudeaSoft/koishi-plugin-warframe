import type WorldState from 'warframe-worldstate-parser'

import { globalWorldState } from '../data/wf/globalWorldState'

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
    node: string
    missionType: string
    category: 'normal' | 'steel-path' | 'railjack'
    expiry: number
  }
  | {
    type: 'void-trader'
    id: string
    character: string
    location: string
    expiry: number
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
    value.mission.nodeKey ?? value.mission.node,
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
  const reward = alert.mission.reward
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

export function diffWorldStates(
  previous: WorldStateSnapshot,
  current: WorldStateSnapshot,
): WorldStateNotification[] {
  const notifications: WorldStateNotification[] = []
  const previousFissures = new Set(previous.raw.fissures.map(fissureId))
  for (const fissure of current.raw.fissures) {
    const id = fissureId(fissure)
    if (!previousFissures.has(id)) {
      notifications.push({
        type: 'fissure',
        id,
        tier: String(fissure.tier),
        node: fissure.node,
        missionType: fissure.missionType,
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
      })
    }
  }

  const previousDeals = new Set(previous.raw.dailyDeals.map(dailyDealId))
  for (const deal of current.raw.dailyDeals) {
    const id = dailyDealId(deal)
    if (!previousDeals.has(id)) {
      notifications.push({
        type: 'daily-deal',
        id,
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
        node: alert.mission.node,
        missionType: alert.mission.type,
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

    const notifications = diffWorldStates(previous, current)
    previous = current
    return notifications
  }
}

export const refreshWorldState = createWorldStateRefresher()
