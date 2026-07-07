import { dict_zh, ExportRegions } from 'warframe-public-export-plus'
import { getWorldState } from '../../infrastructure/wf/wf-api'
import { regionToShort } from '../../infrastructure/wf/wf-export-adapter'
import {
  fissureTierName,
  fissureTierNumToNumber,
  getSolNodeKey,
} from '../../infrastructure/wf/wfcd-adapter'
import { createAsyncCache } from '../../utils'

export const globalWorldState = createAsyncCache(async () => {
  const worldState = await getWorldState()
  const fissures: Fissure[] = []
  const rjFissures: Fissure[] = []
  const spFissures: Fissure[] = []
  for (const fissure of worldState.fissures) {
    const nodeKey = await getSolNodeKey(fissure.nodeKey)
    const tierName
      = fissure.tierNum in fissureTierName
        ? dict_zh[
          fissureTierName[fissure.tierNum as keyof typeof fissureTierName]
        ]
        : fissure.tierNum
    const obj: Fissure = {
      category: fissure.isStorm
        ? 'rj-fissures'
        : fissure.isHard
          ? 'sp-fissures'
          : 'fissures',
      hard: fissure.isHard,
      activation: fissure.activation?.getTime() ?? 0,
      expiry: fissure.expiry?.getTime() ?? 0,
      node: regionToShort(ExportRegions[nodeKey], dict_zh),
      tier: String(tierName),
      tierNum: fissureTierNumToNumber(fissure.tierNum),
    }

    if (fissure.isStorm) {
      rjFissures.push(obj)
    }
    else if (fissure.isHard) {
      spFissures.push(obj)
    }
    else {
      fissures.push(obj)
    }
  }

  fissures.sort((a, b) => a.tierNum - b.tierNum)
  spFissures.sort((a, b) => a.tierNum - b.tierNum)
  rjFissures.sort((a, b) => a.tierNum - b.tierNum)
  return { raw: worldState, fissures, spFissures, rjFissures }
}, 120_000)
