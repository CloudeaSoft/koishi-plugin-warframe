import { expect } from 'chai'
import { rivenStatFixFactor } from '../src/data/wf/rivenStatData'

describe('rivenStatFixFactor Tests', () => {
  it('should contain all four stat types', () => {
    expect(rivenStatFixFactor).to.have.property('2')
    expect(rivenStatFixFactor).to.have.property('3')
    expect(rivenStatFixFactor).to.have.property('21')
    expect(rivenStatFixFactor).to.have.property('31')
  })

  it('type '2' should have 2 buffs and 0 curses', () => {
    const f = rivenStatFixFactor['2']
    expect(f.buffCount).to.equal(2)
    expect(f.curseCount).to.equal(0)
    expect(f.buffFactor).to.equal(0.99)
    expect(f.curseFactor).to.equal(0)
  })

  it('type '3' should have 3 buffs and 0 curses', () => {
    const f = rivenStatFixFactor['3']
    expect(f.buffCount).to.equal(3)
    expect(f.curseCount).to.equal(0)
    expect(f.buffFactor).to.equal(0.75)
    expect(f.curseFactor).to.equal(0)
  })

  it('type '21' should have 2 buffs and 1 curse', () => {
    const f = rivenStatFixFactor['21']
    expect(f.buffCount).to.equal(2)
    expect(f.curseCount).to.equal(1)
    expect(f.buffFactor).to.equal(1.2375)
    expect(f.curseFactor).to.equal(-0.495)
  })

  it('type '31' should have 3 buffs and 1 curse', () => {
    const f = rivenStatFixFactor['31']
    expect(f.buffCount).to.equal(3)
    expect(f.curseCount).to.equal(1)
    expect(f.buffFactor).to.equal(0.9375)
    expect(f.curseFactor).to.equal(-0.75)
  })

  it('all curse factors should be <= 0', () => {
    for (const key in rivenStatFixFactor) {
      expect(rivenStatFixFactor[key].curseFactor).to.be.lte(0)
    }
  })

  it('all buff factors should be > 0', () => {
    for (const key in rivenStatFixFactor) {
      expect(rivenStatFixFactor[key].buffFactor).to.be.greaterThan(0)
    }
  })
})
