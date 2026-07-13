import type { RivenWeaponItem } from '../types/miscs/lab'
import type { ServiceResult } from '../types/result'
import { globalHotRivenWeapons } from '../data/miscs/lab'

export async function getHotRivenWeapons(): Promise<ServiceResult<RivenWeaponItem[]>> {
  try {
    const result = await globalHotRivenWeapons.get()
    if (!result || result.length === 0) {
      return { ok: false, message: '暂无热门紫卡数据' }
    }

    return { ok: true, data: result }
  }
  catch {
    return { ok: false, message: '获取热门紫卡数据失败' }
  }
}
