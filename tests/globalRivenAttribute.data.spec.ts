import type { RivenAttribute } from '../src/types/wfm'
import { expect } from 'chai'
import { globalRivenAttributeFactory } from '../src/data/wfm/globalRivenAttribute'

const fixtureAttrs: RivenAttribute[] = [
  {
    slug: 'critical_chance',
    prefix: 'Cru',
    suffix: 'Dex',
    negativeOnly: false,
    unit: 'percent',
    i18n: {
      'zh-hans': { name: '暴击率', description: '' },
      'en': { name: 'Critical Chance', description: '' },
    },
  },
  {
    slug: 'damage',
    prefix: 'Vex',
    suffix: 'Tis',
    negativeOnly: false,
    unit: 'percent',
    i18n: {
      'zh-hans': { name: '伤害', description: '' },
      'en': { name: 'Damage', description: '' },
    },
  },
]

describe('globalRivenAttributeFactory Tests', () => {
  it('should build list and dict from provided data', async () => {
    const result = await globalRivenAttributeFactory(fixtureAttrs)

    expect(result.globalRivenAttributeList).to.have.length(2)
    expect(result.globalRivenAttributeList[0].slug).to.equal(
      'critical_chance',
    )

    expect(result.globalRivenAttributeDict.critical_chance).to.not.equal(undefined)
    expect(result.globalRivenAttributeDict.damage).to.not.equal(undefined)
  })

  it('should handle empty array (returns empty structures, does not throw)', async () => {
    const result = await globalRivenAttributeFactory([])
    expect(result.globalRivenAttributeList).to.deep.equal([])
    expect(result.globalRivenAttributeDict).to.deep.equal({})
  })

  it('should handle duplicate slugs (last wins in dict)', async () => {
    const dupes: RivenAttribute[] = [
      {
        slug: 'damage',
        prefix: 'A',
        suffix: 'B',
        negativeOnly: false,
        unit: 'percent',
        i18n: {
          'zh-hans': { name: '伤害1', description: '' },
          'en': { name: 'Damage1', description: '' },
        },
      },
      {
        slug: 'damage',
        prefix: 'C',
        suffix: 'D',
        negativeOnly: false,
        unit: 'percent',
        i18n: {
          'zh-hans': { name: '伤害2', description: '' },
          'en': { name: 'Damage2', description: '' },
        },
      },
    ]
    const result = await globalRivenAttributeFactory(dupes)
    expect(result.globalRivenAttributeList).to.have.length(2)
    expect(result.globalRivenAttributeDict.damage.i18n['zh-hans'].name).to.equal(
      '伤害2',
    )
  })
})
