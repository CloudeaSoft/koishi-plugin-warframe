import type { ItemShort, RivenItem } from '../../../src/warframe/types'
import { expect } from 'chai'
import { globalItemData, globalItemDataFactory, overrideGlobalItemData } from '../../../src/warframe/data/wfm/globalItem'
import { globalRivenAttribute, overrideGlobalRivenAttribute } from '../../../src/warframe/data/wfm/globalRivenAttribute'
import { globalRivenItemData, globalRivenItemFactory, overrideGlobalRivenItemData } from '../../../src/warframe/data/wfm/globalRivenItem'
import { wfmClient } from '../../../src/warframe/infrastructure/wfm-client'
import { getItemOrders, getRivenOrders } from '../../../src/warframe/services/wfm-service'
import { matchWFMItem } from '../../../src/warframe/services/wfm-service/wfm-service.item-matcher'
import { findRivenItemByName } from '../../../src/warframe/services/wfm-service/wfm-service.riven-item-matcher'
import { createAsyncCache } from '../../../src/warframe/utils'
import testItems from '../../assets/test-items.json'
import testRivenItems from '../../assets/test-riven-items.json'

describe('chinese market item search', () => {
  const originalItems = globalItemData
  const originalRivens = globalRivenItemData
  const originalAttributes = globalRivenAttribute
  const originalOrders = wfmClient.orders.listByItem
  const originalStatistics = wfmClient.items.getStatistics
  const originalRivenOrders = wfmClient.rivens.getOrders
  const requests: string[] = []
  let rivens: RivenItem[] = []

  function setNames(names: [string, string][]): void {
    const items = names.map(([slug, name]) => ({
      ...testItems.data[0],
      slug,
      i18n: { 'zh-hans': { name }, 'en': { name: slug } },
    })) as ItemShort[]
    rivens = names.map(([slug, name]) => ({
      ...testRivenItems.data[0],
      slug,
      i18n: { 'zh-hans': { name }, 'en': { name: slug } },
    })) as RivenItem[]
    overrideGlobalItemData(createAsyncCache(() => globalItemDataFactory(items), -1))
    overrideGlobalRivenItemData(createAsyncCache(() => globalRivenItemFactory(rivens), -1))
  }

  beforeEach(() => {
    requests.length = 0
    setNames([['torid', '托里德'], ['soma', '月神']])
    overrideGlobalRivenAttribute(createAsyncCache(async () => ({
      globalRivenAttributeList: [],
      globalRivenAttributeDict: {},
    }), -1))
    wfmClient.orders.listByItem = async ({ slug }) => {
      requests.push(slug)
      return []
    }
    wfmClient.items.getStatistics = async () => undefined
    wfmClient.rivens.getOrders = async (slug) => {
      requests.push(slug)
      return []
    }
  })

  afterEach(() => {
    overrideGlobalItemData(originalItems)
    overrideGlobalRivenItemData(originalRivens)
    overrideGlobalRivenAttribute(originalAttributes)
    wfmClient.orders.listByItem = originalOrders
    wfmClient.items.getStatistics = originalStatistics
    wfmClient.rivens.getOrders = originalRivenOrders
  })

  for (const input of ['托里', '里德', '托里得', '里得', '  托 里得  ']) {
    it(`resolves the Chinese fragment or homophone ${input} in both catalogs`, async () => {
      const item = await matchWFMItem(input)
      expect(item.type).to.equal('matched')
      if (item.type === 'matched') {
        expect(item.item.slug).to.equal('torid')
      }
      expect((await findRivenItemByName(input, rivens))?.slug).to.equal('torid')
    })
  }

  for (const input of ['托', '托德', '托里大', 'tuolide', 'tld', 'tor', '!!!', '']) {
    it(`does not introduce single-character, skipped-character, typo or Latin fuzzy matches for ${input}`, async () => {
      expect(await matchWFMItem(input)).to.deep.equal({ type: 'not-found' })
      expect(await findRivenItemByName(input, rivens)).to.equal(undefined)
    })
  }

  it('prefers existing exact names and Prime shorthand to fuzzy candidates', async () => {
    setNames([['soma', '月神'], ['soma_prime', '月神 Prime'], ['homophone', '悦神']])
    for (const [input, slug] of [['月神', 'soma'], ['月神p', 'soma_prime']]) {
      const result = await matchWFMItem(input)
      expect(result.type).to.equal('matched')
      if (result.type === 'matched') {
        expect(result.item.slug).to.equal(slug)
      }
      expect((await findRivenItemByName(input, rivens))?.slug).to.equal(slug)
    }
  })

  it('prefers literal fragments to homophones', async () => {
    setNames([['torid', '托里德'], ['homophone', '托理得']])
    const result = await matchWFMItem('里德')
    expect(result.type).to.equal('matched')
    if (result.type === 'matched') {
      expect(result.item.slug).to.equal('torid')
    }
    expect((await findRivenItemByName('里德', rivens))?.slug).to.equal('torid')
  })

  it('compares whole syllables instead of concatenated pinyin', async () => {
    setNames([['xian', '西安门'], ['changjian', '长剑']])
    expect(await matchWFMItem('先门')).to.deep.equal({ type: 'not-found' })
    expect(await matchWFMItem('长安')).to.deep.equal({ type: 'not-found' })
    expect(await findRivenItemByName('长安', rivens)).to.equal(undefined)
  })

  it('ignores tones but preserves non-Chinese qualifiers', async () => {
    setNames([['soma', '月神'], ['soma_prime', '月神 Prime'], ['soma_2', '月神2']])
    for (const [input, slug] of [['悦神 Prime', 'soma_prime'], ['悦神２', 'soma_2']]) {
      const result = await matchWFMItem(input)
      expect(result.type).to.equal('matched')
      if (result.type === 'matched') {
        expect(result.item.slug).to.equal(slug)
      }
      expect((await findRivenItemByName(input, rivens))?.slug).to.equal(slug)
    }
    const result = await matchWFMItem('悦神')
    expect(result.type).to.equal('ambiguous')
    if (result.type === 'ambiguous') {
      expect(result.candidates).to.have.length(3)
    }
  })

  it('uses phrase pronunciation for polyphonic names', async () => {
    setNames([['hammer', '重击巨锤']])
    const result = await matchWFMItem('众击')
    expect(result.type).to.equal('matched')
    if (result.type === 'matched') {
      expect(result.item.slug).to.equal('hammer')
    }
    expect((await findRivenItemByName('众击', rivens))?.slug).to.equal('hammer')
  })

  it('orders prefixes before internal fragments, then shorter names first', async () => {
    setNames([['internal', '新托里德'], ['long', '托里德增强'], ['short', '托里德']])
    const result = await getItemOrders('托里')
    expect(result.ok).to.equal(false)
    if (!result.ok) {
      expect(result.error.params?.candidates).to.equal('托里德、托里德增强、新托里德')
    }
  })

  it('uses refreshed catalogs after a homophone search', async () => {
    expect((await findRivenItemByName('托里得'))?.slug).to.equal('torid')
    setNames([['changed', '月神']])
    expect(await matchWFMItem('托里得')).to.deep.equal({ type: 'not-found' })
    expect(await findRivenItemByName('托里得')).to.equal(undefined)
    expect((await findRivenItemByName('悦神'))?.slug).to.equal('changed')
  })

  it('skips absent Chinese translations without searching the English field', async () => {
    rivens[0].i18n = { 'zh-hans': null, 'en': { name: '托里德' } }
    expect(await findRivenItemByName('里德', rivens)).to.equal(undefined)
    expect(await findRivenItemByName('里得', rivens)).to.equal(undefined)
    expect((await findRivenItemByName('托里德', rivens))?.slug).to.equal('torid')
  })

  for (const input of ['托里', '托理']) {
    it(`reports all candidates for ambiguous ${input} without requesting orders`, async () => {
      setNames([['second', '托里乙'], ['first', '托里甲']])
      for (const query of [getItemOrders, getRivenOrders]) {
        const result = await query(input)
        expect(result.ok).to.equal(false)
        if (!result.ok) {
          expect(result.error.code).to.equal('wfm.itemAmbiguous')
          expect(result.error.params?.candidates).to.include('托里甲').and.include('托里乙')
        }
      }
      expect(await findRivenItemByName(input, rivens)).to.equal(undefined)
      expect(requests).to.deep.equal([])
    })
  }

  it('limits candidate messages without turning an ambiguous query into a unique match', async () => {
    setNames(Array.from({ length: 12 }, (_, i) => [`weapon_${i}`, `托里武器${i}`]))
    for (const query of [getItemOrders, getRivenOrders]) {
      const result = await query('托里')
      expect(result.ok).to.equal(false)
      if (!result.ok) {
        expect(result.error.code).to.equal('wfm.itemAmbiguous')
        const message = String(result.error.params?.candidates)
        expect(message.match(/托里武器/g)).to.have.length(10)
        expect(message).to.include('另有 2 项')
      }
    }
    expect(requests).to.deep.equal([])
  })

  it('uses the resolved slug for market orders and accepts full-rank input syntax', async () => {
    for (const input of ['托里', '满级 托里得', '托里得 满级']) {
      const result = await getItemOrders(input)
      expect(result.ok).to.equal(false)
      if (!result.ok) {
        expect(result.error.code).to.equal('wfm.noOnlineSeller')
      }
    }
    const result = await getRivenOrders('托里得')
    expect(result.ok).to.equal(false)
    if (!result.ok) {
      expect(result.error.code).to.equal('wfm.noOnlineRivenSeller')
    }
    expect(requests).to.deep.equal(['torid', 'torid', 'torid', 'torid'])
  })
})
