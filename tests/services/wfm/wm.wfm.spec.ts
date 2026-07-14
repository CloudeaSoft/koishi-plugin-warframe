import type { ItemShort } from '../../../src/types/wfm'
import { expect } from 'chai'

import {
  globalItemDataFactory,
  overrideGlobalItemData,
} from '../../../src/data/wfm/globalItem'
import { stringToWFMItem } from '../../../src/services'
import { createAsyncCache } from '../../../src/utils'
import testItems from '../../assets/test-items.json'

describe('wfm-service.inputToItem', () => {
  beforeAll(() => {
    overrideGlobalItemData(
      createAsyncCache(async () => {
        return await globalItemDataFactory(testItems.data as ItemShort[])
      }, -1),
    )
  })

  async function expectItemSlug(
    input: string,
    expectedSlug?: string,
  ): Promise<void> {
    const output = await stringToWFMItem(input)
    if (expectedSlug === undefined) {
      expect(output).to.equal(undefined)
      return
    }

    expect(output?.slug).to.equal(expectedSlug)
  }

  const exactMatchCases = [
    { input: 'Valkyr Prime Set', slug: 'valkyr_prime_set' },
    { input: 'Rhino Prime Blueprint', slug: 'rhino_prime_blueprint' },
    { input: 'Octavia Prime Set', slug: 'octavia_prime_set' },
    { input: 'Valkyr Prime Blueprint', slug: 'valkyr_prime_blueprint' },
    { input: 'Rhino Prime Set', slug: 'rhino_prime_set' },
    { input: 'Octavia Prime Blueprint', slug: 'octavia_prime_blueprint' },
    { input: 'Volt Prime Set', slug: 'volt_prime_set' },
    { input: 'Volt Prime Blueprint', slug: 'volt_prime_blueprint' },
    { input: 'Ash Prime Set', slug: 'ash_prime_set' },
    { input: 'Ash Prime Blueprint', slug: 'ash_prime_blueprint' },
    { input: '膛室 Prime', slug: 'primed_chamber' },
    { input: 'Primed Chamber', slug: 'primed_chamber' },
  ]

  const shorthandCases = [
    { input: 'ashp', slug: 'ash_prime_set' },
    { input: '膛室', slug: 'primed_chamber' },
    { input: 'voltp', slug: 'volt_prime_set' },
    { input: 'rhinop', slug: 'rhino_prime_set' },
    { input: 'octaviap', slug: 'octavia_prime_set' },
    { input: 'valkyrp', slug: 'valkyr_prime_set' },
    { input: 'ashprime', slug: 'ash_prime_set' },
    { input: 'voltprime', slug: 'volt_prime_set' },
    { input: 'rhinoprime', slug: 'rhino_prime_set' },
    { input: 'octaviaprime', slug: 'octavia_prime_set' },
    { input: 'valkyrprime', slug: 'valkyr_prime_set' },
  ]

  const aliasCases = [
    { input: 'dj', slug: 'octavia_prime_set' },
    { input: '电', slug: 'volt_prime_set' },
    { input: '电男', slug: 'volt_prime_set' },
    { input: '奶妈', slug: 'trinity_prime_set' },
    { input: '奶', slug: 'trinity_prime_set' },
    { input: '牛', slug: 'rhino_prime_set' },
    { input: '磁妹', slug: 'mag_prime_set' },
    { input: '火鸡', slug: 'ember_prime_set' },
    { input: '小丑', slug: 'mirage_prime_set' },
    { input: '伏特', slug: 'volt_prime_set' },
    { input: '瓦喵甲', slug: 'valkyr_prime_set' },
  ]

  const legacyOnlyCases = [
    { input: '龙头', slug: 'chroma_prime_neuroptics_blueprint' },
    { input: '电系统', slug: 'volt_prime_systems_blueprint' },
    { input: '牛头', slug: 'rhino_prime_neuroptics_blueprint' },
    { input: '磁头', slug: 'mag_prime_neuroptics_blueprint' },
    { input: '奶妈头', slug: 'trinity_prime_neuroptics_blueprint' },
    { input: '火头', slug: 'ember_prime_neuroptics_blueprint' },
    { input: '冰头', slug: 'frost_prime_neuroptics_blueprint' },
    { input: '毒头', slug: 'saryn_prime_neuroptics_blueprint' },
    { input: '瓦喵头', slug: 'valkyr_prime_neuroptics_blueprint' },
    { input: '奶爸头', slug: 'oberon_prime_neuroptics_blueprint' },
    { input: 'DJ头', slug: 'octavia_prime_neuroptics_blueprint' },
  ]

  describe('exact matches', () => {
    for (const testCase of exactMatchCases) {
      it(`resolves ${testCase.input}`, async () => {
        await expectItemSlug(testCase.input, testCase.slug)
      })
    }
  })

  describe('shorthand inputs', () => {
    for (const testCase of shorthandCases) {
      it(`expands ${testCase.input}`, async () => {
        await expectItemSlug(testCase.input, testCase.slug)
      })
    }
  })

  describe('warframe aliases', () => {
    for (const testCase of aliasCases) {
      it(`maps ${testCase.input} to the canonical item`, async () => {
        await expectItemSlug(testCase.input, testCase.slug)
      })
    }
  })

  describe('legacy-only variants', () => {
    for (const testCase of legacyOnlyCases) {
      it(`normalizes ${testCase.input}`, async () => {
        await expectItemSlug(testCase.input, testCase.slug)
      })
    }
  })

  describe('unmatched inputs', () => {
    const cases = [
      'abc',
      'not-a-real-item',
      'random nonsense',
      '12345',
      'XYZ',
      'unknown prime',
      '空白输入',
      '无效条目',
      'neither this nor that',
      'some-item-that-does-not-exist',
    ]

    for (const input of cases) {
      it(`returns undefined for ${input}`, async () => {
        await expectItemSlug(input)
      })
    }
  })
})
