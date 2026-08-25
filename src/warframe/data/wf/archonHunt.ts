import { dict_zh } from 'warframe-public-export-plus'
import { dictZhExtra } from '../../assets/index'

const MODE_NAME_KEY = '/Lotus/Language/WorldStateWindow/LiteSortieMissionName'

const HUNT_ENEMY_LEVELS: Array<{ minLevel: number, maxLevel: number }> = [
  { minLevel: 130, maxLevel: 135 },
  { minLevel: 135, maxLevel: 140 },
  { minLevel: 145, maxLevel: 150 },
]

export function getArchonHuntModeName(): string {
  return dict_zh[MODE_NAME_KEY] ?? dictZhExtra[MODE_NAME_KEY] ?? MODE_NAME_KEY
}

export function getArchonHuntEnemyLevels(index: number): { minLevel: number, maxLevel: number } {
  return HUNT_ENEMY_LEVELS[index] ?? HUNT_ENEMY_LEVELS[HUNT_ENEMY_LEVELS.length - 1]
}
