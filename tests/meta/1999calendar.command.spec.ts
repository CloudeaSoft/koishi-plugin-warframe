import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect } from 'chai'
import { packageRoot } from '../helpers/packageRoot'

describe('1999calendar command definition', () => {
  const root = packageRoot()
  const commands = readFileSync(resolve(root, 'src/commands/index.ts'), 'utf8')
  const readme = readFileSync(resolve(root, 'README.md'), 'utf8')
  const match = commands.match(
    /\.command\('1999calendar'[\s\S]*?\.action\(wf\.calendarCommand\)/,
  )

  it('registers 1999calendar and does not keep calendar as the original name', () => {
    expect(match, '1999calendar command block').to.not.equal(null)
    const block = match?.[0] ?? ''
    expect(block).to.match(/\.alias\('日历'\)/)
    expect(block).to.match(/\.alias\('1999日历'\)/)
    expect(block).to.match(/\.alias\('霍瓦尼亚日历'\)/)
    expect(commands).to.not.match(/\.command\('calendar'/)
  })

  it('documents 1999calendar in the README command table', () => {
    expect(readme).to.include('`1999calendar`')
    expect(readme).to.include('`日历`')
    expect(readme).to.include('`1999日历`')
    expect(readme).to.include('`霍瓦尼亚日历`')
    expect(readme).to.not.match(/\| `calendar`/)
  })
})
