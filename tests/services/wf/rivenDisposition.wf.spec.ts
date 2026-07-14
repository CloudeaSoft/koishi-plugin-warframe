import { expect } from 'chai'
import { getWeaponRivenDisposition } from '../../../src/services'

describe('getWeaponRivenDisposition Tests', () => {
  it('should find a known weapon by exact name', () => {
    const result = getWeaponRivenDisposition('Boltor')
    expect(result).to.not.equal(undefined)
    expect(result!.name).to.not.equal(undefined)
    expect(result!.calc.disposition).to.be.a('number')
  })

  it('should return undefined for a completely unknown weapon', () => {
    const result = getWeaponRivenDisposition(
      'ThisWeaponDoesNotExist12345',
    )
    expect(result).to.equal(undefined)
  })

  it('should find weapon with Prime suffix when base name miss', () => {
    const result = getWeaponRivenDisposition('Boltor Prime')
    expect(result).to.not.equal(undefined)
  })

  it('should be case-insensitive', () => {
    const lower = getWeaponRivenDisposition('boltor')
    expect(lower).to.not.equal(undefined)
  })

  it('should normalize full-width characters in input', () => {
    const result = getWeaponRivenDisposition('Ｂｏｌｔｏｒ')
    expect(result).to.not.equal(undefined)
  })
})
