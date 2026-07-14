import type { RivenItem } from '../../../src/types/wfm'
import { expect } from 'chai'
import { findRivenItemByName } from '../../../src/services/wfm-service/wfm-service.riven-item-matcher'
import testRivenItems from '../../assets/test-riven-items.json'

const fixtureRivenItems = testRivenItems.data as RivenItem[]

describe('wfm riven item matcher', () => {
  async function expectItemSlug(input: string, expectedSlug?: string): Promise<void> {
    const output = await findRivenItemByName(input, fixtureRivenItems)
    if (expectedSlug === undefined) {
      expect(output).to.equal(undefined)
      return
    }

    expect(output?.slug).to.equal(expectedSlug)
  }

  const exactMatchCases = [
    { input: 'Kulstar', slug: 'kulstar' },
    { input: 'Heliocor', slug: 'heliocor' },
    { input: 'Nagantaka', slug: 'nagantaka' },
    { input: 'Ocucor', slug: 'ocucor' },
    { input: 'Falcor', slug: 'falcor' },
    { input: 'Paracesis', slug: 'paracesis' },
    { input: 'Soma', slug: 'soma' },
    { input: 'Euphona Prime', slug: 'euphona_prime' },
    { input: 'Vesper 77', slug: 'vesper_77' },
    { input: 'AX-52', slug: 'ax_52' },
  ]

  const shorthandCases = [
    { input: 'Euphona P', slug: 'euphona_prime' },
    { input: 'euphona p', slug: 'euphona_prime' },
  ]

  const wordPrefixCases = [
    { input: 've 77', slug: 'vesper_77' },
    { input: 'ax 52', slug: 'ax_52' },
    { input: 'eu pr', slug: 'euphona_prime' },
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

  describe('word prefix variants', () => {
    for (const testCase of wordPrefixCases) {
      it(`matches ${testCase.input}`, async () => {
        await expectItemSlug(testCase.input, testCase.slug)
      })
    }
  })

  describe('unmatched inputs', () => {
    const cases = [
      'abc',
      'not-a-real-riven',
      'random nonsense',
      '12345',
      'XYZ',
      'unknown prime',
      '空白输入',
      '无效条目',
      'neither this nor that',
      'some-riven-that-does-not-exist',
    ]

    for (const input of cases) {
      it(`returns undefined for ${input}`, async () => {
        await expectItemSlug(input)
      })
    }
  })
})
