import { expect } from 'chai'
import { parseOCRResult } from '../../../src/warframe/services/wf-service/wf-service.riven'
import evaluation from '../../assets/riven-ocr/community-2026-10-21/evaluation.json'
import recorded from '../../assets/riven-ocr/community-2026-10-21/recorded.json'

describe('community riven OCR fields without disposition range checks', () => {
  for (const sample of evaluation.cases.filter(s => s.inScope)) {
    it(`preserves every field in ${sample.image}`, async () => {
      const blocks = recorded.find(r => r.image === sample.image)!.blocks
      const parsed = await parseOCRResult(blocks)
      expect(parsed?.name).to.equal(sample.weapon)
      expect(parsed?.attributes.map(a => ({
        gameRef: a.attr.gameRef,
        value: a.value,
        prefix: a.prefix,
        unit: a.attr.unit,
      }))).to.deep.equal(sample.expected)
    })
  }

  it('joins known conditional annotations split before or inside their multiplier', async () => {
    for (const [first, second] of [
      ['（重击时', 'x2）'],
      ['（重击时×', '2）'],
      ['(', 'x2 for Heavy Attacks)'],
      ['(x2', 'for Heavy Attacks)'],
    ]) {
      const parsed = await parseOCRResult(['战刃', '+65.4%暴击伤害', `+142%暴击几率${first}`, second, '-77.4%处决伤害'])
      expect(parsed?.attributes.map(a => [a.attr.gameRef, a.value, a.prefix]), `${first}\n${second}`).to.deep.equal([
        ['WeaponCritDamageMod', 65.4, '+'],
        ['WeaponCritChanceMod', 142, '+'],
        ['WeaponMeleeFinisherDamageMod', -77.4, '-'],
      ])
    }
  })

  it('does not absorb actual stats or unknown numeric fragments into an annotation', async () => {
    for (const continuation of ['x1.2对Infested伤害', '+25%伤害', 'x2)+25%触发几率', 'x3)', 'x2)乱码']) {
      expect(await parseOCRResult(['战刃', '+65.4%暴击伤害', '+142%暴击几率(重击时', continuation]), continuation).to.equal(undefined)
    }
    expect(await parseOCRResult(['战刃', '+65.4%暴击伤害', '+142%暴击几率', 'x2)'])).to.equal(undefined)
  })

  it('continues to reject the excluded legacy percentage faction format', async () => {
    expect(await parseOCRResult(['月神', '+73.1%暴击几率', '+46.8%火焰伤害', '+49.7%多重射击', '-19.7%对Infested伤害'])).to.equal(undefined)
  })
})
