import type {
  BountyBoard,
  BountyJob,
  BountyLocation,
  BountyReward,
  BountyRewardRarity,
  OracleBountyCycle,
  OracleBountyEntry,
  RawSyndicateJob,
  RawSyndicateMission,
} from '../../types'
import {
  dict_zh,
  ExportArcanes,
  ExportBoosterPacks,
  ExportBounties,
  ExportBundles,
  ExportChallenges,
  ExportCustoms,
  ExportFlavour,
  ExportFusionBundles,
  ExportGear,
  ExportKeys,
  ExportRecipes,
  ExportRegions,
  ExportRelics,
  ExportResources,
  ExportRewards,
  ExportSyndicates,
  ExportUpgrades,
  ExportVirtuals,
  ExportWarframes,
  ExportWeapons,
} from 'warframe-public-export-plus'
import { toPascalCase } from '../../utils'
import { relicEraToTransKey } from './wf-export-adapter'

export const bountyLocationTag: Record<BountyLocation, string> = {
  cetus: 'CetusSyndicate',
  fortuna: 'SolarisSyndicate',
  deimos: 'EntratiSyndicate',
  zariman: 'ZarimanSyndicate',
  cavia: 'EntratiLabSyndicate',
  hex: 'HexSyndicate',
}

/** Locations whose Jobs are empty in official WorldState; use browse.wf Oracle. */
export const oracleBountyLocations = new Set<BountyLocation>([
  'zariman',
  'cavia',
  'hex',
])

const locationFallbackTitle: Record<BountyLocation, string> = {
  cetus: '希图斯赏金',
  fortuna: '福尔图娜赏金',
  deimos: '火卫二赏金',
  zariman: '坚守者赏金',
  cavia: '科维兽赏金',
  hex: '六人组赏金',
}

/** Hex special nodes: mission type equals node name in Chinese; skip suffix. */
const hexNodesWithoutMissionSuffix = new Set([
  'SolNode850',
  'SolNode853',
  'SolNode854',
  'SolNode856',
])

const hexAllyNames: Record<string, string> = {
  '/Lotus/Types/Gameplay/1999Wf/ProtoframeAllies/AmirAllyAgent': 'Amir',
  '/Lotus/Types/Gameplay/1999Wf/ProtoframeAllies/AoiAllyAgent': 'Aoi',
  '/Lotus/Types/Gameplay/1999Wf/ProtoframeAllies/ArthurAllyAgent': 'Arthur',
  '/Lotus/Types/Gameplay/1999Wf/ProtoframeAllies/EleanorAllyAgent': 'Eleanor',
  '/Lotus/Types/Gameplay/1999Wf/ProtoframeAllies/LettieAllyAgent': 'Lettie',
  '/Lotus/Types/Gameplay/1999Wf/ProtoframeAllies/QuincyAllyAgent': 'Quincy',
}

/** Static tier tables from browse.wf live.php + ExportRewards decks (Oracle omits both). */
const oracleTierTables: Record<
  'zariman' | 'cavia' | 'hex',
  { levels: [number, number], standing: number[], rewards: string }[]
