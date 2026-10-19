import { expect } from 'chai'
import { vi } from 'vitest'
import { extractTextFromImage } from '../../src/warframe/infrastructure/ocr-api'

const sdk = vi.hoisted(() => ({ request: vi.fn(), credentials: undefined as unknown }))
vi.mock('tencentcloud-sdk-nodejs-ocr', () => ({
  ocr: { v20181119: { Client: class {
    constructor(options: { credential: unknown }) { sdk.credentials = options.credential }
    GeneralAccurateOCR = sdk.request
  } } },
}))

describe('oCR infrastructure', () => {
  it('preserves text, confidence and geometry and trims pasted credentials', async () => {
    sdk.request.mockResolvedValueOnce({ TextDetections: [
      { DetectedText: '+120%暴击伤害', Confidence: 97, ItemPolygon: { X: 20, Y: 100, Width: 180, Height: 24 } },
    ] })
    const result = await extractTextFromImage('b2NyLWdlb21ldHJ5', { id: ' id\n', key: ' key\n' })
    expect(result).to.deep.equal([{ text: '+120%暴击伤害', confidence: 97, box: { x: 20, y: 100, width: 180, height: 24 } }])
    expect(sdk.credentials).to.deep.equal({ secretId: 'id', secretKey: 'key' })
  })

  it('returns undefined for an operational failure', async () => {
    sdk.request.mockRejectedValueOnce(new Error('network unavailable'))
    expect(await extractTextFromImage('b2NyLWZhaWx1cmU=', { id: 'id', key: 'key' })).to.equal(undefined)
  })

  it('handles missing text detections as an empty result', async () => {
    sdk.request.mockResolvedValueOnce({})
    expect(await extractTextFromImage('b2NyLWVtcHR5', { id: 'id', key: 'key' })).to.deep.equal([])
  })
})
