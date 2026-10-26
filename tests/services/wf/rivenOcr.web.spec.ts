import { expect } from 'chai'
import { parseRivenOcr } from '../../../src/warframe/services/riven/ocr'
import samples from '../../assets/riven-ocr/web-2026-10-26/recorded.json'

describe('public low-quality riven images', () => {
  for (const sample of samples) {
    it(`preserves every field of ${sample.id}`, () => {
      const parsed = parseRivenOcr(sample.blocks, sample.fallbackBlocks)
      expect(parsed?.name).to.equal(sample.expected.name)
      expect(parsed?.attributes.map(a => [a.attr.gameRef, a.value, a.prefix])).to.deep.equal(sample.expected.stats)
    })
  }

  it('recognizes the English mastery footer without treating the rank as a stat', () => {
    const parsed = parseRivenOcr(['Furis', '+97.4%Heat', '+142.2%Multishot', 'MR 12', '32'])
    expect(parsed?.attributes.map(a => a.value)).to.deep.equal([97.4, 142.2])
    expect(parseRivenOcr(['Furis', '+97.4%Heat', '+142.2%Multishot', 'MR unknown'])).to.equal(undefined)
  })

  it('requires the footer and separated reroll controls before excluding the screen surroundings', () => {
    const sample = samples[3]
    for (const omitted of ['MR 12', 'CYCLE FOR 3,500T', 'Remaining Kuva:13,300']) {
      expect(parseRivenOcr(sample.blocks.filter(b => b.text !== omitted)), omitted).to.equal(undefined)
    }
    const insideCard = sample.blocks.map(b => b.text.startsWith('CYCLE') ? { ...b, box: { ...b.box, y: 2800 } } : b)
    expect(parseRivenOcr(insideCard)).to.equal(undefined)
    for (const text of ['+25%Damage', '-25%', '25%Damage', 'x', '×', '25.5', '25 Damage', 'Critical', 'Efficiency', 'Multishot', 'Boltor Acri-cron']) {
      const otherCard = sample.blocks.map(b => b.text === 'DELL' ? { ...b, text } : b)
      expect(parseRivenOcr(otherCard), text).to.equal(undefined)
    }
  })

  it('requires a spatial heat icon, not arbitrary punctuation or a missing sign', () => {
    const sample = samples[0]
    for (const text of ['+', '-', '1', '%']) {
      expect(parseRivenOcr(sample.blocks.map(b => b.text === '^' ? { ...b, text } : b)), text).to.equal(undefined)
    }
    const noSign = sample.blocks.map(b => b.text === '+99.7%' ? { ...b, text: '99.7%' } : b)
    expect(parseRivenOcr(noSign)).to.equal(undefined)
    const wrongLabel = sample.blocks.map(b => b.text === 'Heat' ? { ...b, text: 'Cold' } : b)
    expect(parseRivenOcr(wrongLabel)).to.equal(undefined)
    expect(parseRivenOcr(sample.blocks.map(b => b.text))).to.equal(undefined)
  })

  it('only corrects a wrapped Latin suffix before the first attribute', () => {
    const sample = samples[2]
    for (const text of ['unknown', 'enitis1', '+139.1%Multishot', 'Boltor']) {
      const fallback = sample.fallbackBlocks.map(b => b.text === 'enitis' ? { ...b, text } : b)
      expect(parseRivenOcr(sample.blocks, fallback), text).to.equal(undefined)
    }
    const detached = sample.fallbackBlocks.map(b => b.text === 'enitis' ? { ...b, box: { ...b.box, x: 3000 } } : b)
    expect(parseRivenOcr(sample.blocks, detached)).to.equal(undefined)
    const afterStat = sample.blocks.map(b => b.text === 'entitis' ? { ...b, box: { ...b.box, y: 2400 } } : b)
    expect(parseRivenOcr(afterStat, sample.fallbackBlocks)).to.equal(undefined)
  })

  it('preserves fields across OCR order and coordinate scale changes', () => {
    for (const sample of samples) {
      const transform = (blocks: typeof sample.blocks) => blocks.toReversed().map(b => ({ ...b, box: {
        x: b.box.x * 0.5 + 80,
        y: b.box.y * 0.5 + 40,
        width: b.box.width * 0.5,
        height: b.box.height * 0.5,
      } }))
      const parsed = parseRivenOcr(transform(sample.blocks), transform(sample.fallbackBlocks))
      expect(parsed?.name, sample.id).to.equal(sample.expected.name)
      expect(parsed?.attributes.map(a => [a.attr.gameRef, a.value, a.prefix]), sample.id).to.deep.equal(sample.expected.stats)
    }
  })
})
