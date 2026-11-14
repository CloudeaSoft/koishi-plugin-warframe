import type { IRelic, TMissionDeck } from 'warframe-public-export-plus'
import { expect } from 'chai'
import { ExportRelics, ExportRewards } from 'warframe-public-export-plus'
import {
  buildRelicDict,
  relics,
} from '../../src/warframe/data/wf/relics'
import { normalizeName } from '../../src/warframe/utils'

function relic(
  era: IRelic['era'],
  category: string,
  rewardManifest: string,
): IRelic {
  return {
    era,
    category,
    rewardManifest,
    icon: '',
    codexSecret: false,
    description: '',
    quality: 'VPQ_BRONZE',
  }
}

const lithA1Deck: TMissionDeck = [
  [
    {
      type: '/Lotus/StoreItems/Types/Recipes/WarframeRecipes/SarynPrimeHelmetBlueprint',
      itemCount: 1,
      rarity: 'UNCOMMON',
    },
    {
      type: '/Lotus/Types/Recipes/Weapons/VectisPrimeBlueprint',
      itemCount: 2,
      rarity: 'RARE',
    },
  ],
  [
    {
      type: '/Lotus/Types/Items/ShouldIgnore',
      itemCount: 99,
      rarity: 'COMMON',
    },
  ],
]

describe('buildRelicDict', () => {
  it('returns an empty dict for an empty relic table', () => {
    expect(buildRelicDict({}, {
      m: lithA1Deck,
    })).to.deep.equal({})
  })

  it('does not mutate the source tables', () => {
    const exportRelics = { a: relic('Lith', 'A1', 'm') }
    const exportRewards = { m: lithA1Deck }
    const source = { exportRelics, exportRewards }
    const snapshot = JSON.parse(JSON.stringify(source))

    const result = buildRelicDict(exportRelics, exportRewards)

    expect(source).to.deep.equal(snapshot)
    expect(result).to.not.equal(exportRelics)
    expect(result.litha1.items).to.not.equal(lithA1Deck[0])
  })

  it('indexes by normalized era plus category', () => {
    const result = buildRelicDict({
      a: relic('Neo', 'B2', 'm'),
    }, {
      m: [[]],
    })

    expect(result[normalizeName('NeoB2')]).to.equal(result.neob2)
    expect(result.neob2.tier).to.equal('Neo')
    expect(result.neob2.num).to.equal('B2')
  })

  it('builds the era translation key from the relic era', () => {
    const result = buildRelicDict({
      lith: relic('Lith', 'A1', 'm'),
      vanguard: relic('Vanguard', 'S1', 'm'),
    }, {
      m: [[]],
    })

    expect(result.litha1.tierKey).to.equal('/Lotus/Language/Relics/Era_LITH')
    expect(result.vanguards1.tierKey).to.equal('/Lotus/Language/Relics/Era_VANGUARD')
  })

  it('maps only the first reward tier and strips StoreItems/ from types', () => {
    const result = buildRelicDict({
      a: relic('Lith', 'A1', 'm'),
    }, {
      m: lithA1Deck,
    })

    expect(result.litha1.items).to.deep.equal([
      {
        name: '/Lotus/Types/Recipes/WarframeRecipes/SarynPrimeHelmetBlueprint',
        rarity: 'UNCOMMON',
        quantity: 1,
      },
      {
        name: '/Lotus/Types/Recipes/Weapons/VectisPrimeBlueprint',
        rarity: 'RARE',
        quantity: 2,
      },
    ])
  })

  it('uses an empty items list when the reward deck is missing or empty', () => {
    const result = buildRelicDict({
      missing: relic('Meso', 'C3', 'gone'),
      emptyDeck: relic('Axi', 'D4', 'empty'),
    }, {
      empty: [],
    })

    expect(result.mesoc3.items).to.deep.equal([])
    expect(result.axid4.items).to.deep.equal([])
  })

  it('keeps the later relic when two uniqueNames collapse onto the same key', () => {
    const result = buildRelicDict({
      bronze: relic('Lith', 'A1', 'first'),
      platinum: relic('Lith', 'A1', 'second'),
    }, {
      first: [[{ type: 'first', itemCount: 1, rarity: 'COMMON' }]],
      second: [[{ type: 'second', itemCount: 1, rarity: 'RARE' }]],
    })

    expect(result.litha1.items).to.deep.equal([
      { name: 'second', rarity: 'RARE', quantity: 1 },
    ])
  })
})

describe('relics', () => {
  it('is the bundled ExportRelics table run through the builder', () => {
    expect(relics).to.deep.equal(buildRelicDict(ExportRelics, ExportRewards))
  })

  it('indexes Lith A1 with stripped reward uniqueNames', () => {
    const lithA1 = relics.litha1
    expect(lithA1).to.not.equal(undefined)
    expect(lithA1.tier).to.equal('Lith')
    expect(lithA1.num).to.equal('A1')
    expect(lithA1.tierKey).to.equal('/Lotus/Language/Relics/Era_LITH')
    expect(lithA1.items.length).to.be.greaterThan(0)
    expect(lithA1.items.every(item => !item.name.includes('StoreItems/'))).to.equal(true)
  })
})
