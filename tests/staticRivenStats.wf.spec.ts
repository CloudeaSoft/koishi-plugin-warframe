import type { RivenAttribute } from '../src/types/wfm';
import { expect } from 'chai';
import {
  globalRivenAttributeFactory,
  overrideGlobalRivenAttribute,
} from '../src/data/wfm/globalRivenAttribute';
import { getStaticRivenStats } from '../src/services';
import { createAsyncCache } from '../src/utils';

const fixtureAttrs: RivenAttribute[] = [
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
]

function expectRivenStatResult(
  value: unknown,
): { positive: Record<string, unknown>, negative?: Record<string, unknown> } {
  expect(value).to.not.be.a('string')
  return value as {
    positive: Record<string, unknown>
    negative?: Record<string, unknown>
  }
}

describe('getStaticRivenStats Tests', function () {
  this.timeout(10000)

  before(() => {
    overrideGlobalRivenAttribute(
      createAsyncCache(async () => {
        return await globalRivenAttributeFactory(fixtureAttrs)
      }, -1),
    )
  })

  it('should return error for disposition > 1.55', async () => {
    const result = await getStaticRivenStats('步枪', '2', 1.6)
    expect(result).to.equal('裂罅倾向错误')
  })

  it('should return error for disposition < 0.5', async () => {
    const result = await getStaticRivenStats('步枪', '2', 0.4)
    expect(result).to.equal('裂罅倾向错误')
  })

  it('should accept disposition boundary values (0.5 and 1.55)', async () => {
    const r1 = await getStaticRivenStats('步枪', '2', 0.5)
    expect(r1).to.not.be.a('string')

    const r2 = await getStaticRivenStats('步枪', '2', 1.55)
    expect(r2).to.not.be.a('string')
  })

  it('should return error for invalid weapon type', async () => {
    const result = await getStaticRivenStats('InvalidType', '2', 1.0)
    expect(result).to.equal('武器类型错误')
  })

  it('should accept Chinese weapon type names', async () => {
    const result = await getStaticRivenStats('步枪', '2', 1.0)
    expect(result).to.not.be.a('string')
  })

  it('should accept English weapon type names', async () => {
    const result = await getStaticRivenStats('Rifle', '2', 1.0)
    expect(result).to.not.be.a('string')
  })

  it('should return error for invalid stat type', async () => {
    const result = await getStaticRivenStats('步枪', '99', 1.0)
    expect(result).to.equal('词条类型错误')
  })

  it('should accept valid stat types (2, 3, 21, 31)', async () => {
    for (const statType of ['2', '3', '21', '31']) {
      const result = await getStaticRivenStats('步枪', statType, 1.0)
      expect(result).to.not.be.a('string')
    }
  })

  it('should include positive stats for type '2'', async () => {
    const result = expectRivenStatResult(
      await getStaticRivenStats('步枪', '2', 1.0),
    )
    expect(result.positive).to.be.an('object')
    expect(Object.keys(result.positive).length).to.be.greaterThan(0)
  })

  it('should not include negative stats for type '2' (no curse)', async () => {
    const result = expectRivenStatResult(
      await getStaticRivenStats('步枪', '2', 1.0),
    )
    expect(result.negative).to.equal(undefined)
  })

  it('should include negative stats for type '21' (1 curse)', async () => {
    const result = expectRivenStatResult(
      await getStaticRivenStats('步枪', '21', 1.0),
    )
    expect(result.negative).to.be.an('object')
    expect(Object.keys(result.negative).length).to.be.greaterThan(0)
  })

  it('should include negative stats for type '31' (1 curse)', async () => {
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
