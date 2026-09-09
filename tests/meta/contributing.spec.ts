import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect } from 'chai'
import { packageRoot } from '../helpers/packageRoot'

describe('contributing.md layout', () => {
  const contributingPath = resolve(packageRoot(), 'CONTRIBUTING.md')
  const contributing = readFileSync(contributingPath, 'utf8')

  it('does not point at the missing architecture document', () => {
    expect(existsSync(resolve(packageRoot(), 'docs/architecture.md'))).to.equal(false)
    expect(contributing).to.not.include('docs/architecture.md')
  })

  it('points HTTP helpers at src/warframe/utils/http.ts', () => {
    expect(contributing).to.include('src/warframe/utils/http.ts')
    expect(contributing).to.not.include('src/utils/http.ts')
  })

  it('documents WarframeResult error handling and i18n mapping', () => {
    expect(contributing).to.include('WarframeResult')
    expect(contributing).to.include('src/i18n.ts')
  })

  it('describes the warframe domain root and Koishi-facing layers', () => {
    expect(contributing).to.include('src/warframe/')
    expect(contributing).to.include('warframe/index.ts')
  })

  it('lists vitest and lint in the contributor command set', () => {
    expect(contributing).to.include('yarn vitest run')
    expect(contributing).to.include('yarn lint')
  })
})
