import type { CodaBatch, LichBonus, LichWeaponFamily } from '../../types'
import { fetchAsyncData } from '../../utils/http'

interface RawOffer { percent: number, damage: string }
interface Tracker {
  updatedAt?: string
  offers?: Record<string, RawOffer>
  batches?: Partial<Record<CodaBatch, Record<string, RawOffer>>>
}
interface WikiRevision { revid: number, timestamp: string, slots?: { main?: { content?: string } } }
interface WikiResponse { query?: { pages?: { revisions?: WikiRevision[] }[] } }
interface WikiParseResponse { parse?: { revid: number, wikitext?: { '*'?: string } } }
interface WikiBaseline { revid: number, offers: Record<string, RawOffer> }

const wikiTitles = { tenet: 'Tenet Weapons', coda: 'Coda Weapons' }

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

async function wikiRequest<T>(params: Record<string, string>): Promise<T | undefined> {
  return fetchAsyncData<T>(
    `https://wiki.warframe.com/api.php?${new URLSearchParams({ ...params, format: 'json' })}`,
    'GET',
    'koishi-plugin-warframe (https://github.com/CloudeaSoft/koishi-plugin-warframe)',
  )
}

async function wikiRevision(params: Record<string, string>): Promise<WikiRevision | undefined> {
  const wiki = await wikiRequest<WikiResponse>({ action: 'query', prop: 'revisions', formatversion: '2', ...params })
  return wiki?.query?.pages?.[0]?.revisions?.[0]
}

export async function fetchWikiBaseline(family: LichWeaponFamily, start: number, batch?: CodaBatch): Promise<WikiBaseline | undefined> {
  const revision = await wikiRevision({
    titles: wikiTitles[family],
    rvstart: new Date(start - 1000).toISOString(),
    rvprop: 'ids|timestamp|content',
    rvslots: 'main',
  })
  const content = revision?.slots?.main?.content
  if (revision && Number.isSafeInteger(revision.revid) && revision.revid > 0 && Date.parse(revision.timestamp) < start && typeof content === 'string')
    return { revid: revision.revid, offers: readWikiTable(content, batch) }
}

function isCurrent(timestamp: string | undefined, start: number): boolean {
  const updated = Date.parse(timestamp ?? '')
  return updated >= start && updated <= Date.now()
}

async function fetchCurrentWikiOffers(family: LichWeaponFamily, start: number, batch: CodaBatch | undefined, baseline?: WikiBaseline): Promise<Record<string, RawOffer> | undefined> {
  const { parse } = await wikiRequest<WikiParseResponse>({ action: 'parse', page: wikiTitles[family], prop: 'wikitext|revid' }) ?? {}
  const content = parse?.wikitext?.['*']
  if (!parse || !Number.isSafeInteger(parse.revid) || parse.revid <= 0 || typeof content !== 'string')
    return

  // The baseline is the last revision before reset. An older cached parse cannot supply current rolls.
  if (baseline) {
    if (parse.revid <= baseline.revid)
      return
  }
  else {
    // Parse has no edit timestamp. Look up this exact revision if history was unavailable.
    const revision = await wikiRevision({ revids: String(parse.revid), rvprop: 'ids|timestamp' })
    if (revision?.revid !== parse.revid || !isCurrent(revision.timestamp, start))
      return
  }
  return readWikiTable(content, batch)
}

export async function fetchLichBonuses(
  family: LichWeaponFamily,
  roster: string[],
  start: number,
  batch: CodaBatch | undefined,
  loadBaseline: () => Promise<WikiBaseline | undefined>,
): Promise<Map<string, LichBonus>> {
  const [tracker, baseline] = await Promise.all([
    fetchAsyncData<Tracker>(`https://warframetr.com/api/warframe/${family}`),
    loadBaseline(),
  ])
  const bonuses = new Map<string, LichBonus>()
  function addReports(offers: Record<string, RawOffer> | undefined, source: LichBonus['source']): void {
    for (const name of roster) {
      const offer = offers?.[name]
      const element = offer && elements.get(offer.damage)
      if (bonuses.has(name) || !offer || !element || !Number.isFinite(offer.percent) || offer.percent < 25 || offer.percent > 60)
        continue
      const old = baseline?.offers[name]
      if (old?.percent === offer.percent && old.damage === offer.damage)
        continue
      bonuses.set(name, { element, percent: offer.percent, source, compared: !!old })
    }
  }

  if (tracker && isCurrent(tracker.updatedAt, start))
    addReports(batch ? tracker.batches?.[batch] : tracker.offers, 'WarframeTR')
  if (bonuses.size < roster.length) {
    addReports(await fetchCurrentWikiOffers(family, start, batch, baseline), 'WARFRAME Wiki')
  }
  return bonuses
}
