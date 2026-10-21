import type { RivenAnalysisInput } from '../../../src/warframe/types'
import { expect } from 'chai'
import { analyzeRiven } from '../../../src/warframe/services/riven/analysis'

function card(name: string, chance: number, damage: number, rank = 8): RivenAnalysisInput {
  return { name, rank, attributes: [
    { attr: { gameRef: 'WeaponCritChanceMod' }, value: chance, prefix: '+' },
    { attr: { gameRef: 'WeaponCritDamageMod' }, value: damage, prefix: '+' },
  ] }
}

describe('automatic riven weapon version analysis', () => {
  it('selects the only family member that explains all stats', () => {
    const result = analyzeRiven(card('Boltor', 210, 168))
    expect(result.ok).to.equal(true)
    if (!result.ok) {
      throw new Error(result.error.code)
    }
    expect(result.data.disposition).to.equal(1.3)
    expect(result.data.variant?.status).to.equal('matched')
    expect(result.data.variant?.candidates).to.have.length(1)
    expect(result.data.buffs[0].percent).to.be.closeTo(0.08785, 0.0001)
  })

  it('uses the closest mean absolute deviation and labels overlapping versions as inferred', () => {
    const result = analyzeRiven(card('螺钉步枪', 178.2, 142.6))
    expect(result.ok).to.equal(true)
    if (!result.ok) {
      throw new Error(result.error.code)
    }
    expect(result.data.disposition).to.equal(1.2)
    expect(result.data.variant?.status).to.equal('inferred')
    expect(result.data.variant?.candidates).to.have.length(3)
    expect(result.data.buffs[0].percent).to.be.closeTo(0, 0.0001)
    expect(analyzeRiven(card('Boltor', 178.2, 142.6))).to.deep.equal(result)
  })

  it('detects Kitgun primary and secondary without a manual option', () => {
    for (const [chance, damage, disposition] of [[163.3, 98, 1.1], [111.4, 66.8, 0.75]]) {
      const result = analyzeRiven(card('Catchmoon', chance, damage))
      expect(result.ok).to.equal(true)
      if (!result.ok) {
        throw new Error(result.error.code)
      }
      expect(result.data.disposition).to.equal(disposition)
      expect(result.data.variant?.status).to.equal('matched')
    }
  })

  it('honors an explicit version instead of silently substituting another', () => {
    const result = analyzeRiven(card('Catchmoon', 163.3, 98), 'secondary')
    expect(result.ok).to.equal(false)
    if (!result.ok) {
      expect(result.error.code).to.equal('riven.variantUnmatched')
    }
    const selected = analyzeRiven(card('Catchmoon', 163.3, 98), 'primary')
    expect(selected.ok).to.equal(true)
    if (selected.ok) {
      expect(selected.data.variant?.status).to.equal('manual')
    }
  })

  it('does not score impossible values or unrelated weapons', () => {
    for (const input of [card('Boltor', 500, 100), card('Torid', 163.3, 98)]) {
      const result = analyzeRiven(input)
      expect(result.ok).to.equal(false)
      if (!result.ok) {
        expect(result.error.code).to.equal('riven.variantUnmatched')
      }
    }
  })

  it('normalizes rank before matching and rejects invalid ranks', () => {
    const result = analyzeRiven(card('Boltor', 23.3, 18.7, 0))
    expect(result.ok).to.equal(true)
    if (!result.ok) {
      throw new Error(result.error.code)
    }
    expect(result.data.disposition).to.equal(1.3)
    expect(result.data.buffs[0].value).to.equal(23.3)
    for (const rank of [-1, 9, 1.5, NaN]) {
      expect(analyzeRiven(card('Boltor', 210, 168, rank)).ok).to.equal(false)
    }
  })

  it('accepts rounded display values at the legal range boundary', () => {
    // 1.1 * the Boltor two-positive maximum, rounded to one decimal.
    const result = analyzeRiven(card('Boltor', 212.3, 169.9))
    expect(result.ok).to.equal(true)
  })
})
