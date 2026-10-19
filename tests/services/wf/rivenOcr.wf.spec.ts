import { expect } from 'chai'
import { analyzeRivenStat, parseOCRResult } from '../../../src/warframe/services/wf-service/wf-service.riven'
import corpus from '../../assets/riven-ocr/corpus.json'

describe('riven screenshot OCR recovery', () => {
  for (const sample of corpus) {
    it(`restores spatial fragments and exact fields from ${sample.id}`, async () => {
      const parsed = await parseOCRResult(sample.blocks)
      expect(parsed?.name).to.equal(sample.expected.name)
      expect(parsed?.attributes.map(e => [e.attr.gameRef, e.value, e.prefix])).to.deep.equal(sample.expected.stats)
      expect(analyzeRivenStat(parsed!).ok).to.equal(true)
    })
  }

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

  for (const sample of corpus.filter(s => !['new-2', 'new-6'].includes(s.id))) {
    it(`reads every field from ${sample.id}, including icons and title decorations`, async () => {
      const parsed = await parseOCRResult(sample.blocks.map(b => b.text))
      expect(parsed?.name).to.equal(sample.expected.name)
      expect(parsed?.attributes.map(e => [e.attr.gameRef, e.value, e.prefix])).to.deep.equal(sample.expected.stats)
      expect(analyzeRivenStat(parsed!).ok).to.equal(true)
    })
  }

  it('rejects detached values without coordinates instead of grading fewer attributes', async () => {
    for (const id of ['new-2', 'new-6']) {
      const sample = corpus.find(s => s.id === id)!
      expect(await parseOCRResult(sample.blocks.map(b => b.text)), id).to.equal(undefined)
    }
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