> = {
  zariman: [
    {
      levels: [50, 55],
      standing: [1, 2],
      rewards: '/Lotus/Types/Game/MissionDecks/ZarimanJobMissionRewards/TierATableRewards',
    },
    {
      levels: [60, 65],
      standing: [2, 3],
      rewards: '/Lotus/Types/Game/MissionDecks/ZarimanJobMissionRewards/TierBTableRewards',
    },
    {
      levels: [70, 75],
      standing: [3, 5],
      rewards: '/Lotus/Types/Game/MissionDecks/ZarimanJobMissionRewards/TierCTableARewards',
    },
    {
      levels: [90, 95],
      standing: [4, 6],
      rewards: '/Lotus/Types/Game/MissionDecks/ZarimanJobMissionRewards/TierDTableRewards',
    },
    {
      levels: [110, 115],
      standing: [5, 8],
      rewards: '/Lotus/Types/Game/MissionDecks/ZarimanJobMissionRewards/TierETableRewards',
    },
  ],
  cavia: [
    {
      levels: [55, 60],
      standing: [1000, 1500],
      rewards: '/Lotus/Types/Game/MissionDecks/EntratiLabJobMissionReward/TierATableRewards',
    },
    {
      levels: [65, 70],
      standing: [2000, 3000],
      rewards: '/Lotus/Types/Game/MissionDecks/EntratiLabJobMissionReward/TierBTableRewards',
    },
    {
      levels: [75, 80],
      standing: [3000, 4500],
      rewards: '/Lotus/Types/Game/MissionDecks/EntratiLabJobMissionReward/TierCTableRewards',
    },
    {
      levels: [95, 100],
      standing: [4000, 6000],
      rewards: '/Lotus/Types/Game/MissionDecks/EntratiLabJobMissionReward/TierDTableRewards',
    },
    {
      levels: [115, 120],
      standing: [5000, 7500],
      rewards: '/Lotus/Types/Game/MissionDecks/EntratiLabJobMissionReward/TierETableRewards',
    },
  ],
  hex: [
    {
      levels: [65, 70],
      standing: [1000, 1500],
      rewards: '/Lotus/Types/Game/MissionDecks/1999MissionRewards/TierABountyRewards',
    },
    {
      levels: [75, 80],
      standing: [2000, 3000],
      rewards: '/Lotus/Types/Game/MissionDecks/1999MissionRewards/TierBBountyRewards',
    },
    {
      levels: [85, 90],
      standing: [3000, 4500],
      rewards: '/Lotus/Types/Game/MissionDecks/1999MissionRewards/TierCBountyRewards',
    },
    {
      levels: [95, 100],
      standing: [4000, 6000],
      rewards: '/Lotus/Types/Game/MissionDecks/1999MissionRewards/TierDBountyRewards',
    },
    {
      levels: [105, 110],
      standing: [5000, 7500],
      rewards: '/Lotus/Types/Game/MissionDecks/1999MissionRewards/TierEBountyRewards',
    },
    {
      levels: [115, 120],
      standing: [6000, 9000],
      rewards: '/Lotus/Types/Game/MissionDecks/1999MissionRewards/TierFBountyRewards',
    },
    {
      levels: [125, 130],
      standing: [7500, 11250],
      rewards: '/Lotus/Types/Game/MissionDecks/1999MissionRewards/InfestedLichBountyRewards',
    },
  ],
}

function mongoDateMs(value?: { $date?: { $numberLong?: string } }): number {
  const raw = value?.$date?.$numberLong
  return raw ? Number(raw) : 0
}

/**
 * Map drop probability to 铜/银/金 within one stage.
 * Highest unique probability → bronze, lowest → gold, middle → silver.
 * With only two buckets: highest → bronze, lower → silver.
 */
export function rarityFromStageProbabilities(
  probability: number,
  uniqueSortedDesc: number[],
): BountyRewardRarity {
  if (uniqueSortedDesc.length <= 1) {
    return 'bronze'
  }

  const idx = uniqueSortedDesc.indexOf(probability)
  if (idx <= 0) {
    return 'bronze'
  }
  if (uniqueSortedDesc.length === 2) {
    return 'silver'
  }
  if (idx === uniqueSortedDesc.length - 1) {
    return 'gold'
  }
  return 'silver'
}

const blueprintNameCache = new Map<string, string | null>()

/**
 * Fallback for *Blueprint paths: look up dict_zh keys ending with `${base}Name`
 * where base is the leaf with trailing "Blueprint" removed.
 * Matching is case-insensitive (InfWarFanBlueprint → InfWarfanName).
 */
function resolveBlueprintNameViaDictZh(pathLeaf: string): string | undefined {
  if (!/Blueprint$/i.test(pathLeaf)) {
    return undefined
  }

  const base = pathLeaf.replace(/Blueprint$/i, '')
  if (!base) {
    return undefined
  }

  if (blueprintNameCache.has(base)) {
    return blueprintNameCache.get(base) ?? undefined
  }

  const needle = `${base}Name`.toLowerCase()
  let translated: string | undefined
  for (const key of Object.keys(dict_zh)) {
    if (!key.toLowerCase().endsWith(needle)) {
      continue
    }
    const boundary = key.length - needle.length
    if (boundary === 0 || key[boundary - 1] === '/' || key[boundary - 1] === '_') {
      translated = dict_zh[key]
      break
    }
  }

  if (!translated) {
    blueprintNameCache.set(base, null)
    return undefined
  }

  const withBlueprint = translated.includes('蓝图') ? translated : `${translated} 蓝图`
  blueprintNameCache.set(base, withBlueprint)
  return withBlueprint
}

