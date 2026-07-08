import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect } from 'chai'

function packageRoot() {
  const cwd = process.cwd()
  return cwd.endsWith('warframe') ? cwd : resolve(cwd, 'external/warframe')
}

describe('render static assets', () => {
  it('keeps render css, svg, and html outside render.tsx', () => {
    const root = packageRoot()
    const source = readFileSync(resolve(root, 'src/components/render.tsx'), 'utf8')

    expect(source).to.not.include('const style = `')
    expect(source).to.not.include('const svg = `')
    expect(source).to.not.include('<!DOCTYPE html>')
    expect(source).to.include('loadAssetText')
    expect(source).to.include('render.css')
    expect(source).to.include('render-icons.svg')
    expect(source).to.include('render.html')
  })

  it('copies render static assets into the build output', () => {
    const root = packageRoot()
    const bundle = readFileSync(resolve(root, 'lib/index.js'), 'utf8')

    expect(bundle).to.not.include('--color_success_text')
    expect(bundle).to.not.include('<symbol viewBox="0 0 19.736 20.883" id="icon-amber">')
    expect(bundle).to.not.include('<!DOCTYPE html>')
    expect(existsSync(resolve(root, 'lib/assets/render.css'))).to.equal(true)
    expect(existsSync(resolve(root, 'lib/assets/render-icons.svg'))).to.equal(true)
    expect(existsSync(resolve(root, 'lib/assets/render.html'))).to.equal(true)
  })
})
