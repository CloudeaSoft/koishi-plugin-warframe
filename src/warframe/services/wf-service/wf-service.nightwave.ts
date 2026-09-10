import type {
  NightwaveBoard,
  RawSeasonInfo,
  WarframeResult,
} from '../../types'

import { globalWorldState } from '../../data/wf/globalWorldState'
import { adaptNightwave } from '../../infrastructure/wf/nightwave-adapter'
import { failure } from '../../types/warframe-result'

export function resolveNightwave(
  raw: RawSeasonInfo | undefined,
  now: number = Date.now(),
): WarframeResult<NightwaveBoard> {
  if (!raw) {
    return failure('nightwave.unavailable')
  }

  return { ok: true, data: adaptNightwave(raw, now) }
}

export async function getNightwave(): Promise<WarframeResult<NightwaveBoard>> {
  try {
    const { seasonInfoRaw } = await globalWorldState.get()
    return resolveNightwave(seasonInfoRaw)
  }
  catch {
    return failure('common.fetchFailed', true)
  }
}
