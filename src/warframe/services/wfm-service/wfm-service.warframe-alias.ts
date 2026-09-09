import { normalizeName } from '../../utils'

export interface WarframeAliasCollision {
  alias: string
  frames: string[]
}

export function buildWarframeAliasDict(
  aliasObject: Record<string, string[]>,
): Record<string, string> {
  const transformedObject: Record<string, string> = {}
  for (const [key, aliases] of Object.entries(aliasObject)) {
    const normalizedKey = normalizeName(key)
    transformedObject[normalizedKey] = normalizedKey
    for (const alias of aliases) {
      if (typeof alias !== 'string' || alias.length === 0) {
        continue
      }

      const normalizedAlias = normalizeName(alias)
      transformedObject[normalizedAlias] = normalizedKey
      const warframeNameWithSuffix = normalizeName(`${alias}甲`)
      transformedObject[warframeNameWithSuffix] = normalizedKey
    }
  }

  return transformedObject
}

export function findWarframeAliasCollisions(
  aliasObject: Record<string, string[]>,
): WarframeAliasCollision[] {
  const owners = new Map<string, string[]>()

  const register = (raw: string, frame: string): void => {
    if (typeof raw !== 'string' || raw.length === 0) {
      return
    }

    const alias = normalizeName(raw)
    if (!alias) {
      return
    }

    const frames = owners.get(alias) ?? []
    if (!frames.includes(frame)) {
      frames.push(frame)
      owners.set(alias, frames)
    }
  }

  for (const [frame, aliases] of Object.entries(aliasObject)) {
    register(frame, frame)
    for (const alias of aliases) {
      register(alias, frame)
      register(`${alias}甲`, frame)
    }
  }

  return [...owners.entries()]
    .filter(([, frames]) => frames.length > 1)
    .map(([alias, frames]) => ({ alias, frames }))
    .sort((left, right) => left.alias.localeCompare(right.alias))
}
