import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect } from 'chai'

function packageRoot() {
  const cwd = process.cwd()
  return cwd.endsWith('warframe') ? cwd : resolve(cwd, 'external/warframe')
}

describe('wfm-api-client install boundary', () => {
  it('uses a linked local dev dependency before the client is published', () => {
    const manifest = JSON.parse(
      readFileSync(resolve(packageRoot(), 'package.json'), 'utf8'),
    ) as {
      scripts: Record<string, string>
      devDependencies: Record<string, string>
      dependencies?: Record<string, string>
    }

    expect(manifest.dependencies?.['wfm-api-client']).to.equal(undefined)
    expect(manifest.devDependencies['wfm-api-client']).to.equal(
      'link:packages/wfm-api-client',
    )
    expect(manifest.scripts.build).to.include(
      'yarn --cwd packages/wfm-api-client build',
    )
  })
})
