import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect } from 'chai'
import { packageRoot } from '../helpers/packageRoot'

const EXPORT_MAP_ROW = /^\| `(\w+)` \| `(wf-service\.[a-z0-9-]+\.ts)` \|$/gm

function listWfServiceFiles(root: string): string[] {
  const file = resolve(root, 'src/warframe/services/wf-service.ts')
  const dir = resolve(root, 'src/warframe/services/wf-service')
  if (existsSync(dir) && statSync(dir).isDirectory()) {
    return readdirSync(dir)
      .filter(name => name.endsWith('.ts'))
      .map(name => resolve(dir, name))
  }
  return [file]
}

function exportedFunctionNames(source: string): string[] {
  return [...source.matchAll(/^export (?:async )?function (\w+)/gm)].map(match => match[1])
}

function parseExportMap(doc: string): Array<{ name: string, file: string }> {
  return [...doc.matchAll(EXPORT_MAP_ROW)].map(match => ({
    name: match[1],
    file: match[2],
  }))
}

describe('wf-service split contract', () => {
  const root = packageRoot()
  const docPath = resolve(root, 'docs/loop/wf-service-split.md')
  const doc = readFileSync(docPath, 'utf8')
  const mapped = parseExportMap(doc)
  const sources = listWfServiceFiles(root)
  const exported = sources.flatMap(path => exportedFunctionNames(readFileSync(path, 'utf8')))

  it('documents a wfm-service-style folder with per-cluster modules', () => {
    expect(doc).to.include('src/warframe/services/wf-service/')
    expect(doc).to.include('matching `wfm-service/`')
    expect(doc).to.include('index.ts')
  })

  it('maps every exported wf-service function to a target file', () => {
    expect(mapped.length).to.be.greaterThan(0)
    expect(exported.length).to.be.greaterThan(0)
    expect(mapped.map(row => row.name).sort()).to.deep.equal([...exported].sort())
  })

  it('places extracted functions in their mapped modules when those files exist', () => {
    const dir = resolve(root, 'src/warframe/services/wf-service')
    if (!existsSync(dir) || !statSync(dir).isDirectory()) {
      return
    }

    for (const row of mapped) {
      const target = resolve(dir, row.file)
      if (!existsSync(target)) {
        continue
      }
      const names = exportedFunctionNames(readFileSync(target, 'utf8'))
      expect(names, `${row.name} should live in ${row.file}`).to.include(row.name)
    }
  })
})
