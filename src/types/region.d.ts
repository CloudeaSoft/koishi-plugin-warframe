export interface Region {
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
  nextNodes: any[]; // Assuming an array of potentially various types, using 'any[]' or '[]' for an empty array
}
