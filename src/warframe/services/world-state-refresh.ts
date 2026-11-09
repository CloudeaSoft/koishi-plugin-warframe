import type WorldState from 'warframe-worldstate-parser'

import type { GlobalWorldStateData } from '../data/wf/globalWorldState'
import type { VoidTraderItem, WFRegionShort } from '../types'
import {
  adaptFissure,
  globalWorldState,
} from '../data/wf/globalWorldState'
import { resolveExportItemNameZh } from '../infrastructure/wf/bounty-adapter'
import { getSolNodeKey, getVoidTraderItem } from '../infrastructure/wf/wfcd-adapter'
import { adaptAlerts } from './wf-service/wf-service.alert'

export type WorldStateSnapshot = GlobalWorldStateData

type ParsedFissure = WorldState['fissures'][number]
type ParsedVoidTrader = WorldState['voidTraders'][number]
type ParsedDailyDeal = WorldState['dailyDeals'][number]
type ParsedAlert = WorldState['alerts'][number]

/** 中断：只推钢铁之路，不要九重天。 */
const steelDisruptionSolNodes: readonly string[] = [
  'SolNode30', // 火星 · Olympus
  'SolNode177', // 赛德娜 · Kappa
]

/** 防御：普通与钢铁之路都推。 */
const defenseSolNodes: readonly string[] = [
  'SolNode122', // 天王星 · Stephano
  'SolNode402', // 虚空 · 雷争塔 Taranis
  'SolNode408', // 虚空 · 光神塔 Belenus
  'SolNode149', // 谷神星 · Casta
  'ClanNode22', // 谷神星 · Seimeni（黑暗地带）
]

/** 歼灭：普通与钢铁之路都推。不含赤毒要塞 Dakata（SolNode746）。 */
const exterminationSolNodes: readonly string[] = [
  'SolNode103', // 水星 · M Prime
  'SolNode226', // 水星 · Pantheon
  'SolNode128', // 金星 · E Gate
  'SolNode902', // 金星 · Montes（Archwing）
  'SolNode27', // 地球 · E Prime
  'SolNode89', // 地球 · Mariana
  'SolNode58', // 火星 · Hellas
  'SolNode904', // 火星 · Syrtis（Archwing）
  'SolNode14', // 火星 · Ultor
  'SolNode121', // 木星 · Carpo
  'SolNode20', // 土星 · Telesto
  'SolNode114', // 天王星 · Puck
  'SolNode34', // 天王星 · Sycorax
  'SolNode62', // 海王星 · Neso
  'SolNode4', // 冥王星 · Acheron
  'SolNode21', // 冥王星 · Narcissus
  'SolNode131', // 谷神星 · Pallas
  'SolNode171', // 阋神星 · Saxis
  'SolNode181', // 赛德娜 · Adaro
  'SolNode204', // 欧罗巴 · Armaros
  'SolNode205', // 欧罗巴 · Baal
  'SolNode407', // 虚空 · 母神塔 Oxomoco
  'SolNode400', // 虚空 · 神王塔 Teshub
  'SettlementNode1', // 火卫一 · Roche
  'SolNode716', // 火卫二 · 孽杀 Nex
  'SolNode708', // 火卫二 · Phlegyas
  'SolNode300', // 月球 · Plato
  'SolNode231', // 扎里曼号 · 哈拉科防线 Halako Perimeter
  'SolNode853', // 霍瓦尼亚 · 歼灭：炽蛇军
  'SolNode854', // 霍瓦尼亚 · 歼灭：科腐者
]

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

function isScheduledFissureNode(solNode: string, fissure: ParsedFissure): boolean {
  if (steelDisruptionSolNodes.includes(solNode)) {
    return fissure.isHard && !fissure.isStorm
  }
  return defenseSolNodes.includes(solNode) || exterminationSolNodes.includes(solNode)
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

export async function diffWorldStates(
  previous: WorldStateSnapshot,
  current: WorldStateSnapshot,
): Promise<WorldStateNotification[]> {
  const notifications: WorldStateNotification[] = []
  const previousFissures = new Set(previous.raw.fissures.map(fissureId))
  for (const fissure of current.raw.fissures) {
    const id = fissureId(fissure)
    if (previousFissures.has(id)) {
      continue
    }

    const solNode = await getSolNodeKey(fissure.nodeKey)
    if (!solNode || !isScheduledFissureNode(solNode, fissure)) {
      continue
    }

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
        item: resolveExportItemNameZh(deal.uniqueName || deal.item, deal.item),
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
      const { alerts: [mapped] } = await adaptAlerts([alert], currentTimestamp)
      if (!mapped) {
        continue
      }
      notifications.push({
        type: 'alert',
        id,
        description: mapped.description ?? '',
        node: mapped.node.system ? `${mapped.node.name} (${mapped.node.system})` : mapped.node.name,
        missionType: mapped.type,
        reward: mapped.rewards.map(item => item.count > 1 ? `${item.name} x${item.count}` : item.name).join('、'),
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
