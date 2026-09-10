import type {
  EventBoard,
  EventInfo,
  EventInterimStep,
  EventReward,
  RawEventReward,
  RawMongoDate,
  RawWorldEvent,
  WarframeResult,
} from '../../types'

import { dict_zh, ExportRegions } from 'warframe-public-export-plus'
import { dictZhExtra } from '../../assets/index'
import { globalWorldState } from '../../data/wf/globalWorldState'
import { resolveExportItemNameZh } from '../../infrastructure/wf/bounty-adapter'
import { stripLotusMarkup } from '../../infrastructure/wf/calendar-adapter'
import { regionToShort } from '../../infrastructure/wf/wf-export-adapter'
import { failure } from '../../types/warframe-result'
import { msToHumanReadable } from '../../utils'

const EVENT_TITLE_KEY = '/Lotus/Language/Menu/WorldStatePanel_Event'

function translate(key: string, fallback: string = key): string {
  return stripLotusMarkup(dict_zh[key] ?? dictZhExtra[key] ?? fallback)
}

function mongoDateMs(value?: RawMongoDate): number {
  const raw = value?.$date?.$numberLong
  if (raw === undefined || raw === '') {
    return 0
  }
  const ms = Number(raw)
  return Number.isFinite(ms) ? ms : 0
}

function adaptRewards(reward?: RawEventReward): EventReward[] {
  if (!reward) {
    return []
  }

  const rewards: EventReward[] = []
  for (const item of reward.items ?? []) {
    rewards.push({
      name: item.startsWith('/Lotus') ? resolveExportItemNameZh(item) : item,
      count: 1,
    })
  }
  for (const item of reward.countedItems ?? []) {
    const source = item.ItemType ?? item.key ?? item.type ?? ''
    if (!source) {
      continue
    }
    rewards.push({
      name: source.startsWith('/Lotus') ? resolveExportItemNameZh(source) : source,
      count: item.ItemCount ?? item.count ?? 1,
    })
  }
  if (reward.credits && reward.credits > 0) {
    rewards.push({
      name: resolveExportItemNameZh(`/${reward.credits}Credits`),
      count: 1,
    })
  }
  return rewards
}

function adaptInterimSteps(raw: RawWorldEvent): EventInterimStep[] {
  const goals = raw.InterimGoals ?? []
  const rewards = raw.InterimRewards ?? []
  const steps: EventInterimStep[] = []
  for (let index = 0; index < goals.length; index++) {
    const goal = goals[index]
    const stepRewards = adaptRewards(rewards[index])
    if (!Number.isFinite(goal) || stepRewards.length === 0) {
      continue
    }
    steps.push({ goal, rewards: stepRewards })
  }
  return steps
}

export function adaptEvents(
  rawEvents: readonly RawWorldEvent[] = [],
  now: number = Date.now(),
): EventBoard {
  const adapted: EventInfo[] = []
  for (const raw of rawEvents) {
    const expiry = mongoDateMs(raw.Expiry)
    const activation = mongoDateMs(raw.Activation)
    if (activation > now) {
      continue
    }
    if (expiry > 0 && expiry <= now) {
      continue
    }

    const nameKey = raw.Desc ?? ''
    const name = nameKey ? translate(nameKey) : (raw.Tag ?? '')
    if (!name) {
      continue
    }

    const descriptionKey = raw.ToolTip ?? ''
    const description = descriptionKey ? translate(descriptionKey) : undefined
    const scoreKey = raw.ScoreLocTag ?? ''
    const scoreLabel = scoreKey ? translate(scoreKey) : undefined
    const maximumScore = raw.Goal ?? 0
    const currentScore = raw.Count ?? 0
    const progress = maximumScore > 0
      ? Math.min(1, Math.max(0, currentScore / maximumScore))
      : (typeof raw.HealthPct === 'number'
          ? Math.min(1, Math.max(0, raw.HealthPct))
          : undefined)
    const region = raw.Node && ExportRegions[raw.Node]
      ? regionToShort(ExportRegions[raw.Node], dict_zh)
      : undefined

    adapted.push({
      id: raw._id?.$oid ?? raw._id?.$id ?? raw.Tag ?? name,
      name,
      ...(description ? { description } : {}),
      ...(scoreLabel ? { scoreLabel } : {}),
      ...(region ? { node: region } : {}),
      ...(expiry > 0 ? { remaining: msToHumanReadable(expiry - now), expiry } : { expiry: 0 }),
      currentScore,
      maximumScore,
      ...(progress === undefined ? {} : { progress }),
      rewards: adaptRewards(raw.Reward),
      interimSteps: adaptInterimSteps(raw),
    })
  }

  adapted.sort((a, b) => {
    if (a.expiry === 0) {
      return b.expiry === 0 ? 0 : 1
    }
    if (b.expiry === 0) {
      return -1
    }
    return a.expiry - b.expiry
  })

  return {
    title: translate(EVENT_TITLE_KEY),
    events: adapted,
  }
}

export async function getEventsFrom(
  snapshot?: {
    raw?: unknown
    eventsRaw?: RawWorldEvent[]
  },
  now: number = Date.now(),
): Promise<WarframeResult<EventBoard>> {
  if (!snapshot?.raw) {
    return failure('common.fetchFailed', true)
  }

  const data = adaptEvents(snapshot.eventsRaw ?? [], now)
  if (data.events.length === 0) {
    return failure('event.unavailable')
  }

  return { ok: true, data }
}

export async function getEvents(): Promise<WarframeResult<EventBoard>> {
  try {
    return await getEventsFrom(await globalWorldState.get())
  }
  catch {
    return failure('common.fetchFailed', true)
  }
}
