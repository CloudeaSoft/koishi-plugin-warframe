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
    { input: '缴械基', frame: 'Loki' },
    { input: '运输基', frame: 'Loki' },
    { input: '工程统帅', frame: 'Vauban' },
    { input: '惊涛骇浪', frame: 'Hydroid' },
    { input: '冥河夜神', frame: 'Nyx' },
    { input: '沙甲', frame: 'Inaros' },
    { input: '沙海怒涛', frame: 'Inaros' },
    { input: '蝶甲', frame: 'Titania' },
    { input: '幻蝶仙灵', frame: 'Titania' },
    { input: '驱魔使者', frame: 'Harrow' },
    { input: '琉璃侍女', frame: 'Gara' },
    { input: '圣拳武僧', frame: 'Baruuk' },
    { input: '重装武神', frame: 'Hildryn' },
    { input: '电光舞者', frame: 'Gyre' },
    { input: '无畏斗士', frame: 'Styanax' },
    { input: '赤焰狂歌', frame: 'Temple' },
    { input: '缚影蛛后', frame: 'Oraxia' },
    { input: '蘑菇小子', frame: 'Nokko' },
    { input: '炼狱使徒', frame: 'Uriel' },
    { input: '乌列尔', frame: 'Uriel' },
    { input: '狂墨', frame: 'Follie' },
    { input: '绘影者', frame: 'Follie' },
    { input: '西里斯', frame: 'Sirius & Orion' },
    { input: '奥里昂', frame: 'Sirius & Orion' },
    { input: '西里斯&奥里昂', frame: 'Sirius & Orion' },
    { input: '阿屎', frame: 'Ash' },
    { input: '开门娃', frame: 'Nova' },
    { input: '歌甲', frame: 'Octavia' },
    { input: '土甲', frame: 'Atlas' },
    { input: '缮写士', frame: 'Dante' },
    { input: '弱鸡', frame: 'Loki' },
    { input: '花妈', frame: 'Wisp' },
    { input: '球妈', frame: 'Protea' },
  ]

  for (const testCase of cases) {
    it(`maps ${testCase.input} to ${testCase.frame}`, () => {
      expect(transformByWarframeAlias(normalizeName(testCase.input))).to.equal(
        normalizeName(testCase.frame),
      )
    })
  }

  it('does not map unpublished guessed nicknames', () => {
    for (const guessed of ['隐身', '沃班', '海贼', '天狼', '猎户座', '双子星', '诺科', '佛莉']) {
      expect(transformByWarframeAlias(normalizeName(guessed)), guessed).to.equal(normalizeName(guessed))
    }
  })
})
