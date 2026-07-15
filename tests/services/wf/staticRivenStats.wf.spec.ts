import type { RivenStatResult } from '../../../src/warframe/types/wf/riven'
import type { RivenAttribute } from '../../../src/warframe/types/wfm'
import { expect } from 'chai'
import {
  globalRivenAttributeFactory,
  overrideGlobalRivenAttribute,
} from '../../../src/warframe/data/wfm/globalRivenAttribute'
import { getStaticRivenStats } from '../../../src/warframe/services'
import { createAsyncCache } from '../../../src/warframe/utils'

const fixtureAttrs = [
  {
    slug: 'damage',
    prefix: 'Vex',
    suffix: 'Tis',
    negativeOnly: false,
    unit: 'percent',
    i18n: {
      'zh-hans': { name: '伤害', description: '' },
      'en': { name: 'Damage', description: '' },
    },
  },
  {
    slug: 'critical_chance',
    prefix: 'Cru',
    suffix: 'Dex',
    negativeOnly: false,
    unit: 'percent',
    i18n: {
      'zh-hans': { name: '暴击几率', description: '' },
      'en': { name: 'Critical Chance', description: '' },
    },
  },
  {
    slug: 'multishot',
    prefix: 'Mul',
    suffix: 'Tip',
    negativeOnly: false,
    unit: 'percent',
    i18n: {
      'zh-hans': { name: '多重射击', description: '' },
      'en': { name: 'Multishot', description: '' },
    },
  },
  {
    slug: 'critical_multiplier',
    prefix: 'Cri',
    suffix: 'Mul',
    negativeOnly: false,
    unit: 'percent',
    i18n: {
      'zh-hans': { name: '暴击伤害', description: '' },
      'en': { name: 'Critical Damage', description: '' },
    },
  },
] as unknown as RivenAttribute[]

function expectRivenStatResult(
  result: Awaited<ReturnType<typeof getStaticRivenStats>>,
): RivenStatResult {
  expect(result.ok).to.equal(true)
  if (!result.ok) {
    throw new Error(`Expected ok result but got: ${result.error.code}`)
  }
  return result.data
}

describe('getStaticRivenStats Tests', () => {
  beforeAll(() => {
    overrideGlobalRivenAttribute(
      createAsyncCache(async () => {
        return await globalRivenAttributeFactory(fixtureAttrs)
      }, -1),
    )
  })

  it('should return error for disposition > 1.55', async () => {
    const result = await getStaticRivenStats('步枪', '2', 1.6)
    expect(result.ok).to.equal(false)
    if (!result.ok) {
      expect(result.error.code).to.equal('riven.dispositionError')
    }
  })

  it('should return error for disposition < 0.5', async () => {
    const result = await getStaticRivenStats('步枪', '2', 0.4)
    expect(result.ok).to.equal(false)
    if (!result.ok) {
      expect(result.error.code).to.equal('riven.dispositionError')
    }
  })

  it('should accept disposition boundary values (0.5 and 1.55)', async () => {
    const r1 = await getStaticRivenStats('步枪', '2', 0.5)
    expect(r1.ok).to.equal(true)

    const r2 = await getStaticRivenStats('步枪', '2', 1.55)
    expect(r2.ok).to.equal(true)
  })

  it('should return error for invalid weapon type', async () => {
    const result = await getStaticRivenStats('InvalidType', '2', 1.0)
    expect(result.ok).to.equal(false)
    if (!result.ok) {
      expect(result.error.code).to.equal('riven.weaponTypeError')
    }
  })

  it('should accept Chinese weapon type names', async () => {
    const result = await getStaticRivenStats('步枪', '2', 1.0)
    expect(result.ok).to.equal(true)
  })

  it('should accept English weapon type names', async () => {
    const result = await getStaticRivenStats('Rifle', '2', 1.0)
    expect(result.ok).to.equal(true)
  })

  it('should return error for invalid stat type', async () => {
    const result = await getStaticRivenStats('步枪', '99', 1.0)
    expect(result.ok).to.equal(false)
    if (!result.ok) {
      expect(result.error.code).to.equal('riven.statTypeError')
    }
  })

  it('should accept valid stat types (2, 3, 21, 31)', async () => {
    for (const statType of ['2', '3', '21', '31']) {
      const result = await getStaticRivenStats('步枪', statType, 1.0)
      expect(result.ok).to.equal(true)
    }
  })

  it('should include positive stats for type "2"', async () => {
    const result = expectRivenStatResult(
      await getStaticRivenStats('步枪', '2', 1.0),
    )
    expect(result.positive).to.be.an('object')
    expect(Object.keys(result.positive).length).to.be.greaterThan(0)
  })

  it('should not include negative stats for type "2" (no curse)', async () => {
    const result = expectRivenStatResult(
      await getStaticRivenStats('步枪', '2', 1.0),
    )
    expect(result.negative).to.equal(undefined)
  })

  it('should include negative stats for type "21" (1 curse)', async () => {
    const result = expectRivenStatResult(
      await getStaticRivenStats('步枪', '21', 1.0),
    )
    expect(result.negative).to.be.an('object')
    expect(Object.keys(result.negative!).length).to.be.greaterThan(0)
  })

  it('should include negative stats for type "31" (1 curse)', async () => {
    const result = expectRivenStatResult(
      await getStaticRivenStats('步枪', '31', 1.0),
    )
    expect(result.negative).to.be.an('object')
  })

  it('each positive stat should have name, max, min, unit', async () => {
    const result = expectRivenStatResult(
      await getStaticRivenStats('步枪', '2', 1.0),
    )
    for (const key in result.positive) {
      const stat = result.positive[key]
      expect(stat).to.have.property('name')
      expect(stat).to.have.property('max')
      expect(stat).to.have.property('min')
      expect(stat).to.have.property('unit')
    }
  })
})
