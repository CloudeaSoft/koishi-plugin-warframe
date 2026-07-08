import { readFileSync } from 'node:fs'
import { basename, dirname, resolve, sep } from 'node:path'

const jsonCache = new Map<string, unknown>()

function assetRoot(): string {
  if (basename(__dirname) === 'utils' && basename(dirname(__dirname)) === 'src') {
    return resolve(__dirname, '../assets')
  }

  return resolve(__dirname, 'assets')
}

function assetPath(path: string): string {
  const root = assetRoot()
  const resolved = resolve(root, path)
  if (resolved !== root && !resolved.startsWith(`${root}${sep}`)) {
    throw new Error(`Invalid asset path: ${path}`)
  }

  return resolved
}

export function loadAssetJson<T>(path: string): T {
  const resolved = assetPath(path)
  if (jsonCache.has(resolved)) {
    return jsonCache.get(resolved) as T
  }

  const data = JSON.parse(readFileSync(resolved, 'utf8')) as T
  jsonCache.set(resolved, data)
  return data
}
