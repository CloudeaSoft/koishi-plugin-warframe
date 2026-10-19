import { Buffer } from 'node:buffer'
import { expect } from 'chai'
import { vi } from 'vitest'
import { getAnalyzedRiven } from '../../../src/warframe/services/wf-service/wf-service.riven'
import corpus from '../../assets/riven-ocr/corpus.json'

const external = vi.hoisted(() => ({ image: vi.fn(), ocr: vi.fn() }))
vi.mock('../../../src/warframe/utils/http', () => ({ fetchAsyncImage: external.image }))
vi.mock('tencentcloud-sdk-nodejs-ocr', () => ({
  ocr: { v20181119: { Client: class { GeneralAccurateOCR = external.ocr } } },
}))

describe('riven image analysis pipeline', () => {
  for (const sample of corpus) {
    it(`carries ${sample.id} through download, OCR adaptation, parsing and grading`, async () => {
      external.image.mockResolvedValueOnce(new Blob([sample.id]))
      external.ocr.mockImplementationOnce(async ({ ImageBase64 }: { ImageBase64: string }) => {
        expect(Buffer.from(ImageBase64, 'base64').toString()).to.equal(sample.id)
        return { TextDetections: sample.blocks.map(b => ({
          DetectedText: b.text,
          Confidence: b.confidence,
          ItemPolygon: { X: b.box.x, Y: b.box.y, Width: b.box.width, Height: b.box.height },
        })) }
      })
      const result = await getAnalyzedRiven({ id: 'test', key: 'test' }, `https://fixtures.invalid/${sample.id}.png`)
      expect(result.ok).to.equal(true)
      if (!result.ok) {
        throw new Error(result.error.code)
      }
      expect(result.data.name).to.equal(sample.expected.name)
      expect([...result.data.buffs, ...(result.data.curses ?? [])].map(a => a.value)).to.deep.equal(sample.expected.stats.map(s => s[1]))
    })
  }

  it('does not score a card with a missing attribute value', async () => {
    external.image.mockResolvedValueOnce(new Blob(['missing-value']))
    external.ocr.mockResolvedValueOnce({ TextDetections: ['螺钉步枪', '+150%暴击几率', '+100%暴击伤害', '触发几率'].map(DetectedText => ({ DetectedText })) })
    const result = await getAnalyzedRiven({ id: 'test', key: 'test' }, 'https://fixtures.invalid/missing.png')
    expect(result).to.deep.equal({ ok: false, error: { code: 'riven.imageParseFailed', retryable: false } })
  })
})
