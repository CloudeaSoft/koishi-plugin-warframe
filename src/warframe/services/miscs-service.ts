import type { RivenWeaponItem, WarframeResult } from '../types'
import { globalHotRivenWeapons } from '../data/miscs/lab'
import { failure } from '../types/warframe-result'

export async function getHotRivenWeapons(): Promise<WarframeResult<RivenWeaponItem[]>> {
  try {
    const result = await globalHotRivenWeapons.get()
    if (!result || result.length === 0) {
      return failure('miscs.hotRiven.noData')
    }

    return { ok: true, data: result }
  }
  catch {
    return failure('miscs.hotRiven.fetchFailed', true)
  }
}
