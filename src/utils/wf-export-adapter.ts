import {
  IRegion,
  ExportFactions as factions,
} from "warframe-public-export-plus";

export const regionToShort = (region: IRegion, dict: any) => {
  return {
    name: dict[region.name],
    system: dict[region.systemName],
    type: dict[region.missionName],
    faction: dict[factions[region.faction].name],
    maxLevel: region.maxEnemyLevel,
    minLevel: region.minEnemyLevel,
  };
};

export const relicQualityToName = (quality: string): RelicQuality => {
  const map = {
    VPQ_BRONZE: "Intact",
    VPQ_SILVER: "Exceptional",
    VPQ_GOLD: "Flawless",
    VPQ_PLATINUM: "Radiant",
  };

  return map[quality] || quality;
};

/** transform relic quality to translation key, return original if not matched.
 *
 * eg. "VPQ_BRONZE" => "/Lotus/Language/Relics/VoidProjectionQuality_Bronze".
 * @param quality directly provided from `IRelic.quality` expected to start with "VPQ_".
 */
export const relicQualityToTransKey = (quality: string) => {
  if (quality.startsWith("VPQ_")) {
    const prefix = "/Lotus/Language/Relics/VoidProjectionQuality_";
    const name = quality.replace(/^VPQ_/, "");
    return prefix + name[0].toUpperCase() + name.slice(1).toLowerCase();
  }
  return quality;
};

/** transform relic era to translation key.
 *
 * eg. "Lith" => "/Lotus/Language/Relics/Era_LITH".
 * @param era directly provided from `IRelic.era`.
 */
export const relicEraToTransKey = (era: string) => {
  const prefix = "/Lotus/Language/Relics/Era_";
  return prefix + era.toUpperCase();
};

export const fixRelicRewardKey = (item: string) => {
  return item.replace("StoreItems/", "");
};
