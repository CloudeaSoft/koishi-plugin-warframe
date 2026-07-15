import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { cwd } from 'node:process'

const copiedExtensions = new Set(['.json', '.txt', '.css', '.html', '.svg'])
const assetRoots = [
  {
    source: join(cwd(), 'src/assets'),
    target: join(cwd(), 'lib/assets'),
  },
  {
    source: join(cwd(), 'src/warframe/assets'),
    target: join(cwd(), 'lib/warframe/assets'),
  },
]

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

for (const { source, target } of assetRoots) {
  rmSync(target, { recursive: true, force: true })
  copyAssets(source, target)
}
