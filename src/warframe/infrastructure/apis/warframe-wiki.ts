import type { CodaBatch, LichWeaponFamily, RawLichOffers } from '../../types/wf/lich-offerings'
import { fetchAsyncData } from '../../utils/http'

interface WikiRevision { revid: number, timestamp: string, slots?: { main?: { content?: string } } }
interface WikiResponse { query?: { pages?: { revisions?: WikiRevision[] }[] } }
interface WikiParseResponse { parse?: { revid: number, wikitext?: { '*'?: string } } }
export interface WikiOfferRevision {
  revid: number
  offers: RawLichOffers
}

const wikiTitles = { tenet: 'Tenet Weapons', coda: 'Coda Weapons' }

function readWikiTable(content: string, batch?: CodaBatch): RawLichOffers {
  const heading = batch ? `Weapon (Batch ${batch})` : 'Weapon'
  const table = [...content.matchAll(/<table\b[^>]*>[\s\S]*?<\/table>/gi)]
    .find(([table]) => table.includes(`<th>${heading}</th>`))?.[0] ?? ''
  const offers: RawLichOffers = {}
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

export async function fetchWikiBaseline(family: LichWeaponFamily, start: number, batch?: CodaBatch): Promise<WikiOfferRevision | undefined> {
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

export async function fetchWikiOffers(family: LichWeaponFamily, batch?: CodaBatch): Promise<WikiOfferRevision | undefined> {
  const { parse } = await wikiRequest<WikiParseResponse>({ action: 'parse', page: wikiTitles[family], prop: 'wikitext|revid' }) ?? {}
  const content = parse?.wikitext?.['*']
  if (!parse || !Number.isSafeInteger(parse.revid) || parse.revid <= 0 || typeof content !== 'string')
    return

  return { revid: parse.revid, offers: readWikiTable(content, batch) }
}

// action=parse omits edit time. Pin the metadata lookup to the same revision.
export async function fetchWikiEditTime(revid: number): Promise<string | undefined> {
  const revision = await wikiRevision({ revids: String(revid), rvprop: 'ids|timestamp' })
  if (revision?.revid === revid)
    return revision.timestamp
}
