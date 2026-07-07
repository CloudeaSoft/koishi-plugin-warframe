import type { Relic } from 'warframe-public-export-plus';
import { expect } from 'chai';
import { getRelic } from '../src/services'

describe('getRelic Tests', function () {
  this.timeout(10000)

  it('should return error for empty input', async () => {
    const result = await getRelic('')
    expect(result).to.equal('请提供正确的遗物名称')
  })

  it('should return error for whitespace-only input', async () => {
    const result = await getRelic('   ')
    expect(result).to.equal('请提供正确的遗物名称')
  })

  it('should return error for input without a valid tier', async () => {
    const result = await getRelic('InvalidRelic')
    expect(result).to.equal('请提供正确的遗物名称')
  })

  it('should accept Chinese tier names (古纪)', async () => {
    const result = await getRelic('古纪A1')
    expect(result).to.not.be.a('string')
    expect((result as Relic).tier).to.equal('Lith')
  })

  it('should accept Chinese tier names (前纪)', async () => {
    const result = await getRelic('前纪A1')
    expect(result).to.not.be.a('string')
    expect((result as Relic).tier).to.equal('Meso')
  })

  it('should accept Chinese tier names (中纪)', async () => {
    const result = await getRelic('中纪A1')
    expect(result).to.not.be.a('string')
    expect((result as Relic).tier).to.equal('Neo')
  })

  it('should accept Chinese tier names (后纪)', async () => {
    const result = await getRelic('后纪A1')
    expect(result).to.not.be.a('string')
    expect((result as Relic).tier).to.equal('Axi')
  })

  it('should accept English tier names (Lith)', async () => {
    const result = await getRelic('LithA1')
    expect(result).to.not.be.a('string')
    expect((result as Relic).tier).to.equal('Lith')
  })

  it('should accept English tier names (Axi)', async () => {
    const result = await getRelic('AxiA1')
    expect(result).to.not.be.a('string')
    expect((result as Relic).tier).to.equal('Axi')
  })

  it('should strip trailing '遗物' suffix', async () => {
    const result1 = await getRelic('古纪A1')
    const result2 = await getRelic('古纪A1遗物')
    expect(result1).to.not.be.a('string')
    expect(result2).to.not.be.a('string')
    expect((result1 as Relic).num).to.equal((result2 as Relic).num)
  })

  it('should strip trailing 'relic' suffix (case-insensitive)', async () => {
    const result1 = await getRelic('LithA1')
    const result2 = await getRelic('LithA1relic')
    expect(result1).to.not.be.a('string')
    expect(result2).to.not.be.a('string')
    expect((result1 as Relic).num).to.equal((result2 as Relic).num)
  })

  it('should return error for valid tier but nonexistent relic', async () => {
    const result = await getRelic('古纪NONEXISTENT999')
    expect(result).to.equal('未找到对应遗物信息')
  })

  it('should return relic with items array', async () => {
    const result = await getRelic('古纪A1')
    expect(result).to.not.be.a('string')
    expect((result as Relic).items).to.be.an('array')
    expect((result as Relic).items.length).to.be.greaterThan(0)
    expect((result as Relic).tierKey).to.include('/Lotus/Language/Relics/Era_')
  })
})
