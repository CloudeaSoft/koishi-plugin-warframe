import type {
  ArchiMedea,
  ArchiMedeaDebuff,
  ArchiMedeaMission,
  ArchonHunt,
  ArchonHuntMissions,
  WarframeResult,
} from '../../types'

import {
  dict_zh,
  ExportMissionTypes,
  ExportRegions,
} from 'warframe-public-export-plus'

import {
  dictEnExtra,
  dictZhExtra,
} from '../../assets/index'
import {
  getArchonHuntEnemyLevels,
  getArchonHuntModeName,
} from '../../data/wf/archonHunt'
import { globalWorldState } from '../../data/wf/globalWorldState'
import { regionToShort } from '../../infrastructure/wf/wf-export-adapter'
import {
  getMissionTypeKey,
  getSolNodeKey,
} from '../../infrastructure/wf/wfcd-adapter'
import { failure } from '../../types/warframe-result'
import { removeSpace } from '../../utils'

export async function adaptArchonHunt(source: {
  boss: string
  missions?: Array<{
    type: string
    node?: string
    nodeKey: string
  }>
}): Promise<ArchonHunt> {
  const name = dict_zh[
    `/Lotus/Language/Narmer/${removeSpace(source.boss)}`
  ] ?? source.boss

  const missions = await Promise.all(
    (source.missions ?? []).map(async (mission, index): Promise<ArchonHuntMissions> => {
      const receivedType = await getMissionTypeKey(mission.type)
      const type = dict_zh[ExportMissionTypes[receivedType]?.name ?? ''] ?? mission.type
      const solNodeKey = await getSolNodeKey(mission.nodeKey)
      const region = solNodeKey ? ExportRegions[solNodeKey] : undefined
      const levels = getArchonHuntEnemyLevels(index)

      const node = region
        ? regionToShort(region, dict_zh)
        : {
            name: mission.node ?? mission.nodeKey,
            system: '',
            type: '',
            faction: '',
            minLevel: 0,
            maxLevel: 0,
          }

      return {
        type,
        node: {
          ...node,
          minLevel: levels.minLevel,
          maxLevel: levels.maxLevel,
        },
      }
    }),
  )

  return {
    modeName: getArchonHuntModeName(),
    name,
    missions,
  }
}

export async function getWeekly(): Promise<WarframeResult<{
  archonHunt: ArchonHunt
  deepArchimedea: ArchiMedea
  temporalArchimedea: ArchiMedea
}>> {
  const { raw: worldState } = await globalWorldState.get()
  if (!worldState) {
    return failure('common.fetchFailed', true)
  }

  const archon = await adaptArchonHunt(worldState.archonHunt)

  const stringToDebuff = (
    key: string,
    name: string,
    prefix: string,
  ): ArchiMedeaDebuff => {
    const keyToName = dictZhExtra[`${prefix}${key}`]

    if (!keyToName) {
      for (const transKey in dictEnExtra) {
        if (dictEnExtra[transKey] === name) {
          return {
            name: dictZhExtra[transKey],
            desc: dictZhExtra[`${transKey}_Desc`],
          }
        }
      }
    }

    const riskDesc
      = dictZhExtra[`${prefix}${key}_Desc`]
    return {
      name: keyToName,
      desc: riskDesc,
    }
  }

  const deepArchim = worldState.archimedeas[0]
  const deepArchimMissions = await Promise.all(
    deepArchim.missions.map(async (m): Promise<ArchiMedeaMission> => {
      const receivedType = await getMissionTypeKey(m.missionType)
      const type
        = dict_zh[ExportMissionTypes[receivedType]?.name ?? ''] ?? m.missionType
      const deviation = stringToDebuff(
        m.deviation.key,
        m.deviation.name,
        '/Lotus/Language/Conquest/MissionVariant_LabConquest_',
      )
      const risks = m.risks.map(r =>
        stringToDebuff(r.key, r.name, '/Lotus/Language/Conquest/Condition_'),
      )

      return {
        type,
        deviation,
        risks,
      }
    }),
  )
  const deepArchimPersonalModifier = deepArchim.personalModifiers.map(p =>
    stringToDebuff(p.key, p.name, '/Lotus/Language/Conquest/PersonalMod_'),
  )
  const deepArchimRes: ArchiMedea = {
    name: '深层科研',
    missions: deepArchimMissions,
    peronal: deepArchimPersonalModifier,
  }

  const temporalArchim = worldState.archimedeas[1]
  const temporalArchimMissions = await Promise.all(
    temporalArchim.missions.map(async (m): Promise<ArchiMedeaMission> => {
      const receivedType = await getMissionTypeKey(m.missionType)
      const type
        = dict_zh[ExportMissionTypes[receivedType]?.name ?? ''] ?? receivedType
      const deviation = stringToDebuff(
        m.deviation.key,
        m.deviation.name,
        '/Lotus/Language/Conquest/MissionVariant_HexConquest_',
      )
      const risks = m.risks.map(r =>
        stringToDebuff(r.key, r.name, '/Lotus/Language/Conquest/Condition_'),
      )

      return {
        type,
        deviation,
        risks,
      }
    }),
  )
  const temporalArchimPersonalModifier = temporalArchim.personalModifiers.map(
    p =>
      stringToDebuff(p.key, p.name, '/Lotus/Language/Conquest/PersonalMod_'),
  )
  const temporalArchimRes: ArchiMedea = {
    name: '时光科研',
    missions: temporalArchimMissions,
    peronal: temporalArchimPersonalModifier,
  }

  return {
    ok: true,
    data: {
      archonHunt: archon,
      deepArchimedea: deepArchimRes,
      temporalArchimedea: temporalArchimRes,
    },
  }
}
