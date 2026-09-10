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

  it('scaffolds wf-service as a folder with index.ts rather than a single file', () => {
    const dir = resolve(root, 'src/warframe/services/wf-service')
    const file = resolve(root, 'src/warframe/services/wf-service.ts')
    expect(existsSync(dir) && statSync(dir).isDirectory()).to.equal(true)
    expect(existsSync(resolve(dir, 'index.ts'))).to.equal(true)
    expect(existsSync(file)).to.equal(false)
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

  it('extracts the riven cluster into wf-service.riven.ts', () => {
    const dir = resolve(root, 'src/warframe/services/wf-service')
    const rivenPath = resolve(dir, 'wf-service.riven.ts')
    const indexPath = resolve(dir, 'index.ts')
    const rivenNames = [
      'getAnalyzedRiven',
      'filterWeeklyRivens',
      'getWeeklyRivens',
      'getStaticRivenStats',
      'getWeaponRivenDisposition',
      'parseOCRResult',
      'analyzeRivenStat',
    ]

    expect(existsSync(rivenPath)).to.equal(true)
    const index = readFileSync(indexPath, 'utf8')
    expect(index).to.include('from \'./wf-service.riven\'')
    const indexExports = exportedFunctionNames(index)
    const rivenExports = exportedFunctionNames(readFileSync(rivenPath, 'utf8'))
    for (const name of rivenNames) {
      expect(indexExports, `${name} should leave index.ts`).to.not.include(name)
      expect(rivenExports, `${name} should live in wf-service.riven.ts`).to.include(name)
    }
  })

  it('extracts world-state board clusters into mapped modules', () => {
    const dir = resolve(root, 'src/warframe/services/wf-service')
    const indexPath = resolve(dir, 'index.ts')
    const index = readFileSync(indexPath, 'utf8')
    const indexExports = exportedFunctionNames(index)
    const boards: Array<[string, string[]]> = [
      ['wf-service.alert.ts', ['adaptAlerts', 'getAlerts']],
      ['wf-service.invasion.ts', ['adaptInvasions', 'getInvasionsFrom', 'getInvasions']],
      ['wf-service.nightwave.ts', ['resolveNightwave', 'getNightwave']],
      ['wf-service.steel-essence.ts', ['adaptSteelEssence', 'getSteelEssenceFrom', 'getSteelEssence']],
      ['wf-service.fissure.ts', ['getFissures', 'getSteelPathFissures', 'getRailjackFissures']],
      ['wf-service.void-trader.ts', ['getVoidTrader']],
      ['wf-service.environment.ts', ['getEnvironment']],
      ['wf-service.calendar.ts', ['adaptCalendar', 'getCalendarFrom', 'getCalendar']],
    ]

    for (const [file, names] of boards) {
      const target = resolve(dir, file)
      const specifier = `./${file.replace(/\.ts$/, '')}`
      expect(existsSync(target), `${file} should exist`).to.equal(true)
      expect(index, `index.ts should re-export ${specifier}`).to.include(`from '${specifier}'`)
      const exports = exportedFunctionNames(readFileSync(target, 'utf8'))
      for (const name of names) {
        expect(indexExports, `${name} should leave index.ts`).to.not.include(name)
        expect(exports, `${name} should live in ${file}`).to.include(name)
      }
    }
  })

  it('extracts remaining clusters into mapped modules', () => {
    const dir = resolve(root, 'src/warframe/services/wf-service')
    const indexPath = resolve(dir, 'index.ts')
    const index = readFileSync(indexPath, 'utf8')
    const indexExports = exportedFunctionNames(index)
    const remaining: Array<[string, string[]]> = [
      ['wf-service.relic.ts', ['getRelic']],
      ['wf-service.arbitration.ts', ['getArbitrations']],
      ['wf-service.sortie.ts', ['adaptSortie', 'getSortieFrom', 'getSortie']],
      ['wf-service.weekly.ts', ['adaptArchonHunt', 'getWeekly']],
      ['wf-service.bounty.ts', ['getBounty']],
      ['wf-service.circuit.ts', ['getCircuitWeek']],
    ]

    for (const [file, names] of remaining) {
      const target = resolve(dir, file)
      const specifier = `./${file.replace(/\.ts$/, '')}`
      expect(existsSync(target), `${file} should exist`).to.equal(true)
      expect(index, `index.ts should re-export ${specifier}`).to.include(`from '${specifier}'`)
      const exports = exportedFunctionNames(readFileSync(target, 'utf8'))
      for (const name of names) {
        expect(indexExports, `${name} should leave index.ts`).to.not.include(name)
        expect(exports, `${name} should live in ${file}`).to.include(name)
      }
    }
  })

  it('keeps index.ts as a barrel without feature function bodies', () => {
    const indexPath = resolve(root, 'src/warframe/services/wf-service/index.ts')
    const index = readFileSync(indexPath, 'utf8')
    expect(exportedFunctionNames(index)).to.deep.equal([])
    expect(index).to.match(/^export \{/m)
  })
})
