import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Absolute path of this package, derived from the tests tree itself so that
 * the suite behaves the same from a Koishi workspace root, a CI checkout named
 * `koishi-plugin-warframe`, or a Cloud Agent checkout at `/workspace`.
 */
export function packageRoot(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')
}
