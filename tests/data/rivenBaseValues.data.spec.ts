import { expect } from 'chai'
import { rivenAttrValues } from '../../src/warframe/assets/index'
import {
  buildRivenAttrValueDict,
  rivenAttrValueDict,
} from '../../src/warframe/data/wf/rivenBaseValues'

const fixture = {
  Rifle: {
    'Ammo Maximum': 49.95,
    'Cold Damage': 90,
    'Critical Chance': 149.99,
    'Critical Damage': 120,
    'Damage': 165,
    'Damage to Infested': 0.45,
    'Fire Rate / Attack Speed': 60.03,
    'Impact Damage': 119.97,
    'Weapon Recoil': -90,
  },
  Melee: {
    'Critical Chance for Slide Attack': 120,
    'Finisher Damage': 119.7,
    'Slash Damage': 119.7,
  },
}

describe('buildRivenAttrValueDict', () => {
  it('returns an empty dict for an empty source', () => {
    expect(buildRivenAttrValueDict({})).to.deep.equal({})
  })

  it('keeps an empty weapon-type table', () => {
    expect(buildRivenAttrValueDict({ Rifle: {} })).to.deep.equal({ Rifle: {} })
  })

  it('does not mutate the source object', () => {
    const source = {
      Rifle: {
        'Cold Damage': 1,
        'Damage': 2,
      },
    }
    const snapshot = JSON.parse(JSON.stringify(source)) as typeof source

    const result = buildRivenAttrValueDict(source)

    expect(source).to.deep.equal(snapshot)
    expect(result).to.not.equal(source)
    expect(result.Rifle).to.not.equal(source.Rifle)
  })

  it('strips a trailing Damage suffix except for Damage, Finisher Damage, and Critical*', () => {
    const result = buildRivenAttrValueDict(fixture)

    expect(result.Rifle).to.deep.equal({
      'ammomaximum': 49.95,
      'cold': 90,
      'criticalchance': 149.99,
      'criticaldamage': 120,
      'damage': 165,
      'damagetoinfested': 0.45,
      'firerate/attackspeed': 60.03,
      'impact': 119.97,
      'weaponrecoil': -90,
    })
    expect(result.Melee).to.deep.equal({
      criticalchanceforslideattack: 120,
      finisherdamage: 119.7,
      slash: 119.7,
    })
  })

  it('keeps the later value when two source keys collapse to the same WFM key', () => {
    const result = buildRivenAttrValueDict({
      Rifle: {
        'Cold': 1,
        'Cold Damage': 2,
      },
    })

    expect(result.Rifle).to.deep.equal({ cold: 2 })
  })

  it('builds independent tables per weapon type', () => {
    const result = buildRivenAttrValueDict({
      Rifle: { 'Heat Damage': 10 },
      Shotgun: { 'Heat Damage': 20 },
    })

    expect(result.Rifle.heat).to.equal(10)
    expect(result.Shotgun.heat).to.equal(20)
  })
})

describe('rivenAttrValueDict', () => {
  it('is the bundled asset run through the builder', () => {
    expect(rivenAttrValueDict).to.deep.equal(
      buildRivenAttrValueDict(rivenAttrValues),
    )
  })

  it('indexes bundled Rifle and Melee keys with the Damage-suffix rules', () => {
    expect(rivenAttrValueDict.Rifle.cold).to.equal(90)
    expect(rivenAttrValueDict.Rifle.damage).to.equal(165)
    expect(rivenAttrValueDict.Rifle.criticaldamage).to.equal(120)
    expect(rivenAttrValueDict.Rifle.impact).to.equal(119.97)
    expect(rivenAttrValueDict.Melee.finisherdamage).to.equal(119.7)
    expect(rivenAttrValueDict.Melee.slash).to.equal(119.7)
  })
})
