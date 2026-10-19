import type { RivenExportWeapon } from '../../src/warframe/types/wf/riven-export'
import { expect } from 'chai'
import { buildWeaponRivenDispositionDict, weaponRivenDispositionDict } from '../../src/warframe/data/wf/rivenDisposition'

const fixture: RivenExportWeapon = { uniqueName: '/Weapons/Test', name: 'Test', productCategory: 'Pistols', omegaAttenuation: 0.75, primeOmegaAttenuation: 1.1 }

describe('official weapon dispositions', () => {
  it('reads current disposition and localized names from official records', () => {
    const result = buildWeaponRivenDispositionDict([fixture], { '/Weapons/Test': '测试' }, { '/Weapons/Test': 'Pistol' })
    expect(result.test.calc.disposition).to.equal(0.75)
    expect(result.测试).to.equal(result.test)
    expect(result.test.weapon).to.equal(fixture)
  })

  it('keeps primary and secondary Kitgun dispositions separate and requires a variant', () => {
    const result = buildWeaponRivenDispositionDict([fixture], { '/Weapons/Test': '测试' }, { '/Weapons/Test': 'Kitgun' })
    expect(result.test).to.equal(undefined)
    expect(result.testprimary.calc.disposition).to.equal(1.1)
    expect(result.testsecondary.calc.disposition).to.equal(0.75)
    expect(result.测试主武器.calc.disposition).to.equal(1.1)
  })

  it('does not guess categories or accept nonfinite dispositions', () => {
    expect(buildWeaponRivenDispositionDict([fixture], {}, {})).to.deep.equal({})
    expect(buildWeaponRivenDispositionDict([{ ...fixture, omegaAttenuation: NaN }], {}, { '/Weapons/Test': 'Pistol' })).to.deep.equal({})
  })

  it('finds real weapons by official English and Chinese names', () => {
    expect(weaponRivenDispositionDict.boltor.calc.disposition).to.equal(1.3)
    expect(weaponRivenDispositionDict.螺钉步枪).to.equal(weaponRivenDispositionDict.boltor)
    expect(weaponRivenDispositionDict['ack&brunt']).not.to.equal(undefined)
    expect(weaponRivenDispositionDict.catchmoonprimary.calc.disposition).to.equal(1.1)
    expect(weaponRivenDispositionDict.catchmoonsecondary.calc.disposition).to.equal(0.75)
  })
})
