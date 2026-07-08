import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect } from 'chai'

function packageRoot() {
  const cwd = process.cwd()
  return cwd.endsWith('warframe') ? cwd : resolve(cwd, 'external/warframe')
}

describe('asset ownership boundary', () => {
  it('keeps circuit reward resource loading inside the assets folder', () => {
    const root = packageRoot()
    const service = readFileSync(resolve(root, 'src/services/wf-service.ts'), 'utf8')

    expect(service).to.not.include('../assets/circuitRewards.json')
    expect(service).to.include('../assets/circuitRewardsData')
  })

  it('keeps riven attribute value resource loading inside the assets folder', () => {
    const root = packageRoot()
    const source = readFileSync(resolve(root, 'src/data/wf/rivenBaseValues.ts'), 'utf8')

    expect(source).to.not.include('../../assets/rivenAttrValues.json')
    expect(source).to.include('../../assets/rivenAttrValuesData')
  })
})
