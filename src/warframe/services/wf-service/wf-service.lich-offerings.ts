import type { LichOfferings, LichWeaponFamily } from '../../types'
import { rivenPublicExport } from '../../assets'
import { getVendorRotation } from '../../data/wf/lichOfferings'

export async function getLichOfferings(family: LichWeaponFamily): Promise<LichOfferings> {
  const rotation = getVendorRotation(family)
  const report = await rotation.reports.get()
  // A slow request can straddle the UTC reset even with a rotation-scoped cache.
  if (Date.now() >= rotation.expiresAt)
    return getLichOfferings(family)

  return {
    family,
    batch: rotation.batch,
    expiresAt: rotation.expiresAt,
    weapons: rotation.roster.map((name) => {
      const weapon = rivenPublicExport.weapons.find(weapon => weapon.name === name)
      return { name: (weapon && rivenPublicExport.weaponNamesZh[weapon.uniqueName]) ?? name, bonus: report.get(name) }
    }),
  }
}
