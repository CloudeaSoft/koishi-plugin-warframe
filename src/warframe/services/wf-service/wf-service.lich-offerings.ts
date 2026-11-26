import type { WarframeResult } from '../../types'
import type { CodaBatch, LichBonus, LichOfferings, LichRotation, LichWeaponFamily, RawLichOffers } from '../../types/wf/lich-offerings'
import { getVendorReports } from '../../data/wf/lichOfferings'
import { codaWeapons, lichWeaponNamesZh, tenetWeapons } from '../../data/wf/lichWeapons'

const period = 4 * 86_400_000
const anchors = { tenet: Date.UTC(2015, 11, 3), coda: Date.UTC(2025, 2, 18) }

const elements = new Map(Object.entries({
  impact: '冲击',
  heat: '火焰',
  cold: '冰冻',
  electricity: '电击',
  toxin: '毒素',
  magnetic: '磁力',
  radiation: '辐射',
}))

function currentRotation(family: LichWeaponFamily): LichRotation {
  const index = Math.floor((Date.now() - anchors[family]) / period)
  const start = anchors[family] + index * period
  const batch: CodaBatch | undefined = family === 'coda' ? (index % 2 === 0 ? 'A' : 'B') : undefined
  return { family, batch, start, expiresAt: start + period, roster: batch ? codaWeapons[batch] : tenetWeapons }
}

function inRotation(timestamp: string | undefined, start: number): boolean {
  const updated = Date.parse(timestamp ?? '')
  return updated >= start && updated <= Date.now()
}

function reportedBonus(
  offer: RawLichOffers[string],
  previous: RawLichOffers[string],
  source: LichBonus['source'],
): LichBonus | undefined {
  const element = offer && elements.get(offer.damage)
  if (!element || !offer || !Number.isFinite(offer.percent) || offer.percent < 25 || offer.percent > 60)
    return
  if (previous?.percent === offer.percent && previous.damage === offer.damage)
    return
  return { element, percent: offer.percent, source, compared: !!previous }
}

async function loadOfferings(rotation: LichRotation): Promise<LichOfferings> {
  const { family, roster, start, expiresAt, batch } = rotation
  const { tracker, baseline, getWiki } = await getVendorReports(rotation)
  const primary = inRotation(tracker?.updatedAt, start) ? tracker?.offers : undefined
  const weapons = roster.map(name => ({ name, bonus: reportedBonus(primary?.[name], baseline?.offers[name], 'WarframeTR') }))

  if (weapons.some(weapon => !weapon.bonus)) {
    const wiki = await getWiki()
    if (wiki && (baseline ? wiki.revid > baseline.revid : inRotation(await wiki.getEditTime(), start))) {
      for (const weapon of weapons) {
        weapon.bonus ??= reportedBonus(wiki.offers[weapon.name], baseline?.offers[weapon.name], 'WARFRAME Wiki')
      }
    }
  }
  return { family, batch, expiresAt, weapons: weapons.map(({ name, bonus }) => ({ name: lichWeaponNamesZh.get(name) ?? name, bonus })) }
}

export async function getLichOfferings(family: LichWeaponFamily): Promise<WarframeResult<LichOfferings>> {
  let data: LichOfferings
  do {
    data = await loadOfferings(currentRotation(family))
  } while (Date.now() >= data.expiresAt)
  return { ok: true, data }
}
