import { expect } from 'chai'
import { analyzeRivenStat, parseOCRResult } from '../../../src/warframe/services/wf-service/wf-service.riven'
import corpus from '../../assets/riven-ocr/corpus.json'

describe('riven screenshot OCR recovery', () => {
  it('reads locked faction multipliers without changing their value', async () => {
    for (const prefix of ['6x', '6X', '6×', '🔒x']) {
      const parsed = await parseOCRResult(['托里德', '+176.4%暴击几率', '+99.7%毒素伤害', `${prefix}0.63对Infested的伤害`])
      expect(parsed?.attributes.map(a => [a.attr.gameRef, a.value, a.prefix]), prefix).to.deep.equal([
        ['WeaponCritChanceMod', 176.4, '+'],
        ['WeaponToxinDamageMod', 99.7, '+'],
        ['WeaponFactionDamageInfested', 0.63, 'x'],
      ])
    }
  })

  it('joins an exact wrapped stat label independently of block order and scale', async () => {
    const sample = corpus.find(s => s.id === 'torid-wrapped-faction')!
    const blocks = sample.blocks.toReversed().map(b => ({ ...b, box: {
      x: b.box.x * 2 + 100,
      y: b.box.y * 2 + 50,
      width: b.box.width * 2,
      height: b.box.height * 2,
    } }))
    const parsed = await parseOCRResult(blocks)
    expect(parsed?.attributes.map(a => [a.attr.gameRef, a.value, a.prefix])).to.deep.equal(sample.expected.stats)
  })

  it('does not absorb numeric, unknown, or spatially unrelated label continuations', async () => {
    const sample = corpus.find(s => s.id === 'torid-wrapped-faction')!
    const tail = sample.blocks.find(b => b.text === '害')!
    for (const replacement of [
      { ...tail, text: '害1' },
      { ...tail, text: '+25%伤害' },
      { ...tail, text: '未知' },
      { ...tail, box: { ...tail.box, x: 800 } },
      { ...tail, box: { ...tail.box, y: 730 } },
    ]) {
      const blocks = sample.blocks.map(b => b === tail ? replacement : b)
      expect(await parseOCRResult(blocks), JSON.stringify(replacement)).to.equal(undefined)
    }
    expect(await parseOCRResult(['托里德', '+176.4%暴击几率', '+99.7%毒素伤害', '66x0.63对Infested伤害'])).to.equal(undefined)
    expect(await parseOCRResult(['托里德', '+176.4%暴击几率', '+99.7%毒素伤害', 'x0.63对Infested伤害', '害'])).to.equal(undefined)
  })

  it('uses relative geometry independently of block order and screenshot scale', async () => {
    const sample = corpus.find(s => s.id === 'new-6')!
    const blocks = sample.blocks.toReversed().map(b => ({ ...b, box: {
      x: b.box.x * 2 + 100,
      y: b.box.y * 2 + 50,
      width: b.box.width * 2,
      height: b.box.height * 2,
    } }))
    const parsed = await parseOCRResult(blocks)
    expect(parsed?.attributes.map(e => [e.attr.gameRef, e.value, e.prefix])).to.deep.equal(sample.expected.stats)
  })

  for (const sample of corpus.filter(s => !['new-2', 'new-6', 'sobek-cursor', 'locked-corrosive-icon'].includes(s.id))) {
    it(`reads every field from ${sample.id}, including icons and title decorations`, async () => {
      const parsed = await parseOCRResult(sample.blocks.map(b => b.text))
      expect(parsed?.name).to.equal(sample.expected.name)
      expect(parsed?.attributes.map(e => [e.attr.gameRef, e.value, e.prefix])).to.deep.equal(sample.expected.stats)
      expect(analyzeRivenStat(parsed!).ok).to.equal(true)
    })
  }

  it('rejects detached values without coordinates instead of grading fewer attributes', async () => {
    for (const id of ['new-2', 'new-6', 'locked-corrosive-icon']) {
      const sample = corpus.find(s => s.id === id)!
      expect(await parseOCRResult(sample.blocks.map(b => b.text)), id).to.equal(undefined)
    }
  })

  it('recovers a corrosive icon beside locked stats without changing signs or values', async () => {
    const sample = corpus.find(s => s.id === 'locked-corrosive-icon')!
    const blocks = sample.blocks.toReversed().map(b => ({ ...b, box: {
      x: b.box.x * 2 + 100,
      y: b.box.y * 2 + 50,
      width: b.box.width * 2,
      height: b.box.height * 2,
    } }))
    const spatial = await parseOCRResult(blocks)
    expect(spatial?.attributes.map(e => [e.attr.gameRef, e.value, e.prefix])).to.deep.equal(sample.expected.stats)
    const inline = await parseOCRResult(['奏凯 Geli-coritin', '+45.3%冰冻伤害', '6+43%心腐蚀伤害', '+21.5%弹匣容量', '6-59.2%暴击几率'])
    expect(inline?.attributes.map(e => [e.attr.gameRef, e.value, e.prefix])).to.deep.equal(sample.expected.stats)
  })

  it('only treats the observed heart glyph as an icon before an exact corrosive label', async () => {
    for (const label of ['心冰冻伤害', '心毒素伤害', '心心腐蚀伤害', '怂腐蚀伤害', '心腐蚀伤害1', '心腐蚀伤害+']) {
      expect(await parseOCRResult(['奏凯', `+43%${label}`, '+21.5%弹匣容量', '-59.2%暴击几率']), label).to.equal(undefined)
    }
    const sample = corpus.find(s => s.id === 'locked-corrosive-icon')!
    for (const text of ['1', '+', '-']) {
      const blocks = sample.blocks.map(b => b.text === '心' ? { ...b, text } : b)
      expect(await parseOCRResult(blocks), text).to.equal(undefined)
    }
    const missingSign = sample.blocks.map(b => b.text === '6+43%' ? { ...b, text: '43%' } : b)
    expect(await parseOCRResult(missingSign)).to.equal(undefined)
  })

  it('requires footer geometry before discarding a low-confidence cursor glyph', async () => {
    const sample = corpus.find(s => s.id === 'sobek-cursor')!
    expect(await parseOCRResult(sample.blocks.map(b => b.text))).to.equal(undefined)
    const cursor = sample.blocks.find(b => b.text === '压')!
    for (const replacement of [
      { ...cursor, confidence: 99 },
      { ...cursor, confidence: undefined },
      { ...cursor, text: '+25%' },
      { ...cursor, text: '25' },
      { ...cursor, text: '触发几率' },
      { ...cursor, box: { ...cursor.box, x: 200 } },
      { ...cursor, box: { ...cursor.box, y: 600 } },
    ]) {
      const blocks = sample.blocks.map(b => b === cursor ? replacement : b)
      expect(await parseOCRResult(blocks), JSON.stringify(replacement)).to.equal(undefined)
    }
    expect(await parseOCRResult(sample.blocks.filter(b => b.text !== '段位10'))).to.equal(undefined)
    expect(await parseOCRResult(sample.blocks.filter(b => !['5', '82'].includes(b.text)))).to.equal(undefined)
  })

  it('recognizes footer cursor noise independently of character, order and scale', async () => {
    const sample = corpus.find(s => s.id === 'sobek-cursor')!
    const blocks = sample.blocks.toReversed().map(b => ({ ...b, text: b.text === '压' ? '匚' : b.text, box: {
      x: b.box.x * 2 + 100,
      y: b.box.y * 2 + 50,
      width: b.box.width * 2,
      height: b.box.height * 2,
    } }))
    const parsed = await parseOCRResult(blocks)
    expect(parsed?.attributes.map(e => [e.attr.gameRef, e.value, e.prefix])).to.deep.equal(sample.expected.stats)
  })

  it('does not discard an unreadable extra attribute', async () => {
    for (const fragment of ['+25%', '+25', '-25', '25', '暴击几率', '+1.2.3%触发几率', '+25%未知词条', '+25%伤害乱码']) {
      expect(await parseOCRResult(['螺钉步枪', '+150%暴击几率', '+100%暴击伤害', fragment]), fragment).to.equal(undefined)
    }
  })

  it('rejects stat fragments before the title and missing signs in spatial OCR', async () => {
    expect(await parseOCRResult(['+25%触发几率', '螺钉步枪', '+150%暴击几率', '+100%暴击伤害'])).to.equal(undefined)
    const sample = corpus.find(s => s.id === 'new-3')!
    const blocks = sample.blocks.map(b => ({ ...b, text: b.text.replace('+95.4%', '95.4%') }))
    expect(await parseOCRResult(blocks)).to.equal(undefined)
  })

  it('rejects competing numbers, unknown occluded labels and distant columns', async () => {
    const sample = corpus.find(s => s.id === 'new-6')!
    const changedOverlay = sample.blocks.map(b => b.text === '173%' ? { ...b, box: { ...b.box, height: 28 } } : b)
    const ambiguousLabel = sample.blocks.map(b => b.text === '状态伤害' ? { ...b, text: '击伤害' } : b)
    const distantColumn = sample.blocks.map(b => b.text === '状态伤害' ? { ...b, box: { ...b.box, x: 800 } } : b)
    for (const blocks of [changedOverlay, ambiguousLabel, distantColumn]) {
      expect(await parseOCRResult(blocks)).to.equal(undefined)
    }
  })

  it('never absorbs numeric fragments into an attribute label through fuzzy matching', async () => {
    for (const label of ['触发几率1', '触发几率%', '暴击伤害+', '暴击伤害.']) {
      expect(await parseOCRResult(['螺钉步枪', '+150%暴击几率', `+100%${label}`]), label).to.equal(undefined)
    }
    const blocks = [
      { text: '螺钉步枪', box: { x: 0, y: 0, width: 100, height: 20 } },
      { text: '+150%暴击几率', box: { x: 0, y: 30, width: 100, height: 20 } },
      { text: '+100%暴击伤害', box: { x: 0, y: 60, width: 100, height: 20 } },
      { text: '1', box: { x: 105, y: 60, width: 10, height: 20 } },
    ]
    expect(await parseOCRResult(blocks)).to.equal(undefined)
  })

  it('rejects side-by-side English titles instead of treating a weapon as a riven suffix', async () => {
    const blocks = [
      { text: 'Boltor', box: { x: 0, y: 0, width: 60, height: 20 } },
      { text: 'Strun', box: { x: 130, y: 0, width: 50, height: 20 } },
      { text: '+150%暴击几率', box: { x: 0, y: 30, width: 100, height: 20 } },
      { text: '+100%暴击伤害', box: { x: 130, y: 60, width: 100, height: 20 } },
    ]
    expect(await parseOCRResult(blocks)).to.equal(undefined)
    expect(await parseOCRResult(['Boltor Strun', '+150%暴击几率', '+100%暴击伤害'])).to.equal(undefined)
    expect(await parseOCRResult(['Boltor Braton', '+150%暴击几率', '+100%暴击伤害'])).to.equal(undefined)
  })

  it('rejects mixed coordinates instead of dropping a stat sorted before the title', async () => {
    const blocks = [
      { text: '25', box: { x: 0, y: 90, width: 20, height: 20 } },
      { text: '触发几率', box: { x: 25, y: 90, width: 100, height: 20 } },
      { text: '螺钉步枪', box: { x: 0, y: 0, width: 180, height: 20 } },
      { text: '+150%暴击几率', box: { x: 0, y: 30, width: 180, height: 20 } },
      { text: '+100%暴击伤害', box: { x: 0, y: 60, width: 180, height: 20 } },
      { text: '段位12' },
    ]
    expect(await parseOCRResult(blocks)).to.equal(undefined)
  })

  it('recognizes English conditional annotations without treating them as values', async () => {
    const parsed = await parseOCRResult(['Boltor Acri-cron', '+150%Critical Chance', '+100%Fire Rate (x2 for Bows)'])
    expect(parsed?.attributes.map(a => a.value)).to.deep.equal([150, 100])
  })

  it('rejects conflicting titles, duplicate stats and ambiguous truncated labels', async () => {
    for (const lines of [
      ['螺钉步枪', '野猪', '+150%暴击几率', '+100%暴击伤害'],
      ['螺钉步枪', '+150%暴击几率', '+100%暴击伤害', '+100%暴击伤害'],
      ['螺钉步枪', '+150%暴击几率', '+100%击伤害'],
      ['螺钉步枪', '+150%暴击几率', '+100%未知暴击伤害'],
    ]) {
      expect(await parseOCRResult(lines)).to.equal(undefined)
    }
  })

  it('keeps numbered and English weapon names with a riven suffix', async () => {
    for (const name of ['MK1-盗贼', 'Boltor', 'Catchmoon']) {
      const parsed = await parseOCRResult([`${name} Acri-cron`, '+150%暴击几率', '+100%暴击伤害'])
      expect(parsed?.name).to.equal(name)
    }
  })

  it('analyzes the observed shotgun zoom curse without enabling a positive zoom stat', async () => {
    const negative = await parseOCRResult(['斯特朗', '+120.6%暴击伤害', '+163.9%多重射击', '-48.3%变焦'])
    const result = analyzeRivenStat(negative!)
    expect(result.ok).to.equal(true)
    if (result.ok) {
      expect(result.data.curses?.[0].value).to.equal(-48.3)
      expect(result.data.notes?.length).to.be.greaterThan(0)
    }
    const positive = await parseOCRResult(['斯特朗', '+120.6%暴击伤害', '+163.9%多重射击', '+48.3%变焦'])
    expect(analyzeRivenStat(positive!).ok).to.equal(false)
  })
})