export function resolveExportItemNameZh(sourceKey: string): string {
  const creditMatch = sourceKey.match(/\/(\d+)Credits(?:$|\?)/)
  if (creditMatch) {
    return `${creditMatch[1]} 现金`
  }

  const fixedKey = sourceKey.replace('/StoreItems', '')

  const flavour = ExportFlavour[fixedKey]
  if (flavour?.name) {
    return dict_zh[flavour.name] ?? flavour.name
  }

  const weapon = ExportWeapons[fixedKey]
  if (weapon?.name) {
    return dict_zh[weapon.name] ?? weapon.name
  }

  const mod = ExportUpgrades[fixedKey]
  if (mod?.name) {
    return dict_zh[mod.name] ?? mod.name
  }

  const arcane = ExportArcanes[fixedKey]
  if (arcane?.name) {
    return dict_zh[arcane.name] ?? arcane.name
  }

  const fusion = ExportFusionBundles[fixedKey]
  if (fusion?.name) {
    return dict_zh[fusion.name] ?? fusion.name
  }

  const relic = ExportRelics[fixedKey]
  if (relic) {
    const era = dict_zh[relicEraToTransKey(relic.era)] ?? toPascalCase(relic.era)
    return `${era} ${relic.category} 遗物`
  }

  const skin = ExportCustoms[fixedKey]
  if (skin?.name) {
    return dict_zh[skin.name] ?? skin.name
  }

  const recipe = ExportRecipes[fixedKey]
  if (recipe?.resultType) {
    const recipeResult
      = ExportKeys[recipe.resultType]
        ?? ExportResources[recipe.resultType]
        ?? ExportWeapons[recipe.resultType]
        ?? ExportWarframes[recipe.resultType]
    if (recipeResult?.name) {
      const translated = dict_zh[recipeResult.name] ?? recipeResult.name
      return translated.includes('蓝图') ? translated : `${translated} 蓝图`
    }
  }

  const virtual = ExportVirtuals[fixedKey]
  if (virtual?.name) {
    return dict_zh[virtual.name] ?? virtual.name
  }

  const resource = ExportResources[fixedKey]
  if (resource?.name) {
    return dict_zh[resource.name] ?? resource.name
  }

  const gear = ExportGear[fixedKey]
  if (gear?.name) {
    return dict_zh[gear.name] ?? gear.name
  }

  const bundle = ExportBundles[sourceKey] ?? ExportBundles[fixedKey]
  if (bundle?.name) {
    return dict_zh[bundle.name] ?? bundle.name
  }

  const boosterPack = ExportBoosterPacks[fixedKey]
  if (boosterPack?.name) {
    return dict_zh[boosterPack.name] ?? boosterPack.name
  }

  const pathLeaf = fixedKey.split('/').pop() ?? sourceKey
  return resolveBlueprintNameViaDictZh(pathLeaf) ?? pathLeaf
}

function rewardsFromDeck(rewardsKey: string): BountyReward[][] {
  const deck = ExportRewards[rewardsKey]
  if (!deck?.length) {
    return []
  }

  return deck.map((tier) => {
    const uniqueSortedDesc = [...new Set(
      tier
        .map(reward => reward.probability)
        .filter((value): value is number => typeof value === 'number'),
    )].sort((a, b) => b - a)

    const seen = new Set<string>()
    const rewards: BountyReward[] = []
    for (const reward of tier) {
      const name = resolveExportItemNameZh(reward.type)
      const rarity = rarityFromStageProbabilities(
        reward.probability ?? uniqueSortedDesc[0] ?? 0,
        uniqueSortedDesc,
      )
      const key = `${rarity}:${name}`
      if (seen.has(key)) {
        continue
      }
      seen.add(key)
      rewards.push({ name, rarity })
    }
    return rewards
  })
}

