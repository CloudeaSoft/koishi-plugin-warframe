import type { CodaBatch, LichReport, LichWeaponFamily, RawLichOffers } from '../../types/wf/lich-offerings'
import { fetchAsyncData } from '../../utils/http'

interface TrackerResponse {
  updatedAt?: string
  offers?: RawLichOffers
  batches?: Partial<Record<CodaBatch, RawLichOffers>>
}

export async function fetchTrackerOffers(family: LichWeaponFamily, batch?: CodaBatch): Promise<LichReport | undefined> {
  const tracker = await fetchAsyncData<TrackerResponse>(`https://warframetr.com/api/warframe/${family}`)
  const offers = batch ? tracker?.batches?.[batch] : tracker?.offers
  if (offers)
    return { offers, updatedAt: tracker?.updatedAt }
}
