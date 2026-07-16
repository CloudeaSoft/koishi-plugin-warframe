import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect } from 'chai'

function packageRoot(): string {
  const cwd = process.cwd()
  return cwd.endsWith('warframe') ? cwd : resolve(cwd, 'external/warframe')
}

describe('setup entrypoint ownership', () => {
  it('delegates command and hook registration to feature directory entries', () => {
    const root = packageRoot()
    const rootEntry = readFileSync(resolve(root, 'src/index.ts'), 'utf8')
    const commandsEntry = readFileSync(resolve(root, 'src/commands/index.ts'), 'utf8')
    const hooksEntryPath = resolve(root, 'src/hooks/index.ts')

    expect(existsSync(hooksEntryPath)).to.equal(true)
    if (!existsSync(hooksEntryPath)) {
      return
    }

    const hooksEntry = readFileSync(hooksEntryPath, 'utf8')
    expect(rootEntry).to.include('from \'./commands\'')
    expect(rootEntry).to.include('from \'./hooks\'')
    expect(rootEntry).to.not.include('function setupCommands')
    expect(rootEntry).to.not.include('function setupHooks')
    expect(commandsEntry).to.include('export function setupCommands')
    expect(commandsEntry).to.not.match(/export\s+\*/)
    expect(hooksEntry).to.include('export function setupHooks')
  })
})
