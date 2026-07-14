import type { ItemShort } from '../../src/types/wfm'
import { expect } from 'chai'
import { globalItemDataFactory } from '../../src/data/wfm/globalItem'

const fixtureItems: ItemShort[] = [
  {
    id: '1',
    slug: 'valkyr_prime_set',
    gameRef: '/Lotus/Weapons/Warframes/ValkyrPrime',
    thumb: 'valkyr_prime.png',
    i18n: {
      'zh-hans': { name: 'Valkyr Prime 一套', description: '' },
      'en': { name: 'Valkyr Prime Set', description: '' },
    },
  },
  {
    id: '2',
    slug: 'nikana_prime_blueprint',
    gameRef: '/Lotus/Weapons/Melee/NikanaPrime',
    thumb: 'nikana_prime.png',
    i18n: {
      'zh-hans': { name: '侍刃 Prime 蓝图', description: '' },
      'en': { name: 'Nikana Prime Blueprint', description: '' },
    },
  },
]

describe('globalItemDataFactory Tests', () => {
  it('should build all four structures from provided data', async () => {
    const result = await globalItemDataFactory(fixtureItems)

    expect(result.globalItemList).to.have.length(2)
    expect(result.globalItemList[0].slug).to.equal('valkyr_prime_set')

    expect(result.globalItemDict.valkyr_prime_set).to.not.equal(undefined)
    expect(result.globalItemDict.valkyr_prime_set.id).to.equal('1')

    expect(result.globalItemGameRefDict['/Lotus/Weapons/Warframes/ValkyrPrime']).to.not.equal(undefined)
  })

  it('should build name-to-slug dict with both zh and en names', async () => {
    const result = await globalItemDataFactory(fixtureItems)

    // en: "Valkyr Prime Set" -> normalizeName -> "valkyrprimeset"
    expect(result.globalItemNameToSlugDict.valkyrprimeset).to.equal(
      'valkyr_prime_set',
    )
    // zh-hans: "Valkyr Prime 一套" -> normalizeName -> "valkyrprime一套"
    expect(result.globalItemNameToSlugDict['valkyrprime一套']).to.equal(
      'valkyr_prime_set',
    )
    // en: "Nikana Prime Blueprint" -> "nikanaprimeblueprint"
    expect(result.globalItemNameToSlugDict.nikanaprimeblueprint).to.equal(
      'nikana_prime_blueprint',
    )
  })

  it('should return empty structures for empty array input', async () => {
    const result = await globalItemDataFactory([])
    expect(result.globalItemList).to.deep.equal([])
    expect(result.globalItemDict).to.deep.equal({})
    expect(result.globalItemNameToSlugDict).to.deep.equal({})
    expect(result.globalItemGameRefDict).to.deep.equal({})
  })

  it('should handle items missing zh-hans name', async () => {
    const items: ItemShort[] = [
      {
        id: '1',
        slug: 'test_item',
        gameRef: '/Test',
        thumb: '',
        i18n: {
          en: { name: 'Test Item', description: '' },
        },
      },
    ]
    const result = await globalItemDataFactory(items)
    expect(result.globalItemNameToSlugDict.testitem).to.equal('test_item')
    expect(Object.keys(result.globalItemNameToSlugDict)).to.have.length(1)
  })

  it('should handle items missing en name', async () => {
    const items: ItemShort[] = [
      {
        id: '1',
        slug: 'test_item',
        gameRef: '/Test',
        thumb: '',
        i18n: {
          'zh-hans': { name: '测试物品', description: '' },
        },
      },
    ]
    const result = await globalItemDataFactory(items)
    expect(result.globalItemNameToSlugDict['测试物品']).to.equal('test_item')
  })

  it('should handle empty array input', async () => {
    const result = await globalItemDataFactory([])
    expect(result.globalItemList).to.deep.equal([])
    expect(result.globalItemDict).to.deep.equal({})
  })
})
