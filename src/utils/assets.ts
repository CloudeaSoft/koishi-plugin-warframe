import { readFileSync } from 'node:fs'
import { basename, dirname, resolve, sep } from 'node:path'

const jsonCache = new Map<string, unknown>()
const textCache = new Map<string, string>()

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

export function loadAssetText(path: string): string {
  const resolved = assetPath(path)
  if (textCache.has(resolved)) {
    return textCache.get(resolved)!
  }

  const data = readFileSync(resolved, 'utf8')
  textCache.set(resolved, data)
  return data
}
