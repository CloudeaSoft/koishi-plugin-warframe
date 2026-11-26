import type { WikiOfferRevision } from '../../infrastructure/apis/warframe-wiki'
import type { AsyncCache } from '../../types/cache'
import type { LichReport, LichRotation, LichWeaponFamily } from '../../types/wf/lich-offerings'
import { fetchWikiBaseline, fetchWikiEditTime, fetchWikiOffers } from '../../infrastructure/apis/warframe-wiki'
import { fetchTrackerOffers } from '../../infrastructure/apis/warframetr'
import { createAsyncCache } from '../../utils/cache'

interface CurrentWikiOffers extends WikiOfferRevision {
  getEditTime: () => Promise<string | undefined>
}

interface VendorReportCaches {
  start: number
  tracker: AsyncCache<LichReport | undefined>
  baseline: AsyncCache<WikiOfferRevision | undefined>
  wiki: AsyncCache<CurrentWikiOffers | undefined>
}

const refreshInterval = 5 * 60_000
const rotations = new Map<LichWeaponFamily, VendorReportCaches>()

function getVendorReportCaches({ family, start, batch }: LichRotation): VendorReportCaches {
  const existing = rotations.get(family)
  if (existing?.start === start)
    return existing

  const caches = {
    start,
    tracker: createAsyncCache(async () => fetchTrackerOffers(family, batch), refreshInterval),
    baseline: createAsyncCache(async () => fetchWikiBaseline(family, start, batch), -1),
    wiki: createAsyncCache(async () => {
      const revision = await fetchWikiOffers(family, batch)
      if (revision) {
        const editTime = createAsyncCache(async () => fetchWikiEditTime(revision.revid), -1)
        return { ...revision, getEditTime: editTime.get }
      }
    }, refreshInterval),
  }
  rotations.set(family, caches)
  return caches
}

export async function getVendorReports(rotation: LichRotation): Promise<{
  tracker?: LichReport
  baseline?: WikiOfferRevision
  getWiki: () => Promise<CurrentWikiOffers | undefined>
}> {
  const caches = getVendorReportCaches(rotation)
  const [tracker, baseline] = await Promise.all([caches.tracker.get(), caches.baseline.get()])
  return { tracker, baseline, getWiki: caches.wiki.get }
}
