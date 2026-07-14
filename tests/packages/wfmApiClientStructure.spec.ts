import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect } from 'chai'

function packageRoot() {
  const cwd = process.cwd()
  return existsSync(resolve(cwd, 'src'))
    ? cwd
    : resolve(cwd, 'external/warframe')
}

describe('wfm-api-client file structure', () => {
  it('splits public types by domain', () => {
    const root = resolve(packageRoot(), 'packages/wfm-api-client/src')
    const typesIndex = readFileSync(resolve(root, 'types/index.ts'), 'utf8')

    expect(existsSync(resolve(root, 'types.ts'))).to.equal(false)
    expect(existsSync(resolve(root, 'types/index.ts'))).to.equal(true)
    expect(existsSync(resolve(root, 'types/common.ts'))).to.equal(true)
    expect(existsSync(resolve(root, 'types/item.ts'))).to.equal(true)
    expect(existsSync(resolve(root, 'types/order.ts'))).to.equal(true)
    expect(existsSync(resolve(root, 'types/riven.ts'))).to.equal(true)
    expect(existsSync(resolve(root, 'types/tools.ts'))).to.equal(true)
    expect(typesIndex).to.not.include('export interface ItemShort')
    expect(typesIndex).to.not.include('export interface RivenOrder')
  })

  it('splits client internals by responsibility', () => {
    const root = resolve(packageRoot(), 'packages/wfm-api-client/src')
    const client = readFileSync(resolve(root, 'client.ts'), 'utf8')

    expect(existsSync(resolve(root, 'cache.ts'))).to.equal(true)
    expect(existsSync(resolve(root, 'transport.ts'))).to.equal(true)
    expect(existsSync(resolve(root, 'endpoints/items.ts'))).to.equal(true)
    expect(existsSync(resolve(root, 'endpoints/rivens.ts'))).to.equal(true)
    expect(existsSync(resolve(root, 'endpoints/tools.ts'))).to.equal(true)
    expect(client).to.not.include('class WfmMemoryCache')
    expect(client).to.not.include('ofetch')
    expect(client).to.not.include('items: {')
  })
})
