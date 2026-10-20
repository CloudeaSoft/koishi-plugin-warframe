import type {
  AlertBoard,
  AlertInfo,
  WarframeResult,
} from '../../types'

import {
  dict_zh,
  ExportMissionTypes,
  ExportRegions,
} from 'warframe-public-export-plus'

import { dictZhExtra } from '../../assets/index'
import { globalWorldState } from '../../data/wf/globalWorldState'
import { translateAlertText } from '../../infrastructure/wf/alert-adapter'
import { resolveExportItemNameZh } from '../../infrastructure/wf/bounty-adapter'
import { regionToShort } from '../../infrastructure/wf/wf-export-adapter'
import { getMissionTypeKey, getSolNodeKey } from '../../infrastructure/wf/wfcd-adapter'
import { failure } from '../../types/warframe-result'
import { msToHumanReadable } from '../../utils'

const ALERT_TITLE_KEY = '/Lotus/Language/Menu/AlertPopup_Alert'
const ALERT_NIGHTMARE_KEY = '/Lotus/Language/Menu/NightmareModeName'

export async function adaptAlerts(
  alerts: readonly {
    expiry?: Date
    description?: string
    mission?: {
      description?: string
      node?: string
      nodeKey?: string
      type?: string
      typeKey?: string
      minEnemyLevel?: number
      maxEnemyLevel?: number
      nightmare?: boolean
      reward?: {
        items?: string[]
        countedItems?: Array<{ uniqueName?: string, type?: string, key?: string, count?: number }>
        credits?: number
      }
    }
  }[] = [],
  now: number = Date.now(),
): Promise<AlertBoard> {
  const adapted: AlertInfo[] = []
  for (const raw of alerts) {
    const expiry = raw.expiry?.getTime() ?? 0
    if (expiry <= now) {
      continue
    }

    const mission = raw.mission ?? {}
    const typeKey = mission.typeKey || mission.type || ''
    const receivedType = await getMissionTypeKey(typeKey)
    const missionType = ExportMissionTypes[typeKey as keyof typeof ExportMissionTypes] ?? ExportMissionTypes[receivedType]
    const nodeKey = mission.nodeKey || mission.node || ''
    const solNodeKey = await getSolNodeKey(nodeKey)
    const region = ExportRegions[nodeKey] ?? ExportRegions[solNodeKey]
    const short = region
      ? regionToShort(region, dict_zh)
      : {
          name: await translateAlertText(nodeKey),
          system: '',
          type: '',
          faction: '',
          minLevel: 0,
          maxLevel: 0,
        }

    const reward = mission.reward
    const rewards: AlertInfo['rewards'] = []
    // New parser versions mirror legacy items in countedItems with uniqueName.
    const mirroredItems = (reward?.countedItems ?? [])
      .filter(item => item.uniqueName && item.count === 1)
      .map(item => [item.uniqueName, item.key, item.type])
    for (const item of reward?.items ?? []) {
      const mirrored = mirroredItems.findIndex(names => names.includes(item))
      if (mirrored >= 0) {
        mirroredItems.splice(mirrored, 1)
        continue
      }
      rewards.push({
        name: await translateAlertText(item),
        count: 1,
      })
    }
    for (const item of reward?.countedItems ?? []) {
      const source = item.uniqueName || item.key || item.type || ''
      if (!source) {
        continue
      }
      const name = await translateAlertText(source)
      rewards.push({
        name: name === source ? await translateAlertText(item.key || item.type || source) : name,
        count: item.count ?? 1,
      })
    }
    if (reward?.credits && reward.credits > 0) {
      rewards.push({
        name: resolveExportItemNameZh(`/${reward.credits}Credits`),
        count: 1,
      })
    }

    const nightmare = mission.nightmare
      ? dict_zh[ALERT_NIGHTMARE_KEY] ?? dictZhExtra[ALERT_NIGHTMARE_KEY]
      : undefined

    adapted.push({
      description: await translateAlertText(raw.description || mission.description || ''),
      type: dict_zh[missionType?.name ?? '']
        ?? await translateAlertText(typeKey),
      node: {
        ...short,
        minLevel: mission.minEnemyLevel ?? 0,
        maxLevel: mission.maxEnemyLevel ?? 0,
      },
      rewards,
      remaining: msToHumanReadable(expiry - now),
      expiry,
      ...(nightmare ? { nightmare } : {}),
    })
  }

  return {
    title: dict_zh[ALERT_TITLE_KEY] ?? dictZhExtra[ALERT_TITLE_KEY] ?? ALERT_TITLE_KEY,
    alerts: adapted,
  }
}

export async function getAlerts(): Promise<WarframeResult<AlertBoard>> {
  try {
    const { raw } = await globalWorldState.get()
    if (!raw) {
      return failure('common.fetchFailed', true)
    }

    const data = await adaptAlerts(raw.alerts ?? [])
    if (data.alerts.length === 0) {
      return failure('alert.unavailable')
    }

    return { ok: true, data }
  }
  catch {
    return failure('common.fetchFailed', true)
  }
}