function jobName(job: RawSyndicateJob): string {
  if (job.isVault) {
    const chamber = (job.locationTag || '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
      .trim()
    return chamber ? `隔离库 ${chamber}` : '隔离库'
  }

  if (job.jobType) {
    const bounty = ExportBounties[job.jobType]
    if (bounty?.name) {
      return dict_zh[bounty.name] ?? bounty.name
    }
    return job.jobType.split('/').pop() ?? '未知赏金'
  }

  return '未知赏金'
}

function boardTitle(location: BountyLocation, tag: string): string {
  const syndicate = ExportSyndicates[tag]
  if (syndicate?.name) {
    const name = dict_zh[syndicate.name] ?? syndicate.name
    return name.endsWith('赏金') ? name : `${name}赏金`
  }
  return locationFallbackTitle[location]
}

function adaptJob(job: RawSyndicateJob): BountyJob {
  return {
    name: jobName(job),
    enemyLevels: [job.minEnemyLevel, job.maxEnemyLevel],
    standingStages: job.xpAmounts ?? [],
    minMR: job.masteryReq ?? 0,
    ...(job.isVault ? { isVault: true } : {}),
    ...(job.locationTag ? { locationTag: job.locationTag } : {}),
    ...(job.jobType?.includes('Narmer') ? { isNarmer: true } : {}),
    stages: rewardsFromDeck(job.rewards),
  }
}

export function adaptBountyBoard(
  location: BountyLocation,
  mission: RawSyndicateMission | undefined,
): BountyBoard | undefined {
  if (!mission?.Jobs?.length) {
    return undefined
  }

  return {
    location,
    title: boardTitle(location, mission.Tag),
    expiry: mongoDateMs(mission.Expiry),
    jobs: mission.Jobs.map(adaptJob),
  }
}

export function findRawSyndicateMission(
  missions: RawSyndicateMission[],
  location: BountyLocation,
): RawSyndicateMission | undefined {
  const tag = bountyLocationTag[location]
  return missions.find(mission => mission.Tag === tag)
}

function formatOracleMission(nodeKey: string): string {
  const region = ExportRegions[nodeKey]
  if (!region?.name) {
    return nodeKey
  }

  const name = dict_zh[region.name] ?? region.name
  if (hexNodesWithoutMissionSuffix.has(nodeKey) || !region.missionName) {
    return name
  }

  const mission = dict_zh[region.missionName] ?? region.missionName
  if (!mission || mission === name) {
    return name
  }
  return `${name}（${mission}）`
}

export function formatOracleChallenge(challengePath: string): string {
  const challenge = ExportChallenges[challengePath]
  if (!challenge?.description) {
    return challengePath.split('/').pop() ?? challengePath
  }

  const raw = dict_zh[challenge.description] ?? challenge.description
  const lastLine = raw.split(/\r?\n/).pop() ?? raw
  return lastLine
    .split('|COUNT|')
    .join(String(challenge.requiredCount ?? 0))
}

function zarimanFactionZh(faction: string): string | undefined {
  if (faction === 'FC_GRINEER') {
    return dict_zh['/Lotus/Language/Game/Faction_GrineerUC'] ?? 'Grineer'
  }
  if (faction === 'FC_CORPUS') {
    return dict_zh['/Lotus/Language/Game/Faction_CorpusUC'] ?? 'Corpus'
  }
  return undefined
}

function adaptOracleJob(
  location: 'zariman' | 'cavia' | 'hex',
  entry: OracleBountyEntry,
  index: number,
): BountyJob {
  const tiers = oracleTierTables[location]
  const tier = tiers[Math.min(index, tiers.length - 1)]
  const ally = entry.ally ? hexAllyNames[entry.ally] : undefined

  return {
    name: formatOracleMission(entry.node),
    enemyLevels: tier.levels,
    standingStages: tier.standing,
    minMR: 0,
    stages: rewardsFromDeck(tier.rewards),
    challenge: formatOracleChallenge(entry.challenge),
    ...(ally ? { ally } : {}),
    ...(location === 'zariman' ? { standingUnit: 'vq' as const } : {}),
  }
}

export function adaptOracleBountyBoard(
  location: 'zariman' | 'cavia' | 'hex',
  cycle: OracleBountyCycle | undefined,
): BountyBoard | undefined {
  if (!cycle) {
    return undefined
  }

  const tag = bountyLocationTag[location]
  const entries = cycle.bounties?.[tag]
  if (!entries?.length) {
    return undefined
  }

  return {
    location,
    title: boardTitle(location, tag),
    expiry: cycle.expiry,
    jobs: entries.map((entry, index) => adaptOracleJob(location, entry, index)),
    source: 'oracle',
    rotation: cycle.rot,
    vaultRotation: cycle.vaultRot,
    ...(location === 'zariman'
      ? { zarimanFaction: zarimanFactionZh(cycle.zarimanFaction) }
      : {}),
  }
}
