import type { Fissure, WarframeResult } from '../../types'

import { globalWorldState } from '../../data/wf/globalWorldState'
import { failure } from '../../types/warframe-result'

export async function getFissures(): Promise<WarframeResult<Fissure[]>> {
  const { fissures } = await globalWorldState.get()
  return fissures ? { ok: true, data: fissures } : failure('common.fetchFailed', true)
}

export async function getSteelPathFissures(): Promise<WarframeResult<Fissure[]>> {
  const { spFissures } = await globalWorldState.get()
  return spFissures ? { ok: true, data: spFissures } : failure('common.fetchFailed', true)
}

export async function getRailjackFissures(): Promise<WarframeResult<Fissure[]>> {
  const { rjFissures } = await globalWorldState.get()
  return rjFissures ? { ok: true, data: rjFissures } : failure('common.fetchFailed', true)
}
