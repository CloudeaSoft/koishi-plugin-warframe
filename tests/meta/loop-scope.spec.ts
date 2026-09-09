import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect } from 'chai'
import { packageRoot } from '../helpers/packageRoot'

describe('loop scope', () => {
  const root = packageRoot()
  const backlog = readFileSync(resolve(root, 'docs/loop/backlog.md'), 'utf8')
  const skill = readFileSync(resolve(root, '.cursor/skills/loop-iteration/SKILL.md'), 'utf8')

  it('does not keep community warframe nicknames as a loop todo', () => {
    const todoRows = backlog
      .split('\n')
      .filter(line => line.includes('| todo |'))
    expect(todoRows.some(line => /\bL-002\b/.test(line))).to.equal(false)
    expect(todoRows.some(line => line.includes('Extend Chinese warframe aliases'))).to.equal(false)
    expect(backlog).to.include('Out of loop scope')
    expect(backlog).to.include('warframeAlias.json')
    expect(backlog).to.include('public contributors')
  })

  it('tells the loop-iteration skill to leave nickname tables to contributors', () => {
    expect(skill).to.include('warframeAlias.json')
    expect(skill).to.include('public contributors')
    expect(skill).to.include('issue #69')
  })
})
