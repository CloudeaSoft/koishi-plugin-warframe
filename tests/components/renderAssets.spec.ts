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

  it('uses valid and consistently named render template slots', () => {
    const root = packageRoot()
    const source = readFileSync(resolve(root, 'src/components/render.tsx'), 'utf8')
    const template = readFileSync(resolve(root, 'src/assets/render.html'), 'utf8')

    expect(template).to.include('__WARFRAME_RENDER_SLOT_TITLE__')
    expect(template).to.include('/* __WARFRAME_RENDER_SLOT_STYLE__ */')
    expect(template).to.include('<!-- __WARFRAME_RENDER_SLOT_SVG__ -->')
    expect(template).to.include('<!-- __WARFRAME_RENDER_SLOT_BODY__ -->')
    expect(template).to.not.include('{{')
    expect(template).to.not.include('}}')

    expect(source).to.include('const slots = {')
    expect(source).to.include('__WARFRAME_RENDER_SLOT_TITLE__')
    expect(source).to.include('/* __WARFRAME_RENDER_SLOT_STYLE__ */')
    expect(source).to.include('<!-- __WARFRAME_RENDER_SLOT_SVG__ -->')
    expect(source).to.include('<!-- __WARFRAME_RENDER_SLOT_BODY__ -->')
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
