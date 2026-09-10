import type {
  BountyBoard,
  BountyLocation,
  WarframeResult,
} from '../../types'

import { globalOracleBountyCycle } from '../../data/wf/globalOracleBountyCycle'
import { globalWorldState } from '../../data/wf/globalWorldState'
import {
  adaptBountyBoard,
  adaptOracleBountyBoard,
  findRawSyndicateMission,
  oracleBountyLocations,
} from '../../infrastructure/wf/bounty-adapter'
import { failure } from '../../types/warframe-result'

export async function getBounty(
  location: BountyLocation,
): Promise<WarframeResult<BountyBoard>> {
  if (oracleBountyLocations.has(location)) {
    const cycle = await globalOracleBountyCycle.get()
    if (!cycle) {
      return failure('common.fetchFailed', true)
    }

    const board = adaptOracleBountyBoard(
      location as 'zariman' | 'cavia' | 'hex',
      cycle,
    )
    if (!board) {
      return failure('bounty.unavailable')
    }
    return { ok: true, data: board }
  }

  const { syndicateMissionsRaw } = await globalWorldState.get()
  if (!syndicateMissionsRaw) {
    return failure('common.fetchFailed', true)
  }

  const mission = findRawSyndicateMission(syndicateMissionsRaw, location)
  if (!mission) {
    return failure('common.fetchFailed', true)
  }

  const board = adaptBountyBoard(location, mission)
  if (!board) {
    return failure('bounty.unavailable')
  }

  return { ok: true, data: board }
}
