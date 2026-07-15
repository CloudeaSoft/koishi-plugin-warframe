import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect } from 'chai'

function packageRoot(): string {
  const cwd = process.cwd()
  return cwd.endsWith('warframe') ? cwd : resolve(cwd, 'external/warframe')
}

function sourceFiles(path: string): string[] {
  if (!existsSync(path)) {
    return []
  }
  if (statSync(path).isFile()) {
    return /\.(?:ts|tsx)$/.test(path) ? [path] : []
  }
  return readdirSync(path).flatMap(name => sourceFiles(resolve(path, name)))
}

describe('warframe data boundary', () => {
  it('does not import Koishi or Koishi presentation modules', () => {
    const root = packageRoot()
    const candidates = [
      'src/services',
      'src/data',
      'src/infrastructure',
      'src/assets',
      'src/utils',
      'src/types/warframe-result.ts',
      'src/types/ocr.ts',
      'src/types/wf',
      'src/types/wfm.d.ts',
      'src/types/miscs',
    ].flatMap(path => sourceFiles(resolve(root, path)))

    const forbidden = [
      /from\s+['"]koishi['"]/,
      /from\s+['"]koishi-plugin-puppeteer['"]/,
      /from\s+['"][^'"]*(?:commands|components|messages)[/'"]/,
      /from\s+['"][^'"]*types\/config['"]/,
    ]

    const violations = candidates.flatMap((file) => {
      const source = readFileSync(file, 'utf8')
      return forbidden
        .filter(pattern => pattern.test(source))
        .map(pattern => `${file}: ${pattern}`)
    })

    expect(violations).to.deep.equal([])
  })
})
