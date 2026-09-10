import type { TFaction } from 'warframe-public-export-plus'

import type {
  Invasion,
  InvasionBoard,
  InvasionFactionTone,
  InvasionSide,
  RawInvasion,
  WarframeResult,
} from '../../types'

import {
  dict_zh,
  ExportFactions,
  ExportRegions,
} from 'warframe-public-export-plus'

import { dictZhExtra } from '../../assets/index'
import { globalWorldState } from '../../data/wf/globalWorldState'
import { resolveExportItemNameZh } from '../../infrastructure/wf/bounty-adapter'
import { regionToShort } from '../../infrastructure/wf/wf-export-adapter'
import { getSolNodeKey, translateLanguageString } from '../../infrastructure/wf/wfcd-adapter'
import { failure } from '../../types/warframe-result'

const INVASION_TITLE_KEY = '/Lotus/Language/Menu/WorldStatePanel_Invasions'
const INFESTED_INVASION_BOSS_TAG = '/Lotus/Language/Menu/InfestedInvasionBoss'

function invasionProgress(count: number, goal: number, vsInfested: boolean): number {
  const scale = vsInfested ? 1 : 0.5
  return goal ? Math.min(1, Math.max(0, (1 + count / goal) * scale)) : scale
}

function invasionTone(faction?: string): InvasionFactionTone {
  if (/grineer/i.test(faction ?? '')) {
    return 'grineer'
  }
  if (/corpus/i.test(faction ?? '')) {
    return 'corpus'
  }
  if (/infest/i.test(faction ?? '')) {
    return 'infested'
  }
  return 'other'
}

function invasionSide(
  faction: string | undefined,
  reward: RawInvasion['AttackerReward'],
): InvasionSide {
  const rewards = !reward || Array.isArray(reward)
    ? []
    : [
        ...(reward.items ?? []).map(item => ({ name: resolveExportItemNameZh(item), count: 1 })),
        ...(reward.countedItems ?? []).map(item => ({
          name: resolveExportItemNameZh(item.ItemType),
          count: item.ItemCount,
        })),
        ...(reward.credits && reward.credits > 0
          ? [{ name: resolveExportItemNameZh(`/${reward.credits}Credits`), count: 1 }]
          : []),
      ]
  const nameKey = faction ? ExportFactions[faction as TFaction]?.name ?? faction : undefined
  return {
    faction: nameKey ? (dict_zh[nameKey] ?? dictZhExtra[nameKey] ?? '') : '',
    tone: invasionTone(faction),
    rewards,
  }
}

export async function adaptInvasions(rawInvasions: RawInvasion[]): Promise<InvasionBoard> {
  const drafts: Array<Invasion & {
    systemIndex: number
    locTag: string
    campaign: string
    count: number
    goal: number
  }> = []

  for (const raw of rawInvasions) {
    if (raw.Completed) {
      continue
    }

    const count = raw.Count ?? 0
    const goal = raw.Goal ?? 0
    const vsInfested = [
      raw.Faction,
      raw.DefenderFaction,
      raw.AttackerMissionInfo?.faction,
      raw.DefenderMissionInfo?.faction,
    ].some(faction => /infest/i.test(faction ?? ''))
    const nodeId = raw.Node
    const solNodeKey = ExportRegions[nodeId] ? nodeId : await getSolNodeKey(nodeId)
    const region = solNodeKey ? ExportRegions[solNodeKey] : undefined
    const short = region ? regionToShort(region, dict_zh) : undefined
    const locTag = raw.LocTag ?? ''

    drafts.push({
      id: raw._id?.$oid ?? raw._id?.$id ?? raw.Node,
      planet: short?.system ?? '',
      node: short?.name ?? '',
      systemIndex: region?.systemIndex ?? Number.MAX_SAFE_INTEGER,
      locTag,
      campaign: locTag
        ? (dict_zh[locTag] ?? dictZhExtra[locTag] ?? await translateLanguageString(locTag))
        : '',
      count,
      goal,
      attacker: invasionSide(raw.DefenderMissionInfo?.faction ?? raw.Faction, raw.AttackerReward),
      defender: invasionSide(raw.AttackerMissionInfo?.faction ?? raw.DefenderFaction, raw.DefenderReward),
      vsInfestation: vsInfested,
      completion: invasionProgress(count, goal, vsInfested),
    })
  }

  const groups = new Map<string, typeof drafts>()
  for (const draft of drafts) {
    const key = /InfestedInvasion/i.test(draft.locTag)
      ? `${draft.planet}\0infested`
      : `${draft.planet}\0${draft.locTag}`
    groups.set(key, [...(groups.get(key) ?? []), draft])
  }

  return {
    title: dict_zh[INVASION_TITLE_KEY] ?? dictZhExtra[INVASION_TITLE_KEY] ?? INVASION_TITLE_KEY,
    planets: [...groups.values()]
      .sort((a, b) => a[0].systemIndex - b[0].systemIndex)
      .map((list) => {
        const boss = list.filter(draft => draft.locTag === INFESTED_INVASION_BOSS_TAG)
        const ordered = [...boss, ...list.filter(draft => draft.locTag !== INFESTED_INVASION_BOSS_TAG)]
        return {
          planet: ordered[0].planet,
          title: (boss[0] ?? ordered[0]).campaign,
          completion: invasionProgress(
            list.reduce((sum, draft) => sum + draft.count, 0),
            list.reduce((sum, draft) => sum + draft.goal, 0),
            list.some(draft => draft.vsInfestation),
          ),
          invasions: ordered.map(({
            id,
            planet,
            node,
            attacker,
            defender,
            vsInfestation,
            completion,
          }) => ({
            id,
            planet,
            node,
            attacker,
            defender,
            vsInfestation,
            completion,
          })),
        }
      }),
  }
}

export async function getInvasionsFrom(snapshot?: {
  raw?: unknown
  invasionsRaw?: RawInvasion[]
}): Promise<WarframeResult<InvasionBoard>> {
  if (!snapshot?.raw) {
    return failure('common.fetchFailed', true)
  }

  const data = await adaptInvasions(snapshot.invasionsRaw ?? [])
  if (data.planets.length === 0) {
    return failure('invasion.unavailable')
  }

  return { ok: true, data }
}

export async function getInvasions(): Promise<WarframeResult<InvasionBoard>> {
  try {
    return await getInvasionsFrom(await globalWorldState.get())
  }
  catch {
    return failure('common.fetchFailed', true)
  }
}
