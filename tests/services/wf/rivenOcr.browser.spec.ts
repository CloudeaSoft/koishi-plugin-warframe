import { expect } from 'chai'
import { parseRivenOcr } from '../../../src/warframe/services/riven/ocr'
import samples from '../../assets/riven-ocr/browser-2026-10-26/recorded.json'

describe('browser-discovered low-quality riven photos', () => {
  const sample = samples[0]

  it('keeps all four stats when a complete heavy-attack annotation occupies its own row', () => {
    const parsed = parseRivenOcr(sample.blocks)
    expect(parsed?.name).to.equal('Arca Titron')
    expect(parsed?.attributes.map(a => [a.attr.gameRef, a.value, a.prefix])).to.deep.equal(sample.expected!.stats)
  })

  it('requires the complete known annotation, immediately below the appropriate stat', () => {
    for (const text of ['(x3 for Heavy Attacks)', 'x2 for Heavy Attacks', '(x2 for Bows)', '(x2 for Heavy Attacks) 25', '+25% Damage', '(x2 for Heavy Attacks) +25% Damage']) {
      const blocks = sample.blocks.map(b => b.text === '(x2 for Heavy Attacks)' ? { ...b, text } : b)
      expect(parseRivenOcr(blocks), text).to.equal(undefined)
    }
    const wrongStat = sample.blocks.map(b => b.text === '+227% Critical Chance' ? { ...b, text: '+227% Damage' } : b)
    expect(parseRivenOcr(wrongStat)).to.equal(undefined)
    expect(parseRivenOcr(['Burston', '+100% Critical Chance', '(x2 for Heavy Attacks)', '+50% Multishot'])).to.equal(undefined)
    for (const offset of [{ x: 200 }, { y: 350 }]) {
      const blocks = sample.blocks.map(b => b.text === '(x2 for Heavy Attacks)' ? { ...b, box: { ...b.box, ...offset } } : b)
      expect(parseRivenOcr(blocks)).to.equal(undefined)
    }
  })

  it('accepts the Chinese standalone annotation with the same field preservation', () => {
    const blocks = sample.blocks.map(b => b.text === '(x2 for Heavy Attacks)' ? { ...b, text: '（重击时×2）' } : b)
    expect(parseRivenOcr(blocks)?.attributes.map(a => a.value)).to.deep.equal([227, 101.7, 87.1, -80])
  })

  it('preserves signs and values under reversed OCR order and scaled coordinates', () => {
    const blocks = sample.blocks.toReversed().map(b => ({ ...b, box: {
      x: b.box.x * 2 + 60,
      y: b.box.y * 2 + 40,
      width: b.box.width * 2,
      height: b.box.height * 2,
    } }))
    expect(parseRivenOcr(blocks)?.attributes.map(a => [a.attr.gameRef, a.value, a.prefix])).to.deep.equal(sample.expected!.stats)
  })

  for (const rejected of samples.filter(s => s.rejection)) {
    it(`rejects ${rejected.id} without guessing names or choosing a card`, () => {
      expect(parseRivenOcr(rejected.blocks, rejected.fallbackBlocks)).to.equal(undefined)
    })
  }
})
