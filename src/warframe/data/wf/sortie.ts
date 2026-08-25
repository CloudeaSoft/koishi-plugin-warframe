import { dict_zh } from 'warframe-public-export-plus'
import { dictZhExtra } from '../../assets/index'

const MODE_NAME_KEY = '/Lotus/Language/Menu/SortieMissionName'

/** WARFRAME Wiki Sortie mechanics: 50–60 / 65–80 / 80–100 by mission index. */
const SORTIE_ENEMY_LEVELS: Array<{ minLevel: number, maxLevel: number }> = [
  { minLevel: 50, maxLevel: 60 },
  { minLevel: 65, maxLevel: 80 },
  { minLevel: 80, maxLevel: 100 },
]

export function getSortieModeName(): string {
  return dict_zh[MODE_NAME_KEY] ?? dictZhExtra[MODE_NAME_KEY] ?? MODE_NAME_KEY
}

export function getSortieEnemyLevels(index: number): { minLevel: number, maxLevel: number } {
  return SORTIE_ENEMY_LEVELS[index] ?? SORTIE_ENEMY_LEVELS[SORTIE_ENEMY_LEVELS.length - 1]
}
