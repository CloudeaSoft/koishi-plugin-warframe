import {
  dict_zh,
  ExportBoosterPacks,
  ExportBundles,
  ExportCustoms,
  ExportFlavour,
  ExportKeys,
  ExportRecipes,
  ExportRelics,
  ExportResources,
  ExportUpgrades,
  ExportVirtuals,
  ExportWeapons,
} from "warframe-public-export-plus";
import { dictToKeyDict, relicToFullNameZH } from "./";

let solNodesEnDict = null;

export const getSolNodeKey = async (name: string): Promise<string> => {
  const worldstateData = await import("warframe-worldstate-data");
  if (!solNodesEnDict) {
    solNodesEnDict = dictToKeyDict(worldstateData.default.solNodes, (n) => [
      n.value,
    ]);
  }
  return solNodesEnDict[name];
};

let missionTypeEnDict = null;

export const getMissionTypeKey = async (name: string): Promise<string> => {
  const worldstateData = await import("warframe-worldstate-data");
  if (!missionTypeEnDict) {
    missionTypeEnDict = dictToKeyDict(
      worldstateData.default.missionTypes,
      (n) => [n.value]
    );
  }

  if (name === "Disruption") return "MT_ARTIFACT";

  return missionTypeEnDict[name];
};

export const fissureTierName = {
  1: "/Lotus/Language/Relics/Era_LITH",
  2: "/Lotus/Language/Relics/Era_MESO",
  3: "/Lotus/Language/Relics/Era_NEO",
  4: "/Lotus/Language/Relics/Era_AXI",
  5: "/Lotus/Language/Relics/Era_REQUIEM",
  6: "/Lotus/Language/Relics/Era_OMNI",
  7: "/Lotus/Language/Relics/Era_VANGUARD",
};

export const fissureTierNumToNumber = (a: number | string) => {
  return typeof a === "string" ? a.charCodeAt(5) : a;
};

export const getVoidTraderItem = (i: {
  item: string;
  uniqueName: string;
  ducats: number;
  credits: number;
}) => {
  const itemNameKey = getVoidTraderItemName(i.uniqueName);
  const itemName = !itemNameKey
    ? i.item
    : typeof itemNameKey === "string"
    ? dict_zh[itemNameKey] ?? (itemNameKey.includes("/") ? i.item : itemNameKey)
    : relicToFullNameZH(itemNameKey.era, itemNameKey.category);
  return { name: itemName, ducats: i.ducats, credits: i.credits };
};

const getVoidTraderItemName = (sourceKey: string) => {
  const fixedKey = sourceKey.replace("/StoreItems", "");
  const flavour = ExportFlavour[fixedKey];
  if (flavour) {
    return flavour.name;
  }

  const weapon = ExportWeapons[fixedKey];
  if (weapon) {
    return weapon.name;
  }

  const mod = ExportUpgrades[fixedKey];
  if (mod) {
    return mod.name;
  }

  const relic = ExportRelics[fixedKey]; // Return name directly
  if (relic) {
    return { era: relic.era, category: relic.category };
  }

  const skin = ExportCustoms[fixedKey];
  if (skin) {
    return skin.name;
  }

  const recipe = ExportRecipes[fixedKey]; // 'Sands of Inaros' Only
  if (recipe) {
    const recipeResult = ExportKeys[recipe.resultType];
    if (recipeResult) {
      return recipeResult.name;
    }
  }

  const virtual = ExportVirtuals[fixedKey];
  if (virtual) {
    return virtual.name;
  }

  const resource = ExportResources[fixedKey];
  if (resource) {
    return resource.name;
  }

  const booster = ExportBundles[sourceKey]; // Special key usage
  if (booster) {
    return booster.name;
  }

  const boosterPack = ExportBoosterPacks[fixedKey];
  if (boosterPack) {
    return boosterPack.name;
  }
};
