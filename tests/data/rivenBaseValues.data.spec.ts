import { expect } from 'chai'
import { rivenPublicExport } from '../../src/warframe/assets/index'
import { rivenStatsByType } from '../../src/warframe/data/wf/rivenBaseValues'
import { adaptRivenDefinitions } from '../../src/warframe/infrastructure/wf/riven-export-adapter'

describe('official riven base values', () => {
  it('keeps all 97 spliced records, including unverified parry angle', () => {
    const spliced = Object.values(rivenStatsByType).flat().filter(s => s.spliced)
    expect(spliced.length).to.equal(97)
    expect(new Set(spliced.map(s => s.gameRef)).size).to.equal(18)
    expect(spliced.filter(s => !s.verified).map(s => s.gameRef)).to.deep.equal(['WeaponMeleeParryAngleMod', 'WeaponMeleeParryAngleMod'])
  })

  it('uses each category own official base without copying traditional elemental values', () => {
    const archgun = rivenStatsByType.Archgun
    expect(archgun.find(s => s.gameRef === 'WeaponBlastDamageMod')!.baseValue).to.be.closeTo(89.9999982, 0.0000001)
    expect(archgun.find(s => s.gameRef === 'WeaponFreezeDamageMod')!.baseValue).to.be.closeTo(119.7, 0.0000001)
    expect(archgun.find(s => s.gameRef === 'WeaponMagazineReloadHolstered')).to.equal(undefined)
  })

  it('converts percentage, multiplier, seconds and flat values separately', () => {
    const melee = rivenStatsByType.Melee
    expect(melee.find(s => s.gameRef === 'ComboDurationMod')!.baseValue).to.be.closeTo(8.10000036, 0.00000001)
    expect(melee.find(s => s.gameRef === 'WeaponMeleeRangeIncMod')!.baseValue).to.be.closeTo(1.94219991, 0.00000001)
    expect(melee.find(s => s.gameRef === 'WeaponFactionDamageOrokin')!.baseValue).to.be.closeTo(0.449999991, 0.000000001)
  })

  it('does not mutate the raw official snapshot or round its values', () => {
    const copy = JSON.stringify(rivenPublicExport.upgrades)
    adaptRivenDefinitions(rivenPublicExport.upgrades)
    expect(JSON.stringify(rivenPublicExport.upgrades)).to.equal(copy)
    expect(rivenStatsByType.Rifle.find(s => s.gameRef === 'WeaponRecoilReductionMod')!.baseValue).to.be.lessThan(0)
    expect(rivenStatsByType.Rifle.find(s => s.gameRef === 'WeaponAmmoEfficiency')!.baseValue).to.be.greaterThan(0)
  })

  it('does not infer values or eligibility for unknown attributes', () => {
    const result = adaptRivenDefinitions([{ uniqueName: '/Lotus/Upgrades/Mods/Randomized/LotusRifleRandomModRare', upgradeEntries: [
      { tag: 'FutureUnknown', upgradeValues: [{ value: 0.01, locTag: '|val|% Future Stat' }] },
      { tag: 'Invalid', upgradeValues: [{ value: NaN, locTag: '|val|% Bad' }] },
    ] }])
    expect(result.Rifle.length).to.equal(1)
    expect(result.Rifle[0].verified).to.equal(false)
    expect(result.Rifle[0].canBeBuff).to.equal(false)
    expect(result.Rifle[0].canBeCurse).to.equal(false)
  })
})
