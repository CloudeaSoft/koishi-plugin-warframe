import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect } from 'chai'

function packageRoot() {
  const cwd = process.cwd()
  return existsSync(resolve(cwd, 'src'))
    ? cwd
    : resolve(cwd, 'external/warframe')
}

describe('wfm type ownership', () => {
  it('keeps WFM public types in wfm-api-client', () => {
    const oldTypesDir = resolve(packageRoot(), 'src/types/wfm')

    expect(existsSync(oldTypesDir)).to.equal(false)
  })
})
