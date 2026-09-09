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

/**
 * Nicknames attested in Chinese Warframe community sources:
 * huijiwiki 游戏用语 (cowlevel reprint), 17173/OrdisBlog 黑话大全,
 * 萌娘百科, Bilibili titles, and 233乐园 posts. Do not add invented names.
 */
const attestedAliases = [
  { input: '阿屎', key: 'Ash' },
  { input: '一拳', key: 'Atlas' },
  { input: '土甲', key: 'Atlas' },
  { input: '火女', key: 'Ember' },
  { input: '弱鸡', key: 'Loki' },
  { input: '祭司', key: 'Harrow' },
  { input: '大水怪', key: 'Hydroid' },
  { input: '泡澡男', key: 'Hydroid' },
  { input: '沙甲', key: 'Inaros' },
  { input: '法老', key: 'Inaros' },
  { input: '玻璃甲', key: 'Gara' },
  { input: '猫甲', key: 'Khora' },
  { input: '螳螂甲', key: 'Khora' },
  { input: '蛆爹', key: 'Nidus' },
  { input: '死灵', key: 'Nekros' },
  { input: '歌甲', key: 'Octavia' },
  { input: '蝶甲', key: 'Titania' },
  { input: '妖精', key: 'Titania' },
  { input: '花甲', key: 'Wisp' },
  { input: '鬼火', key: 'Wisp' },
  { input: '鬼甲', key: 'Sevagoth' },
  { input: '幽灵甲', key: 'Sevagoth' },
  { input: '骨甲', key: 'Xaku' },
  { input: '毛妹', key: 'Hildryn' },
  { input: '母牛甲', key: 'Hildryn' },
  { input: '吃货', key: 'Grendel' },
  { input: '饕餮甲', key: 'Grendel' },
  { input: '海棠花', key: 'Protea' },
  { input: '猿神', key: 'Wukong' },
  { input: '吉他甲', key: 'Temple' },
  { input: '蘑菇甲', key: 'Nokko' },
  { input: '恶魔甲', key: 'Uriel' },
  { input: '炼狱使徒', key: 'Uriel' },
  { input: '狂墨', key: 'Follie' },
  { input: '蜘蛛', key: 'Oraxia' },
] as const

const inventedNicknames = [
  '沃班',
  '洛基男',
  '脑女',
  '水王',
  '沙爹',
  '精灵',
  '哈洛',
  '玻璃妹',
  '巴鲁克',
  '盾妹',
  '跑男',
  '大胃王',
  '回旋',
  '盾矛',
  '月狼',
  '辐射男',
  '诗人',
  '摇滚',
  '蛛后',
  '菇男',
  '堕天使',
  '墨水妹',
  '天狼猎户',
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

    it('does not register invented nicknames', () => {
      const nicknames = new Set(Object.values(warframeAlias).flat())
      for (const guess of inventedNicknames) {
        expect(nicknames.has(guess), guess).to.equal(false)
      }
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

  describe('attested community nicknames', () => {
    beforeAll(() => {
      overrideAliasCatalog()
    })

    for (const testCase of attestedAliases) {
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
