import { pinyin } from 'pinyin-pro'
import { normalizeName } from '../../utils'

interface ChineseNamedItem {
  slug: string
  i18n?: { 'zh-hans'?: { name?: string } | null }
}

export type ItemMatchResult<T>
  = | { type: 'matched', item: T }
    | { type: 'ambiguous', candidates: T[] }
    | { type: 'not-found' }

interface SearchName {
  source: string
  normalized: string
  phonetic?: string
}

// Cache by item identity so refreshing a catalog also releases its old search data.
const searchNames = new WeakMap<ChineseNamedItem, SearchName>()

function getSearchName(item: ChineseNamedItem): SearchName {
  const source = item.i18n?.['zh-hans']?.name ?? ''
  let cached = searchNames.get(item)
  if (!cached || cached.source !== source) {
    cached = { source, normalized: normalizeName(source) }
    searchNames.set(item, cached)
  }
  return cached
}

function toPhoneticName(name: string): string {
  // Delimit syllables: xi + an must not match xian. Retain non-Chinese text
  // so Prime, numbers and other qualifiers cannot silently disappear.
  return `\0${pinyin(name, { toneType: 'none', type: 'array' }).join('\0')}\0`
}

export function matchChineseItem<T extends ChineseNamedItem>(input: string, items: T[]): ItemMatchResult<T> {
  const normalized = normalizeName(input)
  if ((normalized.match(/\p{Script=Han}/gu)?.length ?? 0) < 2)
    return { type: 'not-found' }

  let candidates = items.filter(item => getSearchName(item).normalized.includes(normalized))
  let query = normalized
  let phonetic = false
  if (candidates.length === 0) {
    query = toPhoneticName(normalized)
    phonetic = true
    candidates = items.filter((item) => {
      const name = getSearchName(item)
      if (!name.normalized)
        return false
      name.phonetic ??= toPhoneticName(name.normalized)
      return name.phonetic.includes(query)
    })
  }

  candidates = [...new Map(candidates.map(item => [item.slug, item])).values()]
  candidates.sort((left, right) => {
    const a = getSearchName(left)
    const b = getSearchName(right)
    const aKey = phonetic ? a.phonetic! : a.normalized
    const bKey = phonetic ? b.phonetic! : b.normalized
    return Number(bKey.startsWith(query)) - Number(aKey.startsWith(query))
      || a.normalized.length - b.normalized.length
      || a.source.localeCompare(b.source, 'zh-CN')
      || left.slug.localeCompare(right.slug)
  })

  if (candidates.length === 1)
    return { type: 'matched', item: candidates[0] }
  return candidates.length ? { type: 'ambiguous', candidates } : { type: 'not-found' }
}
