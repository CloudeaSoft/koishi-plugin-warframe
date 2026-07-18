import type { ItemShort, Relic } from '../../../src/warframe/types'
import { expect } from 'chai'
import { overrideGlobalDucatnatorIDDict } from '../../../src/warframe/data/wfm/globalDucatnator'
import {
  globalItemDataFactory,
  overrideGlobalItemData,
} from '../../../src/warframe/data/wfm/globalItem'
import { applyRelicData } from '../../../src/warframe/services/wfm-service'
import { createAsyncCache } from '../../../src/warframe/utils'

const fixtureItems = [
  {
    id: 'known-id',
    slug: 'known_item',
    gameRef: '/Lotus/StoreItems/KnownItem',
    thumb: '',
    ducats: 45,
    i18n: {
      'zh-hans': { name: '已知物品' },
      'en': { name: 'Known Item' },
    },
  },
] as unknown as ItemShort[]

const baseRelic: Relic = {
  tier: 'Lith',
  tierKey: 'Lith',
  num: 'A1',
  items: [
    {
      name: '/Lotus/StoreItems/KnownItem',
      rarity: 'COMMON',
      quantity: 1,
    },
    {
      name: '/Lotus/StoreItems/UnknownItemBlueprint',
      rarity: 'RARE',
      quantity: 1,
    },
  ],
}

describe('applyRelicData', () => {
  beforeEach(() => {
    overrideGlobalItemData(
      createAsyncCache(async () => globalItemDataFactory(fixtureItems), -1),
    )
    overrideGlobalDucatnatorIDDict(
      createAsyncCache(async () => ({
        'known-id': {
          datetime: new Date(0),
          position_change_month: 0,
          position_change_week: 0,
          position_change_day: 0,
          plat_worth: 0,
          volume: 0,
          ducats_per_platinum: 0,
          ducats_per_platinum_wa: 0,
          item: 'known-id',
          ducats: 45,
          median: 12,
          wa_price: 0,
          id: 'known-id',
        },
      }), -1),
    )
  })

  it('keeps numeric ducats and platinum for known items', async () => {
    const result = await applyRelicData(baseRelic)
    const known = result.items.find(i => i.name === '已知物品')

    expect(known?.ducats).to.equal(45)
    expect(known?.platinum).to.equal(12)
  })

  it('uses undefined for unknown item ducats and platinum', async () => {
    const result = await applyRelicData(baseRelic)
    const unknown = result.items.find(i => i.name.includes('Unknown'))

    expect(unknown?.ducats).to.equal(undefined)
    expect(unknown?.platinum).to.equal(undefined)
  })

  it('uses undefined platinum when ducatnator data is missing', async () => {
    overrideGlobalDucatnatorIDDict(
      createAsyncCache(async () => undefined, -1),
    )

    const result = await applyRelicData(baseRelic)
    const known = result.items.find(i => i.name === '已知物品')

    expect(known?.ducats).to.equal(45)
    expect(known?.platinum).to.equal(undefined)
  })
})
