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

const communityAliases = [
  { input: '沃班', key: 'Vauban' },
  { input: '洛基男', key: 'Loki' },
  { input: '脑女', key: 'Nyx' },
  { input: '水王', key: 'Hydroid' },
  { input: '沙爹', key: 'Inaros' },
  { input: '精灵', key: 'Titania' },
  { input: '哈洛', key: 'Harrow' },
  { input: '玻璃妹', key: 'Gara' },
  { input: '巴鲁克', key: 'Baruuk' },
  { input: '盾妹', key: 'Hildryn' },
  { input: '跑男', key: 'Gauss' },
  { input: '大胃王', key: 'Grendel' },
  { input: '回旋', key: 'Gyre' },
  { input: '盾矛', key: 'Styanax' },
  { input: '月狼', key: 'Voruna' },
  { input: '辐射男', key: 'Qorvex' },
  { input: '诗人', key: 'Dante' },
  { input: '摇滚', key: 'Temple' },
  { input: '蛛后', key: 'Oraxia' },
  { input: '菇男', key: 'Nokko' },
  { input: '堕天使', key: 'Uriel' },
  { input: '墨水妹', key: 'Follie' },
  { input: '天狼猎户', key: 'Sirius & Orion' },
] as const

function warframeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

function warframeSetItem(name: string): ItemShort {
  const slug = `${warframeSlug(name)}_prime_set`
  return {
    id: slug,
    slug,
    gameRef: `/Lotus/Powersuits/${name}`,
    tags: ['set', 'prime', 'warframe'],
    i18n: {
      'en': { name: `${name} Prime Set` },
      'zh-hans': { name: `${name} Prime 一套` },
    },
  } as ItemShort
}

function overrideAliasCatalog(): void {
  const items = Object.keys(warframeAlias).map(warframeSetItem)
  overrideGlobalItemData(
    createAsyncCache(async () => {
      return await globalItemDataFactory(items)
    }, -1),
  )
}

function aliasOwners(): Map<string, string> {
  const owners = new Map<string, string>()
  const collisions: string[] = []

  function claim(alias: string, owner: string): void {
    const existing = owners.get(alias)
    if (existing !== undefined && existing !== owner) {
      collisions.push(`${alias}: ${existing} vs ${owner}`)
      return
    }
    owners.set(alias, owner)
  }

  for (const [key, aliases] of Object.entries(warframeAlias)) {
    const owner = normalizeName(key)
    claim(owner, owner)
    for (const alias of aliases) {
      expect(alias, `${key} has an empty alias`).to.be.a('string').and.not.equal('')
      claim(normalizeName(alias), owner)
      claim(normalizeName(`${alias}甲`), owner)
    }
  }

  expect(collisions, collisions.join('\n')).to.deep.equal([])
  return owners
}

describe('warframe aliases', () => {
  describe('uniqueness', () => {
    it('maps each nickname to exactly one warframe after normalizeName', () => {
      const owners = aliasOwners()
      const nicknames = Object.values(warframeAlias).flat()
      expect(nicknames.length).to.be.greaterThan(0)
      expect(owners.size).to.be.greaterThan(nicknames.length)
    })
  })

  describe('resolution', () => {
    beforeAll(() => {
      overrideAliasCatalog()
    })

    it('resolves each nickname to exactly one set item for its warframe', async () => {
      for (const [key, aliases] of Object.entries(warframeAlias)) {
        const expectedSlug = `${warframeSlug(key)}_prime_set`
        for (const alias of aliases) {
          const result = await matchWFMItem(alias)
          expect(result.type, `${alias} -> ${key}`).to.equal('matched')
          if (result.type === 'matched') {
            expect(result.item.slug, `${alias} -> ${key}`).to.equal(expectedSlug)
          }
        }
      }
    })
  })

  describe('community nicknames from issue #69', () => {
    beforeAll(() => {
      overrideAliasCatalog()
    })

    for (const testCase of communityAliases) {
      it(`maps ${testCase.input} to ${testCase.key}`, async () => {
        expect(transformByWarframeAlias(normalizeName(testCase.input))).to.equal(
          normalizeName(testCase.key),
        )
        const result = await matchWFMItem(testCase.input)
        expect(result.type).to.equal('matched')
        if (result.type === 'matched') {
          expect(result.item.slug).to.equal(`${warframeSlug(testCase.key)}_prime_set`)
        }
      })
    }
  })
})
