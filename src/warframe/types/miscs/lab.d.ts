// Union of all weapon groups found in the sample
export type WeaponGroup
  = | 'melee'
    | 'sentinel'
    | 'primary'
    | 'secondary'
    | 'archgun'
    | 'zaw'

// Union of all riven types found in the sample
export type RivenType = 'melee' | 'rifle' | 'pistol' | 'shotgun' | 'zaw'

// Single weapon riven item entry
export interface RivenWeaponItem {
  slug: string
  name_en: string
  name_zh: string
  thumb: string
  group: WeaponGroup
  rivenType: RivenType
  disposition: number
  req_mr: number
  active_count: number
  min_price: number
  bottom_price: number
  ts: string // ISO 8601 timestamp e.g. "2026-06-22T15:11:00Z"
}

// Root response structure
export interface RivenWeaponResponse {
  data: RivenWeaponItem[]
  source: string
}
