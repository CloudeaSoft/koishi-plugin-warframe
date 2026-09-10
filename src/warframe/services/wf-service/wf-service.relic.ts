import type { Relic, WarframeResult } from '../../types'

import { relics } from '../../data/wf/relics'
import { failure } from '../../types/warframe-result'
import { normalizeName } from '../../utils'

export async function getRelic(input: string): Promise<WarframeResult<Relic>> {
  if (!input) {
    return failure('relic.invalidName')
  }

  input = normalizeName(input)
  if (!input) {
    return failure('relic.invalidName')
  }

  if (!relics) {
    return failure('relic.dataLoading', true)
  }

  const tierListForMatch = [
    '古纪',
    '前纪',
    '中纪',
    '后纪',
    '安魂',
    '先锋',
    'Lith',
    'Meso',
    'Neo',
    'Axi',
    'Requiem',
    'Vanguard',
  ].map(t => normalizeName(t))
  const tier = tierListForMatch.find(t => input.startsWith(t))
  if (!tier) {
    return failure('relic.invalidName')
  }

  const category = input
    .replace(new RegExp(`^${tier}`), '')
    .replace(/遗物$|relic$/, '')

  const zhTierMap = {
    古纪: 'Lith',
    前纪: 'Meso',
    中纪: 'Neo',
    后纪: 'Axi',
    安魂: 'Requiem',
    先锋: 'Vanguard',
  }
  const enTier = zhTierMap[tier as keyof typeof zhTierMap] ?? tier
  const key = normalizeName(enTier + category)
  return relics[key] ? { ok: true, data: relics[key] } : failure('relic.notFound')
}
