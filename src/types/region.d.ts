interface WFRegion {
  name: string;
  systemIndex: number;
  systemName: string;
  nodeType: number;
  masteryReq: number;
  missionType: string;
  missionIndex: number;
  missionName: string;
  faction: string;
  factionIndex: number;
  factionName: string;
  minEnemyLevel: number;
  maxEnemyLevel: number;
  masteryExp: number;
  levelOverride: string;
  rewardManifests: string[];
  nextNodes: any[];
}

interface WFRegionShort {
  name: string;
  system: string;
  type: string;
  faction: string;
  minLevel: number;
  maxLevel: number;
}
