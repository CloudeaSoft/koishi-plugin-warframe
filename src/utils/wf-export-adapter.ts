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
