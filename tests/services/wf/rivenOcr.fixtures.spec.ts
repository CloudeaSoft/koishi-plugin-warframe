import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { expect } from 'chai'
import { parseOCRResult } from '../../../src/warframe/services/wf-service/wf-service.riven'
import evaluation from '../../assets/riven-ocr/community-2026-10-21/evaluation.json'
import community from '../../assets/riven-ocr/community-2026-10-21/recorded.json'
import labels from '../../assets/riven-ocr/community-2026-10-21/rivens.json'
import corpus from '../../assets/riven-ocr/corpus.json'
import synthetic from '../../assets/riven-ocr/synthetic-cursors/recorded.json'
import { packageRoot } from '../../helpers/packageRoot'

const assets = resolve(packageRoot(), 'tests/assets')
const root = join(assets, 'riven-ocr')
const samples = [
  ...corpus.map(s => ({
    id: s.id,
    image: resolve(root, s.image),
    sha256: s.sha256,
    blocks: s.blocks,
    rejection: undefined as string | undefined,
    expected: { name: s.expected.name, attributes: s.expected.stats.map(([gameRef, value, prefix], i) => ({
      gameRef,
      value,
      prefix,
      unit: s.expected.units?.[i],
    })) },
  })),
  ...labels.map((label) => {
    const s = community.find(s => s.image === label.file_name)!
    const expected = evaluation.cases.find(s => s.image === label.file_name)!
    return {
      id: `community/${label.file_name}`,
      image: resolve(root, 'community-2026-10-21', label.relative_path),
      sha256: label.sha256,
      blocks: s.blocks,
      rejection: expected.inScope ? undefined : 'unsupported legacy faction percentage',
      expected: { name: label.weapon_name, attributes: expected.expected },
    }
  }),
  ...synthetic.map(s => ({
    id: `synthetic/${s.id}`,
    image: resolve(root, 'synthetic-cursors', s.image),
    sha256: s.sha256,
    blocks: s.blocks,
    rejection: s.expected ? undefined : 'occluded attribute number',
    expected: s.expected && { name: s.expected.name, attributes: s.expected.stats.map(([gameRef, value], i) => ({
      gameRef,
      value,
      prefix: s.expected!.prefixes?.[i],
      unit: s.expected!.units?.[i],
    })) },
  })),
]

function imageFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => entry.isDirectory()
    ? imageFiles(join(directory, entry.name))
    : /\.(?:png|jpe?g|webp)$/i.test(entry.name) ? [join(directory, entry.name)] : [])
}

describe('all saved riven screenshots: image + recorded OCR + correct fields', () => {
  it('registers every image exactly once so new or missing fixtures cannot silently escape replay', () => {
    const files = [
      ...imageFiles(root),
      ...readdirSync(assets).filter(name => /^test-riven\d*\.png$/.test(name)).map(name => join(assets, name)),
    ]
    expect(new Set(samples.map(s => s.id)).size).to.equal(samples.length)
    expect(samples.map(s => s.image).sort()).to.deep.equal(files.sort())
  })

  for (const sample of samples) {
    it(`${sample.id}: ${sample.rejection ? `reject (${sample.rejection})` : 'preserve all fields'}`, async () => {
      expect(createHash('sha256').update(readFileSync(sample.image)).digest('hex'), 'image differs from recorded OCR source').to.equal(sample.sha256)
      expect(sample.blocks, 'recorded OCR blocks').to.be.an('array').with.length.greaterThan(0)
      const parsed = await parseOCRResult(sample.blocks)
      if (sample.rejection) {
        expect(parsed).to.equal(undefined)
        return
      }
      expect(sample.expected, 'independent expected fields').to.be.an('object')
      expect(parsed?.name).to.equal(sample.expected!.name)
      expect(parsed?.attributes.map(a => ({
        gameRef: a.attr.gameRef,
        value: a.value,
        prefix: a.prefix,
        unit: a.attr.unit,
      }))).to.deep.equal(sample.expected!.attributes)
    })
  }
})
