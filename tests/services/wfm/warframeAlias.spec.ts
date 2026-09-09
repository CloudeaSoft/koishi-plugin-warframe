import type { ItemShort } from '../../../src/warframe/types/wfm'
import { expect } from 'chai'
import { warframeAlias } from '../../../src/warframe/assets'
import {
  globalItemDataFactory,
  overrideGlobalItemData,
} from '../../../src/warframe/data/wfm/globalItem'
import {
  matchWFMItem,
  transformByWarframeAlias,
} from '../../../src/warframe/services/wfm-service/wfm-service.item-matcher'
import { createAsyncCache, normalizeName } from '../../../src/warframe/utils'
import testItems from '../../assets/test-items.json'

function collectAliasOwners(): Map<string, string> {
  const owners = new Map<string, string>()
  const collisions: Array<{ alias: string, first: string, second: string }> = []

  const claim = (raw: string, frame: string): void => {
    const key = normalizeName(raw)
    expect(key, `alias ${JSON.stringify(raw)} for ${frame} should normalize to a non-empty key`).to.not.equal('')
    const existing = owners.get(key)
    if (existing && existing !== frame) {
      collisions.push({ alias: raw, first: existing, second: frame })
      return
    }
    owners.set(key, frame)
  }

  for (const [frame, aliases] of Object.entries(warframeAlias)) {
    claim(frame, frame)
    for (const alias of aliases) {
      claim(alias, frame)
      claim(`${alias}甲`, frame)
    }
  }

  expect(collisions).to.deep.equal([])
  return owners
}

function makeWarframeSet(slug: string, zhName: string, enName: string): ItemShort {
  return {
    id: slug,
    slug,
    gameRef: `/Lotus/Powersuits/${enName}/${enName}`,
    i18n: {
      'zh-hans': { name: zhName },
      'en': { name: enName },
    },
  } as ItemShort
}

describe('warframeAlias', () => {
  it('maps each normalized alias to exactly one warframe', () => {
    const owners = collectAliasOwners()
    expect(owners.size).to.be.greaterThan(Object.keys(warframeAlias).length)
  })

  it('gives every warframe at least one alias', () => {
    const empty = Object.entries(warframeAlias)
      .filter(([, aliases]) => aliases.length === 0)
      .map(([frame]) => frame)

    expect(empty).to.deep.equal([])
  })

  describe('community aliases', () => {
    const cases = [
      { input: '西里斯', output: 'sirius&orion' },
      { input: '奥里昂', output: 'sirius&orion' },
      { input: '狂墨', output: 'follie' },
      { input: '肥婆', output: 'follie' },
      { input: '火女', output: 'ember' },
      { input: '阿屎', output: 'ash' },
      { input: '缴械基', output: 'loki' },
      { input: '运输基', output: 'loki' },
      { input: '开门娃', output: 'nova' },
      { input: '减速娃', output: 'nova' },
      { input: '驴王', output: 'oberon' },
      { input: '蛆爹', output: 'nidus' },
      { input: '歌甲', output: 'octavia' },
      { input: '蝶甲', output: 'titania' },
      { input: '蹦蹦', output: 'trinity' },
      { input: '吼牛', output: 'rhino' },
      { input: '核弹猴', output: 'wukong' },
      { input: '炼狱使徒', output: 'uriel' },
    ]

    for (const testCase of cases) {
      it(`maps ${testCase.input} to ${testCase.output}`, () => {
        expect(transformByWarframeAlias(normalizeName(testCase.input))).to.equal(testCase.output)
      })
    }
  })

  describe('item resolution', () => {
    const extraItems = [
      makeWarframeSet('follie_set', 'Follie 一套', 'Follie Set'),
      makeWarframeSet('sirius_and_orion_set', 'Sirius & Orion 一套', 'Sirius & Orion Set'),
    ]
    const fixtureItems = [...(testItems.data as ItemShort[]), ...extraItems]

    beforeAll(() => {
      overrideGlobalItemData(
        createAsyncCache(async () => {
          return await globalItemDataFactory(fixtureItems)
        }, -1),
      )
    })

    it('resolves 西里斯 to exactly one Sirius & Orion item', async () => {
      const result = await matchWFMItem('西里斯')
      expect(result).to.deep.include({ type: 'matched' })
      if (result.type === 'matched') {
        expect(result.item.slug).to.equal('sirius_and_orion_set')
      }
    })

    it('resolves 狂墨 to exactly one Follie item', async () => {
      const result = await matchWFMItem('狂墨')
      expect(result).to.deep.include({ type: 'matched' })
      if (result.type === 'matched') {
        expect(result.item.slug).to.equal('follie_set')
      }
    })

    it('resolves 火女 to exactly one Ember item', async () => {
      const result = await matchWFMItem('火女')
      expect(result).to.deep.include({ type: 'matched' })
      if (result.type === 'matched') {
        expect(result.item.slug).to.equal('ember_prime_set')
      }
    })

    it('rewrites every alias to that warframe\'s normalized name', () => {
      for (const [frame, aliases] of Object.entries(warframeAlias)) {
        const expected = normalizeName(frame)
        for (const alias of aliases) {
          expect(
            transformByWarframeAlias(normalizeName(alias)),
            `${alias} -> ${frame}`,
          ).to.equal(expected)
        }
      }
    })
  })
})
