import type { CodaBatch, LichBonus, LichWeaponFamily } from '../../types'
import { fetchAsyncData } from '../../utils/http'

interface RawOffer { percent: number, damage: string }
interface Tracker {
  updatedAt?: string
  offers?: Record<string, RawOffer>
  batches?: Partial<Record<CodaBatch, Record<string, RawOffer>>>
}
interface WikiRevision { timestamp: string, slots?: { main?: { content?: string } } }
interface WikiResponse { query?: { pages?: { revisions?: WikiRevision[] }[] } }

const elements = new Map(Object.entries({
  impact: '冲击',
  heat: '火焰',
  cold: '冰冻',
  electricity: '电击',
  toxin: '毒素',
  magnetic: '磁力',
  radiation: '辐射',
}))

function readWikiTable(content: string, batch?: CodaBatch): Record<string, RawOffer> {
  const heading = batch ? `Weapon (Batch ${batch})` : 'Weapon'
  const table = [...content.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)]
    .find(([table]) => table.includes(`<th>${heading}</th>`))?.[0] ?? ''
  const offers: Record<string, RawOffer> = {}
  // The transcluded tables use Weapon templates for Tenet and plain names for Coda.
  const row = /<td>([^<]+)<\/td>\s*<td>\s*\{\{D\|(\w+)\}\}\s*<\/td>\s*<td>\s*\{\{ValenceBonusPercentageColor\|(\d+(?:\.\d+)?)\}\}\s*<\/td>/gi
  for (const [, cell, damage, percent] of table.matchAll(row)) {
    const name = cell.trim().replace(/^\{\{Weapon\|([^}]+)\}\}$/i, '$1')
    offers[name] = { damage: damage.toLowerCase(), percent: Number(percent) }
  }
  return offers
}

async function fetchWikiRevision(family: LichWeaponFamily, before?: number): Promise<WikiRevision | undefined> {
  const title = family === 'tenet' ? 'Tenet_Weapons' : 'Coda_Weapons'
  const cutoff = before === undefined ? '' : `&rvstart=${new Date(before - 1000).toISOString()}`
  const wiki = await fetchAsyncData<WikiResponse>(
    `https://wiki.warframe.com/api.php?action=query&prop=revisions&rvprop=timestamp%7Ccontent&rvslots=main&format=json&formatversion=2&titles=${title}${cutoff}`,
    'GET',
    'koishi-plugin-warframe (https://github.com/CloudeaSoft/koishi-plugin-warframe)',
  )
  return wiki?.query?.pages?.[0]?.revisions?.[0]
}

export async function fetchLichBonuses(family: LichWeaponFamily, roster: string[], start: number, batch?: CodaBatch): Promise<Map<string, LichBonus>> {
  const [tracker, previous] = await Promise.all([
    fetchAsyncData<Tracker>(`https://warframetr.com/api/warframe/${family}`),
    fetchWikiRevision(family, start),
  ])
  // The mirror dates the whole snapshot. An unchanged row can survive multiple resets.
  const previousContent = previous?.slots?.main?.content
  const baseline = previous && typeof previousContent === 'string' && Date.parse(previous.timestamp) < start
    ? readWikiTable(previousContent, batch)
    : {}
  const bonuses = new Map<string, LichBonus>()
  function addReports(offers: Record<string, RawOffer> | undefined, source: LichBonus['source'], timestamp?: string): void {
    const updated = Date.parse(timestamp ?? '')
    if (!(updated >= start && updated <= Date.now()))
      return
    for (const name of roster) {
      const offer = offers?.[name]
      const element = offer && elements.get(offer.damage)
      if (bonuses.has(name) || !offer || !element || !Number.isFinite(offer.percent) || offer.percent < 25 || offer.percent > 60)
        continue
      const old = baseline[name]
      if (old?.percent === offer.percent && old.damage === offer.damage)
        continue
      bonuses.set(name, { element, percent: offer.percent, source, compared: !!old })
    }
  }

  addReports(batch ? tracker?.batches?.[batch] : tracker?.offers, 'WarframeTR', tracker?.updatedAt)
  if (bonuses.size < roster.length) {
    const latest = await fetchWikiRevision(family)
    const content = latest?.slots?.main?.content
    if (typeof content === 'string')
      addReports(readWikiTable(content, batch), 'WARFRAME Wiki', latest?.timestamp)
  }
  return bonuses
}
