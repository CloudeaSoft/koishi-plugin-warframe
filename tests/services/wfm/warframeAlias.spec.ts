import type { ItemShort } from '../../../src/warframe/types/wfm'
import { expect } from 'chai'
import { warframeAlias } from '../../../src/warframe/assets'
import {
  globalItemDataFactory,
  overrideGlobalItemData,
} from '../../../src/warframe/data/wfm/globalItem'
import { matchWFMItem } from '../../../src/warframe/services'
import { createAsyncCache, normalizeName } from '../../../src/warframe/utils'
import testItems from '../../assets/test-items.json'

const fixtureItems = testItems.data as ItemShort[]

function warframeSetSlug(warframe: string): string {
  return `${warframe
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')}_prime_set`
}

function syntheticPrimeSet(warframe: string): ItemShort {
  const slug = warframeSetSlug(warframe)
  return {
    id: slug,
    slug,
    gameRef: `/Lotus/Powersuits/${warframe}`,
    thumb: '',
    i18n: {
      'zh-hans': { name: `${warframe} Prime 一套` },
      'en': { name: `${warframe} Prime Set` },
    },
  } as unknown as ItemShort
}

function itemsForAliasResolution(): ItemShort[] {
  const slugs = new Set(fixtureItems.map(item => item.slug))
  const extras = Object.keys(warframeAlias)
    .map(warframe => syntheticPrimeSet(warframe))
    .filter(item => !slugs.has(item.slug))
  return [...fixtureItems, ...extras]
}

function overrideItemData(items: ItemShort[]): void {
  overrideGlobalItemData(
    createAsyncCache(async () => {
      return await globalItemDataFactory(items)
    }, -1),
  )
}

function aliasOwners(): Map<string, string[]> {
  const owners = new Map<string, string[]>()
  for (const [warframe, aliases] of Object.entries(warframeAlias)) {
    const names = [
      warframe,
      ...aliases,
      ...aliases
        .filter(alias => alias.length > 0)
        .map(alias => `${alias}甲`),
    ]
    for (const name of names) {
      if (typeof name !== 'string' || name.length === 0) {
        continue
      }

      const normalized = normalizeName(name)
      if (!normalized) {
        continue
      }

      const current = owners.get(normalized) ?? []
      if (!current.includes(warframe)) {
        current.push(warframe)
      }
      owners.set(normalized, current)
    }
  }
  return owners
}

describe('warframe aliases', () => {
  beforeAll(() => {
    overrideItemData(itemsForAliasResolution())
  })

  it('gives every warframe at least one Chinese alias', () => {
    const missing = Object.entries(warframeAlias)
      .filter(([, aliases]) => aliases.every(alias => alias.length === 0))
      .map(([warframe]) => warframe)

    expect(missing).to.deep.equal([])
  })

  it('maps each normalized alias to exactly one warframe', () => {
    const collisions = [...aliasOwners().entries()]
      .filter(([, warframes]) => warframes.length > 1)
      .map(([alias, warframes]) => `${alias} -> ${warframes.join(', ')}`)

    expect(collisions).to.deep.equal([])
  })

  it('resolves each alias to exactly one item for that warframe', async () => {
    const failures: string[] = []

    for (const [warframe, aliases] of Object.entries(warframeAlias)) {
      const expectedSlug = warframeSetSlug(warframe)
      for (const alias of aliases) {
        if (typeof alias !== 'string' || alias.length === 0) {
          continue
        }

        const result = await matchWFMItem(alias)
        if (result.type !== 'matched') {
          failures.push(`${alias} (${warframe}) -> ${result.type}`)
          continue
        }

        if (result.item.slug !== expectedSlug) {
          failures.push(
            `${alias} (${warframe}) -> ${result.item.slug}, expected ${expectedSlug}`,
          )
        }
      }
    }

    expect(failures).to.deep.equal([])
  })

  const communityAliasCases = [
    { input: '女武神', slug: 'valkyr_prime_set' },
    { input: '跑男', slug: 'gauss_prime_set' },
    { input: '灵薄狱', slug: 'limbo_prime_set' },
    { input: '余烬', slug: 'ember_prime_set' },
    { input: '天狼', slug: 'sirius_orion_prime_set' },
  ]

  for (const testCase of communityAliasCases) {
    it(`maps ${testCase.input} to ${testCase.slug}`, async () => {
      const result = await matchWFMItem(testCase.input)
      expect(result.type).to.equal('matched')
      if (result.type === 'matched') {
        expect(result.item.slug).to.equal(testCase.slug)
      }
    })
  }
})
