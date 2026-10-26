import { Buffer } from 'node:buffer'
import { expect } from 'chai'
import { vi } from 'vitest'
import { getAnalyzedRiven } from '../../../src/warframe/services/wf-service/wf-service.riven'
import corpus from '../../assets/riven-ocr/corpus.json'
import feishu from '../../assets/riven-ocr/feishu-2026-10-26/recorded.json'
import syntheticCursors from '../../assets/riven-ocr/synthetic-cursors/recorded.json'
import web from '../../assets/riven-ocr/web-2026-10-26/recorded.json'

const external = vi.hoisted(() => ({ image: vi.fn(), ocr: vi.fn(), basic: vi.fn() }))
vi.mock('../../../src/warframe/utils/http', () => ({ fetchAsyncImage: external.image }))
vi.mock('tencentcloud-sdk-nodejs-ocr', () => ({
  ocr: { v20181119: { Client: class {
    GeneralAccurateOCR = external.ocr
    GeneralBasicOCR = external.basic
  } } },
}))

describe('riven image analysis pipeline', () => {
  for (const sample of [...feishu, ...web]) {
    it(`analyzes all fields of ${sample.id} with fallback only when needed`, async () => {
      external.image.mockResolvedValueOnce(new Blob([sample.id]))
      const response = (blocks: typeof sample.blocks) => ({ TextDetections: blocks.map(b => ({
        DetectedText: b.text,
        Confidence: b.confidence,
        ItemPolygon: { X: b.box.x, Y: b.box.y, Width: b.box.width, Height: b.box.height },
      })) })
      external.ocr.mockResolvedValueOnce(response(sample.blocks))
      external.basic.mockReset().mockResolvedValue(response(sample.fallbackBlocks))
      const result = await getAnalyzedRiven({ id: 'test', key: 'test' }, `https://fixtures.invalid/${sample.id}.png`)
      expect(result.ok).to.equal(true)
      if (!result.ok) {
        throw new Error(result.error.code)
      }
      const detectedNames: Record<string, string> = {
        'feishu-1': '赤毒·努寇微波枪',
        'web-dokrahm': '多克拉姆',
        'web-bramma': '赤毒·布拉玛',
        'web-dual-toxocyst': '毒囊双枪',
        'web-furis': '盗贼',
      }
      expect(result.data.name).to.equal(detectedNames[sample.id] ?? sample.expected.name)
      expect([...result.data.buffs, ...result.data.curses].map(a => [a.gameRef, a.value])).to.deep.equal(sample.expected.stats.map(s => s.slice(0, 2)))
      expect(external.basic.mock.calls.length).to.equal(['feishu-3', 'feishu-4', 'feishu-6', 'feishu-7', 'web-dual-toxocyst'].includes(sample.id) ? 1 : 0)
    })
  }

  it('rejects the image when a necessary fallback is unavailable', async () => {
    external.image.mockResolvedValueOnce(new Blob(['unavailable-fallback']))
    external.ocr.mockResolvedValueOnce({ TextDetections: feishu[2].blocks.map(b => ({
      DetectedText: b.text,
      Confidence: b.confidence,
      ItemPolygon: { X: b.box.x, Y: b.box.y, Width: b.box.width, Height: b.box.height },
    })) })
    external.basic.mockReset().mockRejectedValue(new Error('unavailable'))
    const result = await getAnalyzedRiven({ id: 'test', key: 'test' }, 'https://fixtures.invalid/unavailable-fallback.png')
    expect(result).to.deep.equal({ ok: false, error: { code: 'riven.imageParseFailed', retryable: false } })
  })

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
      // These historical cards do not fit any current full-rank family range;
      // OCR is still covered separately, but auto-detection must not score them.
      if (['test-riven', 'test-riven2'].includes(sample.id)) {
        expect(result).to.deep.equal({ ok: false, error: { code: 'riven.variantUnmatched', retryable: false } })
        return
      }
      expect(result.ok).to.equal(true)
      if (!result.ok) {
        throw new Error(result.error.code)
      }
      const detectedNames: Record<string, string> = {
        'new-6': 'MK1-斯特朗',
        'new-7': '拉特昂 Prime',
        'new-9': '野猪 Prime',
        'test-riven10': '守望者 Prime',
        'ogris-projectile-speed': '赤毒·食人女魔',
        'nukor-locked-factions': '赤毒·努寇微波枪',
      }
      expect(result.data.name).to.equal(detectedNames[sample.id] ?? sample.expected.name)
      expect(result.data.variant?.status).to.be.oneOf(['matched', 'inferred'])
      expect([...result.data.buffs, ...(result.data.curses ?? [])].map(a => a.value)).to.deep.equal(sample.expected.stats.map(s => s[1]))
    })
  }

  it('does not score a card with a missing attribute value', async () => {
    external.image.mockResolvedValueOnce(new Blob(['missing-value']))
    external.ocr.mockResolvedValueOnce({ TextDetections: ['螺钉步枪', '+150%暴击几率', '+100%暴击伤害', '触发几率'].map(DetectedText => ({ DetectedText })) })
    const result = await getAnalyzedRiven({ id: 'test', key: 'test' }, 'https://fixtures.invalid/missing.png')
    expect(result).to.deep.equal({ ok: false, error: { code: 'riven.imageParseFailed', retryable: false } })
  })

  for (const sample of syntheticCursors) {
    it(`handles the generated ${sample.id} cursor image without changing or dropping stats`, async () => {
      external.image.mockResolvedValueOnce(new Blob([`synthetic-cursor-${sample.id}`]))
      external.ocr.mockResolvedValueOnce({ TextDetections: sample.blocks.map(b => ({
        DetectedText: b.text,
        Confidence: b.confidence,
        ItemPolygon: { X: b.box.x, Y: b.box.y, Width: b.box.width, Height: b.box.height },
      })) })
      const result = await getAnalyzedRiven({ id: 'test', key: 'test' }, `https://fixtures.invalid/synthetic-cursors/${sample.image}`)
      if (!sample.expected) {
        expect(result).to.deep.equal({ ok: false, error: { code: 'riven.imageParseFailed', retryable: false } })
        return
      }
      expect(result.ok).to.equal(true)
      if (!result.ok) {
        throw new Error(result.error.code)
      }
      expect(result.data.name).to.equal(sample.expected.name)
      expect([...result.data.buffs, ...result.data.curses].map(a => [a.gameRef, a.value])).to.deep.equal(sample.expected.stats)
    })
  }
})
