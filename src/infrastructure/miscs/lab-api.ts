import type { RivenWeaponItem, RivenWeaponResponse } from '../../types/miscs/lab'
import { fetchAsyncData } from '../../utils'

export async function getHotRivenWeapons(num: number = 30): Promise<RivenWeaponItem[] | undefined> {
  const response = await fetchAsyncData<RivenWeaponResponse>(
    `https://lab.webutilitykit.com/api/RivenTracker/hot-weapons?limit=${num}&sortBy=price`,
  )

  return response?.data
}
