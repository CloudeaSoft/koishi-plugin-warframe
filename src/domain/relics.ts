import { ExportRelics, ExportRewards } from "warframe-public-export-plus";
import { normalizeName, fixRelicRewardKey } from "../utils";

export const relics: Record<string, Relic> = (() => {
  const result: Record<string, Relic> = {};
  for (const key in ExportRelics) {
    const exportRelic = ExportRelics[key];
    const exportRewards = ExportRewards[exportRelic.rewardManifest];

    const era = "/Lotus/Language/Relics/Era_" + exportRelic.era.toUpperCase();
    const relicKey = normalizeName(exportRelic.era + exportRelic.category);

    const rewards = (exportRewards[0] ?? []).map((r) => {
      const item = fixRelicRewardKey(r.type);
      return {
        name: item,
        rarity: r.rarity as any,
        quantity: r.itemCount,
      };
    });

    const relic: Relic = {
      tier: exportRelic.era,
      tierKey: era,
      num: exportRelic.category,
      items: rewards,
    };
    result[relicKey] = relic;
  }

  return result;
})();
