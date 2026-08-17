import type { ItemShort } from '../../src/warframe/types/wfm'
import { expect } from 'chai'
import { globalItemDataFactory } from '../../src/warframe/data/wfm/globalItem'

const fixtureItems = [
  {
    id: '1',
    slug: 'valkyr_prime_set',
    gameRef: '/Lotus/Weapons/Warframes/ValkyrPrime',
    thumb: 'valkyr_prime.png',
    i18n: {
      'zh-hans': { name: 'Valkyr Prime 一套' },
      'en': { name: 'Valkyr Prime Set' },
    },
  },
  {
    id: '2',
    slug: 'nikana_prime_blueprint',
    gameRef: '/Lotus/Weapons/Melee/NikanaPrime',
    thumb: 'nikana_prime.png',
    i18n: {
      'zh-hans': { name: '侍刃 Prime 蓝图' },
      'en': { name: 'Nikana Prime Blueprint' },
    },
  },
] as unknown as ItemShort[]

const arcaneItems = [
  {
    id: 'arcane-energize',
    slug: 'arcane_energize',
    gameRef: '/Arcane/Energize',
    tags: ['arcane_enhancement'],
    i18n: {
      'zh-hans': { name: '赋能·充沛' },
      'en': { name: 'Arcane Energize' },
    },
  },
  {
    id: 'magus-vigor',
    slug: 'magus_vigor',
    gameRef: '/Arcane/MagusVigor',
    tags: ['arcane_enhancement'],
    i18n: {
      'zh-hans': { name: '魔导·活力' },
      'en': { name: 'Magus Vigor' },
    },
  },
  {
    id: 'molt-vigor',
    slug: 'molt_vigor',
    gameRef: '/Arcane/MoltVigor',
    tags: ['arcane_enhancement'],
    i18n: {
      'zh-hans': { name: '蜕化·活力' },
      'en': { name: 'Molt Vigor' },
    },
  },
  {
    id: 'cascadia-flare',
    slug: 'cascadia_flare',
    gameRef: '/Arcane/CascadiaFlare',
    tags: ['arcane_enhancement'],
    i18n: {
      'zh-hans': { name: '瀑流·耀炎' },
      'en': { name: 'Cascadia Flare' },
    },
  },
  {
    id: 'ordinary-item',
    slug: 'ordinary_item',
    gameRef: '/Item/Ordinary',
    tags: ['misc'],
    i18n: {
      'zh-hans': { name: '赋能·测试物品' },
      'en': { name: 'Ordinary Item' },
    },
  },
] as unknown as ItemShort[]

describe('globalItemDataFactory Tests', () => {
  it('should build all four structures from provided data', async () => {
    const result = await globalItemDataFactory(fixtureItems)

    expect(result.globalItemList).to.have.length(2)
    expect(result.globalItemList[0].slug).to.equal('valkyr_prime_set')

    expect(result.globalItemDict.valkyr_prime_set).to.not.equal(undefined)
    expect(result.globalItemDict.valkyr_prime_set.id).to.equal('1')

    expect(result.globalItemGameRefDict['/Lotus/Weapons/Warframes/ValkyrPrime']).to.not.equal(undefined)
    expect(result.globalItemWordPrefixCandidates).to.have.length(4)
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
    expect(result.globalItemWordPrefixCandidates[0]).to.include.keys(
      'item',
      'normalizedName',
      'tokens',
    )
  })

  it('indexes a unique category-free arcane shorthand', async () => {
    const result = await globalItemDataFactory(arcaneItems)

    expect(
      result.globalItemArcaneShorthandDict['充沛'].map(item => item.slug),
    ).to.deep.equal(['arcane_energize'])
  })

  it('keeps every candidate for an ambiguous arcane shorthand', async () => {
    const result = await globalItemDataFactory(arcaneItems)

    expect(
      result.globalItemArcaneShorthandDict['活力'].map(item => item.slug),
    ).to.deep.equal(['magus_vigor', 'molt_vigor'])
  })

  it('derives shorthand and suffix aliases from the display name category', async () => {
    const result = await globalItemDataFactory(arcaneItems)

    expect(
      result.globalItemArcaneShorthandDict['耀炎'].map(item => item.slug),
    ).to.deep.equal(['cascadia_flare'])
    expect(result.globalItemNameToSlugDict['耀炎瀑流']).to.equal(
      'cascadia_flare',
    )
  })

  it('does not index non-arcane items with category-like names', async () => {
    const result = await globalItemDataFactory(arcaneItems)

    expect(result.globalItemArcaneShorthandDict['测试物品']).to.equal(undefined)
  })

  it('should return empty structures for empty array input', async () => {
    const result = await globalItemDataFactory([])
    expect(result.globalItemList).to.deep.equal([])
    expect(result.globalItemDict).to.deep.equal({})
    expect(result.globalItemNameToSlugDict).to.deep.equal({})
    expect(result.globalItemGameRefDict).to.deep.equal({})
    expect(result.globalItemWordPrefixCandidates).to.deep.equal([])
    expect(result.globalItemArcaneShorthandDict).to.deep.equal({})
  })

  it('should handle items missing zh-hans name', async () => {
    const items = [
      {
        id: '1',
        slug: 'test_item',
        gameRef: '/Test',
        thumb: '',
        i18n: {
          en: { name: 'Test Item' },
        },
      },
    ] as unknown as ItemShort[]
    const result = await globalItemDataFactory(items)
    expect(result.globalItemNameToSlugDict.testitem).to.equal('test_item')
    expect(Object.keys(result.globalItemNameToSlugDict)).to.have.length(1)
    expect(result.globalItemWordPrefixCandidates).to.have.length(1)
  })

  it('should handle items missing en name', async () => {
    const items = [
      {
        id: '1',
        slug: 'test_item',
        gameRef: '/Test',
        thumb: '',
        i18n: {
          'zh-hans': { name: '测试物品' },
        },
      },
    ] as unknown as ItemShort[]
    const result = await globalItemDataFactory(items)
    expect(result.globalItemNameToSlugDict['测试物品']).to.equal('test_item')
    expect(result.globalItemWordPrefixCandidates).to.have.length(1)
  })

  it('should handle empty array input', async () => {
    const result = await globalItemDataFactory([])
    expect(result.globalItemList).to.deep.equal([])
    expect(result.globalItemDict).to.deep.equal({})
    expect(result.globalItemWordPrefixCandidates).to.deep.equal([])
  })
})
