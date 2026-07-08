import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { cwd } from 'node:process'

const sourceRoot = join(cwd(), 'src/assets')
const targetRoot = join(cwd(), 'lib/assets')
const copiedExtensions = new Set(['.json', '.txt', '.css', '.html', '.svg'])

function copyAssets(source, target) {
  if (!existsSync(source)) {
    return
  }

  mkdirSync(target, { recursive: true })

  for (const entry of readdirSync(source)) {
    const sourcePath = join(source, entry)
    const targetPath = join(target, entry)
    const stats = statSync(sourcePath)

    if (stats.isDirectory()) {
      copyAssets(sourcePath, targetPath)
      continue
    }

    if (stats.isFile() && copiedExtensions.has(extname(entry))) {
      cpSync(sourcePath, targetPath)
    }
  }
}

rmSync(targetRoot, { recursive: true, force: true })
copyAssets(sourceRoot, targetRoot)
