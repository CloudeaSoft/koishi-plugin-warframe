import { expect } from 'chai'
import { parseRivenOcr } from '../../../src/warframe/services/riven/ocr'
import feishu from '../../assets/riven-ocr/feishu-2026-10-26/recorded.json'

describe('feishu screenshots: card decoration recovery', () => {
  for (const sample of feishu.filter(s => ['feishu-3', 'feishu-4', 'feishu-6', 'feishu-7'].includes(s.id))) {
    it(`recovers missing labels or suffixes using a second reading of ${sample.id}`, () => {
      expect(parseRivenOcr(sample.blocks)).to.equal(undefined)
      const parsed = parseRivenOcr(sample.blocks, sample.fallbackBlocks)
      expect(parsed?.name).to.equal(sample.expected.name)
      expect(parsed?.attributes.map(a => [a.attr.gameRef, a.value, a.prefix])).to.deep.equal(sample.expected.stats)
    })
  }

  it('does not borrow names from a different value, sign, row, or ambiguous reading', () => {
    const sample = feishu[2]
    const target = sample.fallbackBlocks.find(b => b.text.includes('127.1'))!
    for (const replacement of [
      { ...target, text: '+127.2%多重射击' },
      { ...target, text: '-127.1%多重射击' },
      { ...target, text: '127.1%多重射击' },
      { ...target, text: '+127.1多重射击' },
      { ...target, text: '+127.1%未知词条' },
      { ...target, box: { ...target.box, x: 1000 } },
      { ...target, box: { ...target.box, y: target.box.y + 50 } },
    ]) {
      expect(parseRivenOcr(sample.blocks, sample.fallbackBlocks.map(b => b === target ? replacement : b)), JSON.stringify(replacement)).to.equal(undefined)
    }
    expect(parseRivenOcr(sample.blocks, [...sample.fallbackBlocks, { ...target, text: '+127.1%暴击伤害' }])).to.equal(undefined)
    expect(parseRivenOcr(sample.blocks.map(b => ({ text: b.text })), sample.fallbackBlocks)).to.equal(undefined)
  })

  it('does not replace a missing sign or a different weapon using fallback OCR', () => {
    const sample = feishu[5]
    const unsigned = sample.blocks.map(b => b.text === '+146.6%' ? { ...b, text: '146.6%' } : b)
    expect(parseRivenOcr(unsigned, sample.fallbackBlocks)).to.equal(undefined)
    const otherWeapon = sample.fallbackBlocks.map(b => b.text.includes('葬铭') ? { ...b, text: '奏凯 Sati-toxitis' } : b)
    expect(parseRivenOcr(sample.blocks, otherWeapon)).to.equal(undefined)
    const missingLabel = feishu[2]
    for (const text of ['奏凯', 'Soma', '伯斯顿']) {
      const wrongTitle = missingLabel.fallbackBlocks.map(b => b.text.includes('葬铭') ? { ...b, text } : b)
      expect(parseRivenOcr(missingLabel.blocks, wrongTitle), text).to.equal(undefined)
    }
    const movedTitle = missingLabel.fallbackBlocks.map(b => b.text.includes('葬铭') ? { ...b, box: { ...b.box, x: 1000 } } : b)
    expect(parseRivenOcr(missingLabel.blocks, movedTitle)).to.equal(undefined)
  })

  for (const id of ['feishu-1', 'feishu-2', 'feishu-5', 'feishu-8']) {
    it(`preserves every attribute in ${id}`, () => {
      const sample = feishu.find(s => s.id === id)!
      const parsed = parseRivenOcr(sample.blocks)
      expect(parsed?.name).to.equal(sample.expected.name)
      expect(parsed?.attributes.map(a => [a.attr.gameRef, a.value, a.prefix])).to.deep.equal(sample.expected.stats)
    })
  }

  it('does not discard an attribute fragment as a footer ornament', () => {
    const sample = feishu[0]
    for (const text of ['+', '-', '+1', '%', '伤害']) {
      const blocks = sample.blocks.map(b => b.text === '。' ? { ...b, text } : b)
      expect(parseRivenOcr(blocks), text).to.equal(undefined)
    }
    const inStats = sample.blocks.map(b => b.text === '。' ? { ...b, box: { ...b.box, y: 210 } } : b)
    expect(parseRivenOcr(inStats)).to.equal(undefined)
    expect(parseRivenOcr(sample.blocks.map(b => b.text))).to.equal(undefined)
  })

  it('does not discard another card or a signed value beside the title', () => {
    const sample = feishu[1]
    for (const text of ['+7', '-7', '7%', '葬铭', '未知词条']) {
      expect(parseRivenOcr(sample.blocks.map(b => b.text === '7K' ? { ...b, text } : b)), text).to.equal(undefined)
    }
  })

  it('recovers the same fields after reordering and scaling both readings', () => {
    for (const sample of feishu) {
      const transform = (blocks: typeof sample.blocks) => blocks.toReversed().map(b => ({ ...b, box: {
        x: b.box.x * 2 + 100,
        y: b.box.y * 2 + 50,
        width: b.box.width * 2,
        height: b.box.height * 2,
      } }))
      const parsed = parseRivenOcr(transform(sample.blocks), transform(sample.fallbackBlocks))
      expect(parsed?.name, sample.id).to.equal(sample.expected.name)
      expect(parsed?.attributes.map(a => [a.attr.gameRef, a.value, a.prefix]), sample.id).to.deep.equal(sample.expected.stats)
    }
  })
})
