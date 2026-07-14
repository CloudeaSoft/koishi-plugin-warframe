import type { RivenWeaponItem } from '../types/miscs/lab'
import type { ServiceResult } from '../types/result'
import { globalHotRivenWeapons } from '../data/miscs/lab'

export async function getHotRivenWeapons(): Promise<ServiceResult<RivenWeaponItem[]>> {
  try {
    const result = await globalHotRivenWeapons.get()
    if (!result || result.length === 0) {
      return { ok: false, message: 'miscs.hotRiven.noData' }
    }

    return { ok: true, data: result }
  }
  catch {
    return { ok: false, message: 'miscs.hotRiven.fetchFailed' }
  }
}
