import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect } from 'chai'

function packageRoot() {
  const cwd = process.cwd()
  return cwd.endsWith('warframe') ? cwd : resolve(cwd, 'external/warframe')
}

describe('wfm-api-client install boundary', () => {
  it('depends on wfm-api-client at runtime (npm or local portal for pre-release)', () => {
    const manifest = JSON.parse(
      readFileSync(resolve(packageRoot(), 'package.json'), 'utf8'),
    ) as {
      scripts: Record<string, string>
      dependencies: Record<string, string>
      devDependencies?: Record<string, string>
    }

    const dep = manifest.dependencies['wfm-api-client']
    expect(dep).to.match(/^(\^?0\.0\.\d+|portal:.*wfm-api-client)$/)
    expect(dep).to.not.include('link:')
    expect(manifest.dependencies.bottleneck).to.equal(undefined)
    expect(manifest.devDependencies?.['wfm-api-client']).to.equal(undefined)
    expect(manifest.scripts['build:wfm-client']).to.equal(undefined)
    expect(manifest.scripts.build).to.not.include('build:wfm-client')
  })
})
