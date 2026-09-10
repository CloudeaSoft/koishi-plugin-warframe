import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect } from 'chai'
import { packageRoot } from '../helpers/packageRoot'

describe('event command definition', () => {
  const root = packageRoot()
  const commands = readFileSync(resolve(root, 'src/commands/index.ts'), 'utf8')
  const readme = readFileSync(resolve(root, 'README.md'), 'utf8')
  const match = commands.match(
    /\.command\('event'[\s\S]*?\.action\(wf\.eventCommand\)/,
  )

  it('registers event with Chinese aliases', () => {
    expect(match, 'event command block').to.not.equal(null)
    const block = match?.[0] ?? ''
    expect(block).to.match(/\.alias\('活动'\)/)
    expect(block).to.match(/\.alias\('事件'\)/)
  })

  it('documents event in the README command table', () => {
    expect(readme).to.include('`event`')
    expect(readme).to.include('`活动`')
    expect(readme).to.include('`事件`')
  })
})
