import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect } from 'chai'
import { packageRoot } from '../helpers/packageRoot'

function wfServiceSources(root: string): string {
  const dir = resolve(root, 'src/warframe/services/wf-service')
  return readdirSync(dir)
    .filter(name => name.endsWith('.ts'))
    .map(name => readFileSync(resolve(dir, name), 'utf8'))
    .join('\n')
}

describe('asset ownership boundary', () => {
  it('keeps circuit reward resource loading behind the unified assets entry', () => {
    const root = packageRoot()
    const service = wfServiceSources(root)

    expect(service).to.not.include('assets/circuitRewards.json')
    expect(service).to.not.include('assets/circuitRewardsData')
    expect(service).to.include('from \'../../assets/index\'')
  })

  it('keeps riven attribute value resource loading behind the unified assets entry', () => {
    const root = packageRoot()
    const source = readFileSync(resolve(root, 'src/warframe/data/wf/rivenBaseValues.ts'), 'utf8')

    expect(source).to.not.include('../../assets/rivenAttrValues.json')
    expect(source).to.not.include('../../assets/rivenAttrValuesData')
    expect(source).to.include('from \'../../assets/index\'')
  })

  it('keeps riven calc resource loading behind the unified assets entry', () => {
    const root = packageRoot()
    const source = readFileSync(resolve(root, 'src/warframe/data/wf/rivenDisposition.ts'), 'utf8')

    expect(source).to.not.include('../../assets/rivencalc.json')
    expect(source).to.not.include('../../assets/rivenCalcData')
    expect(source).to.include('from \'../../assets/index\'')
  })

  it('keeps extra dictionary resource loading behind the unified assets entry', () => {
    const root = packageRoot()
    const source = wfServiceSources(root)

    expect(source).to.not.include('assets/en.json')
    expect(source).to.not.include('assets/zh.json')
    expect(source).to.not.include('assets/extraDictData')
    expect(source).to.include('from \'../../assets/index\'')
  })

  it('keeps arbitration schedule text loading behind the unified assets entry', () => {
    const root = packageRoot()
    const source = readFileSync(resolve(root, 'src/warframe/data/wf/arbitrationSchedule.ts'), 'utf8')

    expect(source).to.not.include('../../assets/arbys')
    expect(source).to.not.include('../../assets/arbitrationScheduleData')
    expect(source).to.include('from \'../../assets/index\'')
  })

  it('keeps arbitration reward resource loading behind the unified assets entry', () => {
    const root = packageRoot()
    const source = wfServiceSources(root)

    expect(source).to.not.include('from \'../../assets/arbyRewards\'')
    expect(source).to.not.include('assets/arbyRewardsData')
    expect(source).to.include('from \'../../assets/index\'')
  })

  it('keeps Baro resource loading behind the unified assets entry', () => {
    const root = packageRoot()
    const source = readFileSync(resolve(root, 'src/warframe/infrastructure/wf/wf-api.ts'), 'utf8')

    expect(source).to.not.include('../../assets/baro')
    expect(source).to.include('from \'../../assets/index\'')
  })
})
