import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect } from 'chai'

function packageRoot() {
  const cwd = process.cwd()
  return cwd.endsWith('warframe') ? cwd : resolve(cwd, 'external/warframe')
}

describe('wfm-api-client install boundary', () => {
  it('depends on the published npm package at runtime', () => {
    const manifest = JSON.parse(
      readFileSync(resolve(packageRoot(), 'package.json'), 'utf8'),
    ) as {
      scripts: Record<string, string>
      dependencies: Record<string, string>
      devDependencies?: Record<string, string>
    }

    expect(manifest.dependencies['wfm-api-client']).to.match(/^\^?0\.0\.\d+/)
    expect(manifest.dependencies.bottleneck).to.be.a('string')
    expect(manifest.devDependencies?.['wfm-api-client']).to.equal(undefined)
    expect(manifest.scripts['build:wfm-client']).to.equal(undefined)
    expect(manifest.scripts.build).to.not.include('build:wfm-client')
    expect(manifest.dependencies['wfm-api-client']).to.not.include('link:')
  })
})
