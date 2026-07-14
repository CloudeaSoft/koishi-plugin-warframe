import { expect } from 'chai'
import { describe, it } from 'mocha'
import { getRelic } from '../src/services'

describe('getRelic Tests', function () {
  this.timeout(10000)

  it('should return error for empty input', async () => {
    const result = await getRelic('')
    expect(result.ok).to.equal(false)
    if (!result.ok) {
      expect(result.message).to.equal('relic.invalidName')
    }
  })

  it('should return error for whitespace-only input', async () => {
    const result = await getRelic('   ')
    expect(result.ok).to.equal(false)
    if (!result.ok) {
      expect(result.message).to.equal('relic.invalidName')
    }
  })

  it('should return error for input without a valid tier', async () => {
    const result = await getRelic('InvalidRelic')
    expect(result.ok).to.equal(false)
    if (!result.ok) {
      expect(result.message).to.equal('relic.invalidName')
    }
  })

  it('should accept Chinese tier names (古纪)', async () => {
    const result = await getRelic('古纪A1')
    expect(result.ok).to.equal(true)
    if (result.ok) {
      expect(result.data.tier).to.equal('Lith')
    }
  })

  it('should accept Chinese tier names (前纪)', async () => {
    const result = await getRelic('前纪A1')
    expect(result.ok).to.equal(true)
    if (result.ok) {
      expect(result.data.tier).to.equal('Meso')
    }
  })

  it('should accept Chinese tier names (中纪)', async () => {
    const result = await getRelic('中纪A1')
    expect(result.ok).to.equal(true)
    if (result.ok) {
      expect(result.data.tier).to.equal('Neo')
    }
  })

  it('should accept Chinese tier names (后纪)', async () => {
    const result = await getRelic('后纪A1')
    expect(result.ok).to.equal(true)
    if (result.ok) {
      expect(result.data.tier).to.equal('Axi')
    }
  })

  it('should accept English tier names (Lith)', async () => {
    const result = await getRelic('LithA1')
    expect(result.ok).to.equal(true)
    if (result.ok) {
      expect(result.data.tier).to.equal('Lith')
    }
  })

  it('should accept English tier names (Axi)', async () => {
    const result = await getRelic('AxiA1')
    expect(result.ok).to.equal(true)
    if (result.ok) {
      expect(result.data.tier).to.equal('Axi')
    }
  })

  it('should strip trailing "遗物" suffix', async () => {
    const result1 = await getRelic('古纪A1')
    const result2 = await getRelic('古纪A1遗物')
    expect(result1.ok).to.equal(true)
    expect(result2.ok).to.equal(true)
    if (result1.ok && result2.ok) {
      expect(result1.data.num).to.equal(result2.data.num)
    }
  })

  it('should strip trailing "relic" suffix (case-insensitive)', async () => {
    const result1 = await getRelic('LithA1')
    const result2 = await getRelic('LithA1relic')
    expect(result1.ok).to.equal(true)
    expect(result2.ok).to.equal(true)
    if (result1.ok && result2.ok) {
      expect(result1.data.num).to.equal(result2.data.num)
    }
  })

  it('should return error for valid tier but nonexistent relic', async () => {
    const result = await getRelic('古纪NONEXISTENT999')
    expect(result.ok).to.equal(false)
    if (!result.ok) {
      expect(result.message).to.equal('relic.notFound')
    }
  })

  it('should return relic with items array', async () => {
    const result = await getRelic('古纪A1')
    expect(result.ok).to.equal(true)
    if (result.ok) {
      expect(result.data.items).to.be.an('array')
      expect(result.data.items.length).to.be.greaterThan(0)
      expect(result.data.tierKey).to.include('/Lotus/Language/Relics/Era_')
    }
  })
})
