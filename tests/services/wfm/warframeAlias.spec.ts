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

  describe('official and community aliases', () => {
    const cases = [
      { input: '众星', output: 'sirius&orion' },
      { input: '决斗之子', output: 'sirius&orion' },
      { input: '天狼星', output: 'sirius&orion' },
      { input: '猎户座', output: 'sirius&orion' },
      { input: '绘影者', output: 'follie' },
      { input: '狂墨', output: 'follie' },
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

    it('resolves 众星 to exactly one Sirius & Orion item', async () => {
      const result = await matchWFMItem('众星')
      expect(result).to.deep.include({ type: 'matched' })
      if (result.type === 'matched') {
        expect(result.item.slug).to.equal('sirius_and_orion_set')
      }
    })

    it('resolves 绘影者 to exactly one Follie item', async () => {
      const result = await matchWFMItem('绘影者')
      expect(result).to.deep.include({ type: 'matched' })
      if (result.type === 'matched') {
        expect(result.item.slug).to.equal('follie_set')
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
