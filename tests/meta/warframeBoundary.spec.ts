import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, relative, resolve, sep } from 'node:path'
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

function importSpecifiers(source: string): string[] {
  return [...source.matchAll(/(?:from\s+|import\s*)['"]([^'"]+)['"]/g)]
    .map(match => match[1])
}

function isInside(root: string, path: string): boolean {
  const pathFromRoot = relative(root, path)
  return pathFromRoot === ''
    || (!pathFromRoot.startsWith(`..${sep}`) && pathFromRoot !== '..')
}

describe('warframe source root', () => {
  it('owns all domain implementation under src/warframe', () => {
    const root = packageRoot()
    const domainRoot = resolve(root, 'src/warframe')
    const legacyRoots = ['services', 'data', 'infrastructure']
      .map(name => resolve(root, 'src', name))
      .filter(existsSync)

    expect(existsSync(resolve(domainRoot, 'index.ts'))).to.equal(true)
    expect(legacyRoots).to.deep.equal([])
  })

  it('does not import forbidden frameworks or escape the source root', () => {
    const root = packageRoot()
    const domainRoot = resolve(root, 'src/warframe')
    const violations = sourceFiles(domainRoot).flatMap((file) => {
      const source = readFileSync(file, 'utf8')
      return importSpecifiers(source).flatMap((specifier) => {
        if (/^(?:koishi|koishi-plugin-puppeteer|@satorijs\/element)(?:\/|$)/.test(specifier)) {
          return [`${file}: forbidden package ${specifier}`]
        }
        if (specifier.startsWith('.') && !isInside(domainRoot, resolve(dirname(file), specifier))) {
          return [`${file}: escapes source root with ${specifier}`]
        }
        return []
      })
    })

    expect(violations).to.deep.equal([])
  })

  it('keeps Koishi consumers behind the Warframe facade', () => {
    const root = packageRoot()
    const consumers = [
      'src/commands',
      'src/components',
      'src/messages.ts',
      'src/messages',
      'src/types/config.d.ts',
    ].flatMap(path => sourceFiles(resolve(root, path)))
    const violations = consumers.flatMap((file) => {
      const source = readFileSync(file, 'utf8')
      return importSpecifiers(source)
        .filter(specifier => /\/warframe\/(?:services|data|infrastructure|assets|types|utils)(?:\/|$)/.test(specifier))
        .map(specifier => `${file}: deep import ${specifier}`)
    })

    expect(violations).to.deep.equal([])
  })

  it('does not expose private implementation from the facade', () => {
    const root = packageRoot()
    const facadePath = resolve(root, 'src/warframe/index.ts')
    if (!existsSync(facadePath)) {
      return
    }
    const facade = readFileSync(facadePath, 'utf8')

    expect(facade).to.not.match(/from\s+['"]\.\/(?:data|infrastructure|assets)(?:\/|['"])/)
    expect(facade).to.not.include('wfmClient')
    expect(facade).to.not.include('fetchAsync')
    expect(facade).to.not.include('globalWorldState')
  })
})
