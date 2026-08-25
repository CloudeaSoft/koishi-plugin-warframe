import { expect } from 'chai'

import {
  buildSuffixVariantCandidates,
  matchByArcaneShorthand,
  normalizeWordPrefixName,
  removeNameSuffix,
  splitWordPrefixTokens,
  transformByWarframeAlias,
} from '../../../src/warframe/services/wfm-service/wfm-service.item-matcher'
import { normalizeName } from '../../../src/warframe/utils'

describe('wfm-item-matcher helpers', () => {
  describe('removeNameSuffix', () => {
    const cases = [
      { input: 'Volt Prime 头', pure: 'voltprime', suffix: '头部神经光元' },
      { input: 'Volt Prime 头部', pure: 'voltprime', suffix: '头部神经光元' },
      { input: 'Rhino Prime 机体', pure: 'rhinoprime', suffix: '机体' },
      { input: 'Volt Prime 系统', pure: 'voltprime', suffix: '系统' },
      { input: 'Volt Prime 蓝图', pure: 'voltprime', suffix: '蓝图' },
      { input: 'Volt Prime 总图', pure: 'voltprime', suffix: '蓝图' },
      { input: '夜灵总图', pure: '夜灵', suffix: '蓝图' },
      { input: '重击巨锤 Prime 锤头', pure: '重击巨锤prime', suffix: '锤头' },
      { input: '凯旋之爪 Prime 爪刃', pure: '凯旋之爪prime', suffix: '爪刃' },
      { input: '帕里斯 Prime 弓身', pure: '帕里斯prime', suffix: '弓身' },
      { input: '蛟龙 Prime 外壳', pure: '蛟龙prime', suffix: '外壳' },
      { input: '蛟龙 Prime 头部', pure: '蛟龙prime', suffix: '头部神经光元' },
    ]

    for (const testCase of cases) {
      it(`splits ${testCase.input}`, () => {
        const result = removeNameSuffix(normalizeName(testCase.input))
        expect(result).to.deep.equal({
          pure: testCase.pure,
          suffix: testCase.suffix,
        })
      })
    }
  })

  describe('transformByWarframeAlias', () => {
    const cases = [
      { input: '电男', output: 'volt' },
      { input: 'DJ', output: 'octavia' },
      { input: '花甲', output: 'wisp' },
      { input: '龙头', output: 'chroma头部神经光元' },
      { input: '奶爸头', output: 'oberon头部神经光元' },
      { input: '夜灵总图', output: 'revenant蓝图' },
    ]

    for (const testCase of cases) {
      it(`maps ${testCase.input}`, () => {
        const result = transformByWarframeAlias(normalizeName(testCase.input))
        expect(result).to.equal(testCase.output)
      })
    }
  })

  describe('buildSuffixVariantCandidates', () => {
    const cases = [
      {
        input: 'Volt Prime 头',
        expected: [
          'voltprime头',
          'voltprime头蓝图',
          'voltprime头blueprint',
          'voltprime头一套',
          'voltprime头set',
          'voltprime头部神经光元',
          'voltprime头部神经光元蓝图',
          'voltprime头部神经光元blueprint',
          'voltprime头部神经光元一套',
          'voltprime头部神经光元set',
          'voltprime头部',
          'voltprime头部蓝图',
          'voltprime头部blueprint',
          'voltprime头部一套',
          'voltprime头部set',
        ],
      },
      {
        input: 'DJ头',
        expected: [
          'dj头',
          'dj头蓝图',
          'dj头blueprint',
          'dj头一套',
          'dj头set',
          'dj头部神经光元',
          'dj头部神经光元蓝图',
          'dj头部神经光元blueprint',
          'dj头部神经光元一套',
          'dj头部神经光元set',
          'dj头部',
          'dj头部蓝图',
          'dj头部blueprint',
          'dj头部一套',
          'dj头部set',
        ],
      },
    ]

    for (const testCase of cases) {
      it(`expands ${testCase.input}`, () => {
        const result = buildSuffixVariantCandidates(normalizeName(testCase.input))
        expect(result).to.deep.equal(testCase.expected)
      })
    }

    it('expands 头 to both neuroptics and cerebrum suffixes', () => {
      const result = buildSuffixVariantCandidates(normalizeName('Volt Prime 头'))
      expect(result).to.include('voltprime头部神经光元')
      expect(result).to.include('voltprime头部')
      expect(result).to.include('voltprime头部神经光元蓝图')
      expect(result).to.include('voltprime头部蓝图')
    })
  })

  describe('word prefix tokenizer', () => {
    const cases = [
      { input: 'v p s', normalized: 'v p s', tokens: ['v', 'p', 's'] },
      { input: 'va pr s', normalized: 'va pr s', tokens: ['va', 'pr', 's'] },
      { input: '  Valkyr   Prime  Set  ', normalized: 'valkyr prime set', tokens: ['valkyr', 'prime', 'set'] },
      { input: 'Valkyr-Prime/Set', normalized: 'valkyr prime set', tokens: ['valkyr', 'prime', 'set'] },
    ]

    for (const testCase of cases) {
      it(`normalizes ${testCase.input}`, () => {
        expect(normalizeWordPrefixName(testCase.input)).to.equal(testCase.normalized)
        expect(splitWordPrefixTokens(testCase.input)).to.deep.equal(testCase.tokens)
      })
    }
  })

  describe('arcane shorthand candidate ordering', () => {
    it('breaks equal display-name ties by slug', () => {
      const result = matchByArcaneShorthand('同名', {
        globalItemDict: {},
        globalItemNameToSlugDict: {},
        globalItemArcaneShorthandDict: {
          同名: [
            {
              id: 'zulu',
              slug: 'arcane_zulu',
              gameRef: '/Arcane/Zulu',
              i18n: { 'zh-hans': { name: '主要·同名' } },
            },
            {
              id: 'alpha',
              slug: 'arcane_alpha',
              gameRef: '/Arcane/Alpha',
              i18n: { 'zh-hans': { name: '主要·同名' } },
            },
          ],
        },
      })

      expect(result).to.deep.equal({
        type: 'ambiguous',
        candidates: [
          {
            id: 'alpha',
            slug: 'arcane_alpha',
            gameRef: '/Arcane/Alpha',
            i18n: { 'zh-hans': { name: '主要·同名' } },
          },
          {
            id: 'zulu',
            slug: 'arcane_zulu',
            gameRef: '/Arcane/Zulu',
            i18n: { 'zh-hans': { name: '主要·同名' } },
          },
        ],
      })
    })
  })
})
