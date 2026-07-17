import { expect } from 'chai'

import {
  buildSuffixVariantCandidates,
  normalizeWordPrefixName,
  removeNameSuffix,
  reorderArcanePrefix,
  splitWordPrefixTokens,
  transformByWarframeAlias,
} from '../../../src/warframe/services/wfm-service/wfm-service.item-matcher'
import { normalizeName } from '../../../src/warframe/utils'

describe('wfm-item-matcher helpers', () => {
  describe('removeNameSuffix', () => {
    const cases = [
      { input: 'Volt Prime 头', pure: 'voltprime', suffix: '头部神经光元' },
      { input: 'Rhino Prime 机体', pure: 'rhinoprime', suffix: '机体' },
      { input: 'Volt Prime 系统', pure: 'voltprime', suffix: '系统' },
      { input: 'Volt Prime 蓝图', pure: 'voltprime', suffix: '蓝图' },
      { input: 'Volt Prime 总图', pure: 'voltprime', suffix: '蓝图' },
      { input: '夜灵总图', pure: '夜灵', suffix: '蓝图' },
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
        ],
      },
    ]

    for (const testCase of cases) {
      it(`expands ${testCase.input}`, () => {
        const result = buildSuffixVariantCandidates(normalizeName(testCase.input))
        expect(result).to.deep.equal(testCase.expected)
      })
    }
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

  describe('reorderArcanePrefix', () => {
    const reorderCases = [
      { input: '壁垒赋能', output: '赋能壁垒' },
      { input: '活力魔导', output: '魔导活力' },
      { input: '打击正直', output: '正直打击' },
      { input: '勇猛神威', output: '神威勇猛' },
      { input: '活力蜕化', output: '蜕化活力' },
      { input: '无情主要', output: '主要无情' },
      { input: '无情次要', output: '次要无情' },
      { input: '侵染近战', output: '近战侵染' },
      { input: '利矢弓箭', output: '弓箭利矢' },
    ]

    for (const testCase of reorderCases) {
      it(`reorders ${testCase.input} -> ${testCase.output}`, () => {
        expect(reorderArcanePrefix(testCase.input)).to.equal(testCase.output)
      })
    }

    const noReorderCases = [
      '赋能壁垒',
      '魔导活力',
      '赋能',
      '主要',
      '壁垒',
      '',
    ]

    for (const input of noReorderCases) {
      it(`does not reorder ${input || '(empty)'}`, () => {
        expect(reorderArcanePrefix(input)).to.equal(undefined)
      })
    }
  })
})
