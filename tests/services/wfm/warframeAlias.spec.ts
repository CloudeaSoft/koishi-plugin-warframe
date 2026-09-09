import { expect } from 'chai'
import warframeAlias from '../../../src/warframe/assets/warframeAlias.json'
import { transformByWarframeAlias } from '../../../src/warframe/services/wfm-service/wfm-service.item-matcher'
import { findWarframeAliasCollisions } from '../../../src/warframe/services/wfm-service/wfm-service.warframe-alias'
import { normalizeName } from '../../../src/warframe/utils'

describe('warframe alias uniqueness', () => {
  it('reports when two warframes share a normalized alias', () => {
    expect(findWarframeAliasCollisions({
      Ember: ['火'],
      Chroma: ['火'],
    })).to.deep.equal([
      { alias: '火', frames: ['Ember', 'Chroma'] },
      { alias: '火甲', frames: ['Ember', 'Chroma'] },
    ])
  })

  it('does not treat duplicate aliases of the same warframe as a collision', () => {
    expect(findWarframeAliasCollisions({
      Chroma: ['龙', '龙甲'],
    })).to.deep.equal([])
  })

  it('maps every shipped alias, including 甲 suffix forms, to exactly one warframe', () => {
    expect(findWarframeAliasCollisions(warframeAlias)).to.deep.equal([])
  })

  it('resolves every shipped alias through the matcher to that one warframe', () => {
    for (const [frame, aliases] of Object.entries(warframeAlias)) {
      const expected = normalizeName(frame)
      for (const alias of aliases) {
        expect(transformByWarframeAlias(normalizeName(alias)), alias).to.equal(expected)
        expect(transformByWarframeAlias(normalizeName(`${alias}甲`)), `${alias}甲`).to.equal(expected)
      }
    }
  })
})

describe('extended Chinese warframe aliases', () => {
  const cases = [
    { input: '隐身', frame: 'Loki' },
    { input: '隐身男', frame: 'Loki' },
    { input: '沃班', frame: 'Vauban' },
    { input: '海贼', frame: 'Hydroid' },
    { input: '尼克斯', frame: 'Nyx' },
    { input: '法老', frame: 'Inaros' },
    { input: '蝴蝶', frame: 'Titania' },
    { input: '哈洛', frame: 'Harrow' },
    { input: '加拉', frame: 'Gara' },
    { input: '巴鲁克', frame: 'Baruuk' },
    { input: '盾妹', frame: 'Hildryn' },
    { input: '陀螺', frame: 'Gyre' },
    { input: '枪盾', frame: 'Styanax' },
    { input: '摇滚', frame: 'Temple' },
    { input: '蛛后', frame: 'Oraxia' },
    { input: '诺科', frame: 'Nokko' },
    { input: '乌列尔', frame: 'Uriel' },
    { input: '佛莉', frame: 'Follie' },
    { input: '天狼', frame: 'Sirius & Orion' },
    { input: '猎户', frame: 'Sirius & Orion' },
    { input: '天狼星', frame: 'Sirius & Orion' },
    { input: '猎户座', frame: 'Sirius & Orion' },
    { input: '双子星', frame: 'Sirius & Orion' },
  ]

  for (const testCase of cases) {
    it(`maps ${testCase.input} to ${testCase.frame}`, () => {
      expect(transformByWarframeAlias(normalizeName(testCase.input))).to.equal(
        normalizeName(testCase.frame),
      )
    })
  }
})
