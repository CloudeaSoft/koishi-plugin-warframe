import type { IRelic, TMissionDeck } from 'warframe-public-export-plus'
import type { Relic, RelicRewardRarity } from '../../types'
import { ExportRelics, ExportRewards } from 'warframe-public-export-plus'
import { fixRelicRewardKey, relicEraToTransKey } from '../../infrastructure/wf/wf-export-adapter'
import { normalizeName } from '../../utils'

export function buildRelicDict(
  exportRelics: Record<string, IRelic>,
  exportRewards: Record<string, TMissionDeck>,
): Record<string, Relic> {
  const result: Record<string, Relic> = {}
  for (const key in exportRelics) {
    const exportRelic = exportRelics[key]
    const exportRewardTiers = exportRewards[exportRelic.rewardManifest]

    const relicKey = normalizeName(exportRelic.era + exportRelic.category)

    const rewards = (exportRewardTiers?.[0] ?? []).map((r) => {
      return {
        name: fixRelicRewardKey(r.type),
        rarity: r.rarity as RelicRewardRarity,
        quantity: r.itemCount,
      }
    })

    result[relicKey] = {
      tier: exportRelic.era,
      tierKey: relicEraToTransKey(exportRelic.era),
      num: exportRelic.category,
      items: rewards,
    }
  }

  return result
}

export const relics: Record<string, Relic> = buildRelicDict(ExportRelics, ExportRewards)
