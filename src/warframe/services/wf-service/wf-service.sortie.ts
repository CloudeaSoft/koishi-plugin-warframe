import type {
  RawSortie,
  Sortie,
  SortieMission,
  WarframeResult,
} from '../../types'

import {
  dict_zh,
  ExportMissionTypes,
  ExportRegions,
} from 'warframe-public-export-plus'

import { globalWorldState } from '../../data/wf/globalWorldState'
import {
  getSortieEnemyLevels,
  getSortieModeName,
} from '../../data/wf/sortie'
import { regionToShort } from '../../infrastructure/wf/wf-export-adapter'
import {
  getMissionTypeKey,
  getSolNodeKey,
  translateSortieBoss,
  translateSortieFaction,
  translateSortieModifier,
} from '../../infrastructure/wf/wfcd-adapter'
import { failure } from '../../types/warframe-result'
import { msToHumanReadable } from '../../utils'

function mongoDateMs(value?: { $date?: { $numberLong?: string } }): number | undefined {
  const raw = value?.$date?.$numberLong
  if (!raw) {
    return undefined
  }
  const ms = Number(raw)
  return Number.isFinite(ms) ? ms : undefined
}

export async function adaptSortie(
  source: RawSortie,
  dates?: { activation?: Date, expiry?: Date },
): Promise<Sortie> {
  const expiryMs = dates?.expiry?.getTime() ?? mongoDateMs(source.Expiry) ?? 0
  const missions = await Promise.all(
    (source.Variants ?? []).map(async (variant, index): Promise<SortieMission> => {
      const missionType = variant.missionType ?? ''
      const receivedType = (await getMissionTypeKey(missionType)) || missionType
      const type = dict_zh[ExportMissionTypes[receivedType]?.name ?? ''] ?? missionType
      const nodeId = variant.node ?? ''
      const solNodeKey = (await getSolNodeKey(nodeId)) || nodeId
      const region = solNodeKey ? ExportRegions[solNodeKey] : undefined
      const levels = getSortieEnemyLevels(index)
      const node = region
        ? {
            ...regionToShort(region, dict_zh),
            minLevel: levels.minLevel,
            maxLevel: levels.maxLevel,
          }
        : {
            name: nodeId,
            system: '',
            type: '',
            faction: '',
            minLevel: levels.minLevel,
            maxLevel: levels.maxLevel,
          }

      return {
        type,
        node,
        modifier: await translateSortieModifier(variant.modifierType ?? ''),
      }
    }),
  )

  const bossKey = source.Boss ?? ''
  return {
    modeName: getSortieModeName(),
    boss: await translateSortieBoss(bossKey),
    faction: await translateSortieFaction(bossKey),
    expiry: expiryMs,
    remaining: msToHumanReadable(expiryMs - Date.now()),
    missions,
  }
}

export async function getSortieFrom(snapshot?: {
  raw?: { sortie?: { activation?: Date, expiry?: Date } }
  sortieRaw?: RawSortie
}): Promise<WarframeResult<Sortie>> {
  if (!snapshot?.raw) {
    return failure('common.fetchFailed', true)
  }

  const raw = snapshot.sortieRaw
  if (!raw) {
    return failure('sortie.unavailable')
  }

  const parsed = snapshot.raw.sortie
  const expiryMs = parsed?.expiry?.getTime() ?? mongoDateMs(raw.Expiry)
  if (expiryMs === undefined || expiryMs <= Date.now()) {
    return failure('sortie.unavailable')
  }

  return {
    ok: true,
    data: await adaptSortie(raw, {
      activation: parsed?.activation,
      expiry: parsed?.expiry,
    }),
  }
}

export async function getSortie(): Promise<WarframeResult<Sortie>> {
  try {
    return await getSortieFrom(await globalWorldState.get())
  }
  catch {
    return failure('common.fetchFailed', true)
  }
}
