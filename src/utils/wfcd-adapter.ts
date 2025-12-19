import { dictToKeyDict } from "./common";

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
