import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect } from 'chai'
import { packageRoot } from '../helpers/packageRoot'

describe('steel-essence command definition', () => {
  const root = packageRoot()
  const commands = readFileSync(resolve(root, 'src/commands/index.ts'), 'utf8')
  const readme = readFileSync(resolve(root, 'README.md'), 'utf8')
  const match = commands.match(
    /\.command\('steel-essence'[\s\S]*?\.action\(wf\.steelEssenceCommand\)/,
  )

  it('registers steel-essence with 钢铁精华 and without Steel Path aliases', () => {
    expect(match, 'steel-essence command block').to.not.equal(null)
    const block = match?.[0] ?? ''
    expect(block).to.include(".alias('钢铁精华')")
    expect(block).to.not.include("'steelpath'")
    expect(block).to.not.include("'teshin'")
    expect(block).to.not.include("'steel-path'")
    expect(block).to.not.include("'钢铁之路'")
    expect(commands).to.not.match(/\.command\('steelpath'/)
  })

  it('documents steel-essence in the README command table', () => {
    expect(readme).to.include('`steel-essence`')
    expect(readme).to.include('`钢铁精华`')
    expect(readme).to.not.match(/`steelpath`/)
    expect(readme).to.not.include('`teshin`')
    expect(readme).to.not.include('`steel-path`')
    expect(readme).to.not.include('`钢铁之路`')
  })
})
