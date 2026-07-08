import { readFileSync } from 'node:fs'
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
})
