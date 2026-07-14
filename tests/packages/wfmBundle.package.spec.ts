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

  it('keeps riven attribute value json outside the plugin bundle', () => {
    const root = packageRoot()
    const bundle = readFileSync(resolve(root, 'lib/index.js'), 'utf8')

    expect(bundle).to.not.include('// src/assets/rivenAttrValues.json')
    expect(existsSync(resolve(root, 'lib/assets/rivenAttrValues.json'))).to.equal(true)
  })

  it('keeps riven calc json outside the plugin bundle', () => {
    const root = packageRoot()
    const bundle = readFileSync(resolve(root, 'lib/index.js'), 'utf8')

    expect(bundle).to.not.include('// src/assets/rivencalc.json')
    expect(existsSync(resolve(root, 'lib/assets/rivencalc.json'))).to.equal(true)
  })

  it('keeps extra dictionary json files outside the plugin bundle', () => {
    const root = packageRoot()
    const bundle = readFileSync(resolve(root, 'lib/index.js'), 'utf8')

    expect(bundle).to.not.include('// src/assets/en.json')
    expect(bundle).to.not.include('// src/assets/zh.json')
    expect(existsSync(resolve(root, 'lib/assets/en.json'))).to.equal(true)
    expect(existsSync(resolve(root, 'lib/assets/zh.json'))).to.equal(true)
  })

  it('keeps arbitration schedule text outside the plugin bundle', () => {
    const root = packageRoot()
    const bundle = readFileSync(resolve(root, 'lib/index.js'), 'utf8')

    expect(bundle).to.not.include('1727884800,SettlementNode11')
    expect(existsSync(resolve(root, 'lib/assets/arbys.txt'))).to.equal(true)
  })

  it('keeps baro assets outside the plugin bundle', () => {
    const root = packageRoot()
    const bundle = readFileSync(resolve(root, 'lib/index.js'), 'utf8')

    expect(bundle).to.not.include('10 x Ki\'Teer Fireworks')
    expect(bundle).to.not.include('2022-06-17')
    expect(existsSync(resolve(root, 'lib/assets/baro.txt'))).to.equal(true)
    expect(existsSync(resolve(root, 'lib/assets/baroParsed.json'))).to.equal(true)
  })

  it('keeps arbitration rewards outside the plugin bundle', () => {
    const root = packageRoot()
    const bundle = readFileSync(resolve(root, 'lib/index.js'), 'utf8')

    expect(bundle).to.not.include('SolNode147: 400')
    expect(existsSync(resolve(root, 'lib/assets/arbyRewards.json'))).to.equal(true)
  })
})
