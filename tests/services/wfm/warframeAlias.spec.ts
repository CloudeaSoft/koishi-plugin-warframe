import type { ItemShort } from '../../../src/warframe/types/wfm'
import { expect } from 'chai'
import { warframeAlias } from '../../../src/warframe/assets'
import {
  globalItemDataFactory,
  overrideGlobalItemData,
} from '../../../src/warframe/data/wfm/globalItem'
import { matchWFMItem, transformByWarframeAlias } from '../../../src/warframe/services/wfm-service/wfm-service.item-matcher'
import { createAsyncCache, normalizeName } from '../../../src/warframe/utils'
import testItems from '../../assets/test-items.json'

const fixtureItems = testItems.data as ItemShort[]

function addOwner(
  owners: Map<string, Set<string>>,
  rawKey: string,
  owner: string,
): void {
  const normalized = normalizeName(rawKey)
  if (!normalized) {
    return
  }

  const set = owners.get(normalized) ?? new Set<string>()
  set.add(owner)
  owners.set(normalized, set)
}

/**
 * Same keys the matcher indexes: canonical names, each alias, and the
 * auto-generated `${alias}甲` form.
 */
function aliasOwnersByNormalizedKey(
  aliasObject: Record<string, string[]>,
): Map<string, Set<string>> {
  const owners = new Map<string, Set<string>>()
  for (const [frame, aliases] of Object.entries(aliasObject)) {
    const owner = normalizeName(frame)
    addOwner(owners, frame, owner)
    for (const alias of aliases) {
      if (typeof alias !== 'string' || alias.length === 0) {
        continue
      }

      addOwner(owners, alias, owner)
      addOwner(owners, `${alias}甲`, owner)
    }
  }

  return owners
}

/**
 * Nicknames added from Chinese community sources, not invented:
 * Deathcraft & TH-188 国服黑话 (17173 / OrdisBlog), WFBotSlang,
 * 尘墟氏族 jsauce 战甲出处, 233乐园 / Bilibili titles.
 */
const addedAliasCases = [
  { input: '缴械基', frame: 'loki' },
  { input: '运输基', frame: 'loki' },
  { input: '弱鸡', frame: 'loki' },
  { input: '阿屎', frame: 'ash' },
  { input: '开门娃', frame: 'nova' },
  { input: '核弹猴', frame: 'wukong' },
  { input: '蛆爹', frame: 'nidus' },
  { input: '驴王', frame: 'oberon' },
  { input: '一拳超人', frame: 'atlas' },
  { input: '歌甲', frame: 'octavia' },
  { input: '蝶甲', frame: 'titania' },
  { input: '夜店', frame: 'revenant' },
  { input: '西里斯', frame: 'sirius&orion' },
  { input: '奥里昂', frame: 'sirius&orion' },
  { input: '9号甲', frame: 'cyte09' },
  { input: '绘影者', frame: 'follie' },
  { input: '炼狱使徒', frame: 'uriel' },
  { input: '缚影蛛后', frame: 'oraxia' },
]

describe('warframe aliases', () => {
  it('maps each normalized alias to exactly one warframe', () => {
    const collisions = [...aliasOwnersByNormalizedKey(warframeAlias).entries()]
      .filter(([, owners]) => owners.size !== 1)
      .map(([key, owners]) => `${key} -> ${[...owners].join(', ')}`)

    expect(collisions).to.deep.equal([])
  })

  it('maps each listed alias through transformByWarframeAlias to that warframe', () => {
    const failures: string[] = []
    for (const [frame, aliases] of Object.entries(warframeAlias)) {
      const owner = normalizeName(frame)
      for (const alias of aliases) {
        if (typeof alias !== 'string' || alias.length === 0) {
          continue
        }

        const mapped = transformByWarframeAlias(normalizeName(alias))
        if (mapped !== owner) {
          failures.push(`${alias} -> ${mapped ?? 'undefined'} (expected ${owner})`)
        }
      }
    }

    expect(failures).to.deep.equal([])
  })

  for (const testCase of addedAliasCases) {
    it(`maps added nickname ${testCase.input} to ${testCase.frame}`, () => {
      expect(transformByWarframeAlias(normalizeName(testCase.input))).to.equal(
        testCase.frame,
      )
    })
  }

  describe('market item resolution', () => {
    beforeAll(() => {
      overrideGlobalItemData(
        createAsyncCache(async () => {
          return await globalItemDataFactory(fixtureItems)
        }, -1),
      )
    })

    it('never returns an ambiguous catalog match for an alias', async () => {
      const failures: string[] = []

      for (const [frame, aliases] of Object.entries(warframeAlias)) {
        for (const alias of aliases) {
          if (typeof alias !== 'string' || alias.length === 0) {
            continue
          }

          const result = await matchWFMItem(alias)
          if (result.type === 'ambiguous') {
            failures.push(
              `${alias} (${frame}): ${result.candidates.map(item => item.slug).join(', ')}`,
            )
          }
        }
      }

      expect(failures).to.deep.equal([])
    })
  })
})
