import type { OcrAPISecret } from '../types'
import type { OcrTextBlock } from '../types/ocr'
import { Buffer } from 'node:buffer'
import crypto from 'node:crypto'
import { createCache } from 'async-cache-dedupe'

interface OcrCacheParams {
  hash: string
  image: string
  secret: OcrAPISecret
  mode: 'accurate' | 'basic'
}

const ocrCache = createCache({
  storage: { type: 'memory', options: { size: 100 } },
}).define(
  'extract',
  { ttl: 86_400, serialize: (params: OcrCacheParams) => `${params.mode}:${params.hash}` },
  async (params: OcrCacheParams) => {
    return getTextFromTencentOCR(params.image, params.secret, params.mode)
  },
)

/**
 * Calculate the hash value of an image Base64 string
 * @param base64 Image base64 with or without prefix
 * @returns Hexadecimal hash string
 */
function getImageBase64Hash(base64: string): string {
  const pureBase64 = base64.replace(/^data:image\/\w+;base64,/, '')
  return crypto.createHash('sha256').update(pureBase64, 'base64').digest('hex')
}

async function getTextFromTencentOCR(
  image: string,
  secret: OcrAPISecret,
  mode: OcrCacheParams['mode'],
): Promise<OcrTextBlock[]> {
  const tencentcloud = await import('tencentcloud-sdk-nodejs-ocr')
  const OcrClient = tencentcloud.ocr.v20181119.Client
  const clientConfig = {
    credential: {
      secretId: secret.id.trim(),
      secretKey: secret.key.trim(),
    },
    region: '',
    profile: {
      httpProfile: {
        endpoint: 'ocr.tencentcloudapi.com',
      },
    },
  }

  const client = new OcrClient(clientConfig)

  const { TextDetections } = await (mode === 'basic'
    ? client.GeneralBasicOCR({ ImageBase64: image })
    : client.GeneralAccurateOCR({ ImageBase64: image }))

  return (TextDetections ?? []).flatMap((t) => {
    const text = t.DetectedText
    if (!text?.trim())
      return []
    const box = t.ItemPolygon
    return [{
      text,
      confidence: t.Confidence,
      box: box ? { x: box.X, y: box.Y, width: box.Width, height: box.Height } : undefined,
    }]
  })
}

export async function extractTextFromImage(image: string | Blob, secret: OcrAPISecret, mode: OcrCacheParams['mode'] = 'accurate'): Promise<OcrTextBlock[] | undefined> {
  if (image instanceof Blob) {
    const buffer = await image.arrayBuffer()
    image = Buffer.from(buffer).toString('base64')
  }

  const hash = getImageBase64Hash(image)

  try {
    return await ocrCache.extract({ hash, image, secret, mode })
  }
  catch {
    return undefined
  }
}
