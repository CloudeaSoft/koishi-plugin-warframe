import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect } from 'chai'

function packageRoot() {
  const cwd = process.cwd()
  return cwd.endsWith('warframe') ? cwd : resolve(cwd, 'external/warframe')
}

describe('wfm-api-client bundle behavior', () => {
  it('externalizes the published client from the plugin build', () => {
    const bundle = readFileSync(resolve(packageRoot(), 'lib/index.js'), 'utf8')

    expect(bundle).to.include('require("wfm-api-client")')
  })

  it('keeps circuit reward json outside the plugin bundle', () => {
    const root = packageRoot()
    const bundle = readFileSync(resolve(root, 'lib/index.js'), 'utf8')

    expect(bundle).to.not.include('// src/warframe/assets/circuitRewards.json')
    expect(existsSync(resolve(root, 'lib/warframe/assets/circuitRewards.json'))).to.equal(true)
  })

  it('keeps riven attribute value json outside the plugin bundle', () => {
    const root = packageRoot()
    const bundle = readFileSync(resolve(root, 'lib/index.js'), 'utf8')

    expect(bundle).to.not.include('// src/warframe/assets/rivenAttrValues.json')
    expect(existsSync(resolve(root, 'lib/warframe/assets/rivenAttrValues.json'))).to.equal(true)
  })

  it('keeps riven calc json outside the plugin bundle', () => {
    const root = packageRoot()
    const bundle = readFileSync(resolve(root, 'lib/index.js'), 'utf8')

    expect(bundle).to.not.include('// src/warframe/assets/rivencalc.json')
    expect(existsSync(resolve(root, 'lib/warframe/assets/rivencalc.json'))).to.equal(true)
  })

  it('keeps extra dictionary json files outside the plugin bundle', () => {
    const root = packageRoot()
    const bundle = readFileSync(resolve(root, 'lib/index.js'), 'utf8')

    expect(bundle).to.not.include('// src/warframe/assets/en.json')
    expect(bundle).to.not.include('// src/warframe/assets/zh.json')
    expect(existsSync(resolve(root, 'lib/warframe/assets/en.json'))).to.equal(true)
    expect(existsSync(resolve(root, 'lib/warframe/assets/zh.json'))).to.equal(true)
  })

  it('keeps arbitration schedule text outside the plugin bundle', () => {
    const root = packageRoot()
    const bundle = readFileSync(resolve(root, 'lib/index.js'), 'utf8')

    expect(bundle).to.not.include('1727884800,SettlementNode11')
    expect(existsSync(resolve(root, 'lib/warframe/assets/arbys.txt'))).to.equal(true)
  })

  it('keeps baro assets outside the plugin bundle', () => {
    const root = packageRoot()
    const bundle = readFileSync(resolve(root, 'lib/index.js'), 'utf8')

    expect(bundle).to.not.include('10 x Ki\'Teer Fireworks')
    expect(bundle).to.not.include('2022-06-17')
    expect(existsSync(resolve(root, 'lib/warframe/assets/baro.txt'))).to.equal(true)
    expect(existsSync(resolve(root, 'lib/warframe/assets/baroParsed.json'))).to.equal(true)
  })

  it('keeps arbitration rewards outside the plugin bundle', () => {
    const root = packageRoot()
    const bundle = readFileSync(resolve(root, 'lib/index.js'), 'utf8')

    expect(bundle).to.not.include('SolNode147: 400')
    expect(existsSync(resolve(root, 'lib/warframe/assets/arbyRewards.json'))).to.equal(true)
  })
})
