import type { IWeapon } from 'warframe-public-export-plus'
import type { RivenWeaponDisposition } from '../../src/warframe/types'
import { expect } from 'chai'
import {
  buildWeaponRivenDispositionDict,
  weaponRivenDispositionDict,
} from '../../src/warframe/data/wf/rivenDisposition'
import { normalizeName } from '../../src/warframe/utils'

type CalcWeapon = RivenWeaponDisposition['calc']

function calc(
  name: string,
  extras: Partial<CalcWeapon> = {},
): CalcWeapon {
  return {
    disposition: 1,
    name,
    texture: 'tex',
    riventype: 'Rifle',
    ...extras,
  }
}

function weapon(name: string): IWeapon {
  return { name } as IWeapon
}

describe('buildWeaponRivenDispositionDict', () => {
  it('returns an empty dict for an empty calc list', () => {
    expect(buildWeaponRivenDispositionDict([], {
      a: weapon('/Lotus/Weapons/Tenno/Boltor'),
    }, {
      '/Lotus/Weapons/Tenno/Boltor': 'Boltor',
    }, {
      '/Lotus/Weapons/Tenno/Boltor': '波尔托',
    })).to.deep.equal({})
  })

  it('skips calc weapons that match no export weapon', () => {
    const result = buildWeaponRivenDispositionDict(
      [calc('MISSING')],
      { a: weapon('/Lotus/Weapons/Tenno/Boltor') },
      { '/Lotus/Weapons/Tenno/Boltor': 'Boltor' },
      { '/Lotus/Weapons/Tenno/Boltor': '波尔托' },
    )

    expect(result).to.deep.equal({})
  })

  it('does not mutate the source tables', () => {
    const calcWeapons = [calc('BOLTOR')]
    const exportWeapons = { a: weapon('/Lotus/Weapons/Tenno/Boltor') }
    const dictEn = { '/Lotus/Weapons/Tenno/Boltor': 'Boltor' }
    const dictZh = { '/Lotus/Weapons/Tenno/Boltor': '波尔托' }
    const source = { calcWeapons, exportWeapons, dictEn, dictZh }
    const snapshot = JSON.parse(JSON.stringify(source))

    const result = buildWeaponRivenDispositionDict(
      calcWeapons,
      exportWeapons,
      dictEn,
      dictZh,
    )

    expect(source).to.deep.equal(snapshot)
    expect(result.boltor.weapon).to.equal(exportWeapons.a)
    expect(result.boltor.calc).to.equal(calcWeapons[0])
  })

  it('matches the uniqueName tail before the English dictionary name', () => {
    const first = weapon('/Lotus/Weapons/Tenno/Foo')
    const second = weapon('/Lotus/Weapons/Grineer/Bar')
    const result = buildWeaponRivenDispositionDict(
      [calc('FOO')],
      {
        first,
        second,
      },
      {
        '/Lotus/Weapons/Tenno/Foo': 'Not Foo',
        '/Lotus/Weapons/Grineer/Bar': 'Foo',
      },
      {
        '/Lotus/Weapons/Tenno/Foo': '甲',
        '/Lotus/Weapons/Grineer/Bar': '乙',
      },
    )

    expect(result.notfoo.weapon).to.equal(first)
    expect(result.甲.weapon).to.equal(first)
    expect(result.foo).to.equal(undefined)
    expect(result.乙).to.equal(undefined)
  })

  it('falls back to the English dictionary when the uniqueName tail differs', () => {
    const ack = weapon('/Lotus/Weapons/Clan/AckAndBrunt')
    const result = buildWeaponRivenDispositionDict(
      [calc('ACK & BRUNT', { riventype: 'Melee', disposition: 1.35 })],
      { ack },
      { '/Lotus/Weapons/Clan/AckAndBrunt': 'Ack & Brunt' },
      { '/Lotus/Weapons/Clan/AckAndBrunt': 'Ack和盾' },
    )

    expect(result['ack&brunt']).to.not.equal(undefined)
    expect(result['ack&brunt'].weapon).to.equal(ack)
    expect(result['ack&brunt'].calc.riventype).to.equal('Melee')
    expect(result['ack和盾']).to.equal(result['ack&brunt'])
    expect(result.ackandbrunt).to.equal(undefined)
  })

  it('indexes a match by both Chinese and English display names', () => {
    const boltor = weapon('/Lotus/Weapons/Tenno/Boltor')
    const result = buildWeaponRivenDispositionDict(
      [calc('BOLTOR', { disposition: 0.6 })],
      { boltor },
      { '/Lotus/Weapons/Tenno/Boltor': 'Boltor' },
      { '/Lotus/Weapons/Tenno/Boltor': '波尔托' },
    )

    expect(result.boltor.name).to.deep.equal({ en: 'Boltor', zh: '波尔托' })
    expect(result[normalizeName('波尔托')]).to.equal(result.boltor)
    expect(result.boltor.calc.disposition).to.equal(0.6)
  })

  it('keeps the later calc entry when two names collapse onto the same keys', () => {
    const boltor = weapon('/Lotus/Weapons/Tenno/Boltor')
    const result = buildWeaponRivenDispositionDict(
      [
        calc('BOLTOR', { disposition: 0.5 }),
        calc('boltor', { disposition: 0.9 }),
      ],
      { boltor },
      { '/Lotus/Weapons/Tenno/Boltor': 'Boltor' },
      { '/Lotus/Weapons/Tenno/Boltor': '波尔托' },
    )

    expect(result.boltor.calc.disposition).to.equal(0.9)
  })

  it('keeps the first export weapon when two uniqueName tails collide', () => {
    const first = weapon('/Lotus/Weapons/A/Boltor')
    const second = weapon('/Lotus/Weapons/B/Boltor')
    const result = buildWeaponRivenDispositionDict(
      [calc('BOLTOR')],
      { first, second },
      {
        '/Lotus/Weapons/A/Boltor': 'First',
        '/Lotus/Weapons/B/Boltor': 'Second',
      },
      {
        '/Lotus/Weapons/A/Boltor': '甲',
        '/Lotus/Weapons/B/Boltor': '乙',
      },
    )

    expect(result.first.weapon).to.equal(first)
    expect(result.second).to.equal(undefined)
  })
})

describe('weaponRivenDispositionDict', () => {
  it('indexes bundled weapons by English and Chinese names', () => {
    const boltor = weaponRivenDispositionDict.boltor
    expect(boltor).to.not.equal(undefined)
    expect(boltor.name.en).to.equal('Boltor')
    expect(weaponRivenDispositionDict[normalizeName(boltor.name.zh)]).to.equal(boltor)
    expect(boltor.calc.disposition).to.be.a('number')
  })

  it('indexes an English name whose uniqueName tail does not match', () => {
    const ack = weaponRivenDispositionDict['ack&brunt']
    expect(ack).to.not.equal(undefined)
    expect(ack.calc.name.toUpperCase()).to.equal('ACK & BRUNT')
    expect(weaponRivenDispositionDict.ackandbrunt).to.equal(undefined)
  })
})
