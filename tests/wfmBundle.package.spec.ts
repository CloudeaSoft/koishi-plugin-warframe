import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect } from 'chai'

function packageRoot() {
  const cwd = process.cwd()
  return cwd.endsWith('warframe') ? cwd : resolve(cwd, 'external/warframe')
}

describe('wfm-api-client bundle behavior', () => {
  it('bundles the internal workspace client into the plugin build', () => {
    const bundle = readFileSync(resolve(packageRoot(), 'lib/index.js'), 'utf8')

    expect(bundle).to.not.include('require("wfm-api-client")')
  })

  it('keeps circuit reward json outside the plugin bundle', () => {
    const root = packageRoot()
    const bundle = readFileSync(resolve(root, 'lib/index.js'), 'utf8')

    expect(bundle).to.not.include('// src/assets/circuitRewards.json')
    expect(existsSync(resolve(root, 'lib/assets/circuitRewards.json'))).to.equal(true)
  })
})
