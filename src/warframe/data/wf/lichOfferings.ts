import type { AsyncCache, CodaBatch, LichBonus, LichWeaponFamily } from '../../types'
import { fetchLichBonuses, fetchWikiBaseline } from '../../infrastructure/wf/lich-offerings'
import { createAsyncCache } from '../../utils/cache'

const tenet = ['Tenet Ferrox', 'Tenet Grigori', 'Tenet Livia', 'Tenet Exec', 'Tenet Agendus']

// Eleanor's published batch schedule is also available on https://www.tennostats.com/coda.
// Personal rolls on that tracker do not describe the vendor's stock.
const coda = {
  A: ['Coda Hema', 'Coda Sporothrix', 'Coda Catabolyst', 'Coda Pox', 'Dual Coda Torxica', 'Coda Mire', 'Coda Motovore'],
  B: ['Coda Bassocyst', 'Coda Bubonico', 'Coda Synapse', 'Coda Tysis', 'Coda Caustacyst', 'Coda Hirudo', 'Coda Pathocyst'],
}
const period = 4 * 86_400_000
const anchors = { tenet: Date.UTC(2015, 11, 3), coda: Date.UTC(2025, 2, 18) }

interface VendorRotation {
  index: number
  roster: string[]
  batch?: CodaBatch
  expiresAt: number
  reports: AsyncCache<Map<string, LichBonus>>
}

function createRotation(family: LichWeaponFamily, index: number): VendorRotation {
  const start = anchors[family] + index * period
  const batch: CodaBatch | undefined = family === 'coda' ? (index % 2 === 0 ? 'A' : 'B') : undefined
  const roster = batch ? coda[batch] : tenet
  const baseline = createAsyncCache(async () => fetchWikiBaseline(family, start, batch), -1)
  return {
    index,
    roster,
    batch,
    expiresAt: start + period,
    reports: createAsyncCache(async () => fetchLichBonuses(family, roster, start, batch, baseline.get), 300_000),
  }
}

const rotations = new Map<LichWeaponFamily, VendorRotation>()

export function getVendorRotation(family: LichWeaponFamily): VendorRotation {
  const index = Math.floor((Date.now() - anchors[family]) / period)
  let rotation = rotations.get(family)
  if (rotation?.index !== index) {
    rotation = createRotation(family, index)
    rotations.set(family, rotation)
  }
  return rotation
}
