import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect } from 'chai'

function packageRoot() {
  const cwd = process.cwd()
  return existsSync(resolve(cwd, 'src'))
    ? cwd
    : resolve(cwd, 'external/warframe')
}

describe('wfm client boundary', () => {
  it('uses a local client instance instead of WFM API wrapper functions', () => {
    const root = packageRoot()

    expect(existsSync(resolve(root, 'src/warframe/infrastructure/wfm/wfm-api.ts'))).to.equal(false)
    expect(existsSync(resolve(root, 'src/warframe/infrastructure/wfm-client.ts'))).to.equal(true)
  })
})
