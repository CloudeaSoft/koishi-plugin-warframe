import { expect } from 'chai'
import { overrideGlobalRivenAttribute } from '../../../src/warframe/data/wfm/globalRivenAttribute'
import { analyzeRivenStat, getStaticRivenStats, parseOCRResult } from '../../../src/warframe/services'
import { createAsyncCache } from '../../../src/warframe/utils'

describe('official spliced riven calculations', () => {
  beforeAll(() => {
    overrideGlobalRivenAttribute(createAsyncCache(async () => ({ globalRivenAttributeList: [], globalRivenAttributeDict: {} }), -1))
  })

  it('calculates weakpoint and reversed ammo efficiency without WFM metadata', async () => {
    const result = await getStaticRivenStats('Shotgun', '31', 1.33)
    expect(result.ok).to.equal(true)
    if (!result.ok) {
      throw new Error(result.error.code)
    }
    expect(result.data.positive.weakpointdamage?.min).to.be.closeTo(252.4921875, 0.00001)
    expect(result.data.positive.ammoefficiency?.min).to.be.closeTo(50.4984375, 0.00001)
    expect(result.data.positive.ammoefficiency?.unit).to.equal('percent')
    expect(result.data.negative).not.to.have.property('weakpointdamage')
    expect(result.data.negative).not.to.have.property('ammoefficiency')
  })

  it('uses official traditional values and accepts Kitgun and Zaw', async () => {
    for (const category of ['Kitgun', 'Zaw']) {
      expect((await getStaticRivenStats(category, '2', 1)).ok).to.equal(true)
    }
    const result = await getStaticRivenStats('Rifle', '2', 1)
    if (!result.ok) {
      throw new Error(result.error.code)
    }
    expect(result.data.positive.damage.min).to.be.closeTo(147.014724681, 0.0000001)
  })

  it('does not fabricate missing or unverified ranges', async () => {
    const archgun = await getStaticRivenStats('Archgun', '31', 1)
    const melee = await getStaticRivenStats('Melee', '31', 1)
    if (!archgun.ok || !melee.ok) {
      throw new Error('expected ranges')
    }
    expect(archgun.data.positive).not.to.have.property('magazinereloaded/swhenholstered')
    expect(melee.data.positive).not.to.have.property('parryangle')
    expect(melee.data.notes?.join('')).to.include('格挡')
  })

  it('rejects nonfinite dispositions and empty weapon categories', async () => {
    for (const value of [NaN, Infinity, -Infinity]) {
      expect((await getStaticRivenStats('Rifle', '2', value)).ok).to.equal(false)
    }
    expect((await getStaticRivenStats('', '2', 1)).ok).to.equal(false)
  })

  it('recognizes specific new attributes before their traditional substrings', async () => {
    const parsed = await parseOCRResult(['螺钉步枪', '+300%弱点暴击几率', '+50%异常状态伤害', '-20%暴击伤害'])
    expect(parsed?.attributes.map(x => x.attr.gameRef)).to.deep.equal([
      'WeaponWeakpointCriticalChance',
      'WeaponStatusDamage',
      'WeaponCritDamageMod',
    ])
    const result = analyzeRivenStat(parsed!)
    expect(result.ok).to.equal(true)
    if (!result.ok) {
      throw new Error(result.error.code)
    }
    expect(result.data.buffs.length).to.equal(2)
    expect(result.data.curses.length).to.equal(1)
  })

  it('handles faction multipliers and negative recoil by their effect sign', async () => {
    const parsed = await parseOCRResult(['螺钉步枪', '×1.6 对 Orokin 的伤害', '-100%武器后坐力', '+150%暴击几率'])
    expect(parsed?.attributes.length).to.equal(3)
    const result = analyzeRivenStat(parsed!)
    if (!result.ok) {
      throw new Error(result.error.code)
    }
    expect(result.data.buffs.length).to.equal(3)
    expect(result.data.curses.length).to.equal(0)
    expect(result.data.buffs[0].min).to.be.closeTo(1.394875, 0.00001)
  })

  it('rejects partial OCR instead of grading a card after silently dropping a stat', async () => {
    expect(await parseOCRResult(['螺钉步枪', '+150%暴击几率', '+100%暴击伤害', '+25%未知词条'])).to.equal(undefined)
  })

  it('rejects unverified parry angle analysis explicitly', async () => {
    const parsed = await parseOCRResult(['空刃', '+65格挡角度', '+100%暴击几率'])
    expect(parsed).not.to.equal(undefined)
    const result = analyzeRivenStat(parsed!)
    expect(result.ok).to.equal(false)
    if (!result.ok) {
      expect(result.error.code).to.equal('riven.unverifiedStat')
    }
  })

  it('ignores rank metadata while still rejecting unknown stat lines', async () => {
    const parsed = await parseOCRResult(['螺钉步枪', '+150%暴击几率', '+100%暴击伤害', '15段位'])
    expect(parsed?.attributes.length).to.equal(2)
  })

  it('requires a Kitgun variant and applies the selected official disposition', async () => {
    const parsed = await parseOCRResult(['捕月', '+150%暴击几率', '+100%暴击伤害'])
    expect(parsed).not.to.equal(undefined)
    const ambiguous = analyzeRivenStat(parsed!)
    expect(ambiguous.ok).to.equal(false)
    if (!ambiguous.ok) {
      expect(ambiguous.error.code).to.equal('riven.variantRequired')
    }
    const primary = analyzeRivenStat(parsed!, 'primary')
    const secondary = analyzeRivenStat(parsed!, 'secondary')
    if (!primary.ok || !secondary.ok) {
      throw new Error('expected Kitgun variants')
    }
    expect(primary.data.disposition).to.equal(1.1)
    expect(secondary.data.disposition).to.equal(0.75)
  })

  it('preserves an English Kitgun name for explicit variant selection', async () => {
    const parsed = await parseOCRResult(['Catchmoon', '+150%Critical Chance', '+100%Critical Damage'])
    expect(parsed?.name).to.equal('Catchmoon')
    const result = analyzeRivenStat(parsed!, 'primary')
    expect(result.ok).to.equal(true)
  })

  it('recognizes localized names of the new factions', async () => {
    const parsed = await parseOCRResult(['螺钉步枪', '×1.5对奥罗金的伤害', '×1.5对科腐者的伤害', '×1.5对炽蛇军的伤害'])
    expect(parsed?.attributes.map(entry => entry.attr.gameRef)).to.deep.equal([
      'WeaponFactionDamageOrokin',
      'WeaponFactionDamageTechrot',
      'WeaponFactionDamageScaldra',
    ])
  })

  it('reads the leading value instead of a conditional x2 annotation', async () => {
    const parsed = await parseOCRResult(['空刃', '+150%暴击几率(重击时x2)', '+100%暴击伤害'])
    expect(parsed?.attributes[0].value).to.equal(150)
  })
})
