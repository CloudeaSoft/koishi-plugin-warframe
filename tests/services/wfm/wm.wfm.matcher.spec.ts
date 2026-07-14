import { expect } from 'chai'

import {
  buildSuffixVariantCandidates,
  removeNameSuffix,
  transformByWarframeAlias,
} from '../../../src/services/wfm-item-matcher'
import { normalizeName } from '../../../src/utils'

describe('wfm-item-matcher helpers', () => {
  describe('removeNameSuffix', () => {
    const cases = [
      { input: 'Volt Prime 头', pure: 'voltprime', suffix: '头部神经光元' },
      { input: 'Rhino Prime 机体', pure: 'rhinoprime', suffix: '机体' },
      { input: 'Volt Prime 系统', pure: 'voltprime', suffix: '系统' },
      { input: 'Volt Prime 蓝图', pure: 'voltprime', suffix: '蓝图' },
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
      { input: '龙头', output: 'chroma头部神经光元' },
      { input: '奶爸头', output: 'oberon头部神经光元' },
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
})
