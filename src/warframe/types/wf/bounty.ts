export type BountyLocation
  = | 'cetus'
    | 'fortuna'
    | 'deimos'
    | 'zariman'
    | 'cavia'
    | 'hex'

/** 掉落稀有度：probability 同阶段内最高→铜，中间→银，最低→金 */
export type BountyRewardRarity = 'bronze' | 'silver' | 'gold'

export type BountyStandingUnit = 'standing' | 'vq'

export interface RawSyndicateJob {
  jobType?: string
  rewards: string
  masteryReq?: number
  minEnemyLevel: number
  maxEnemyLevel: number
  xpAmounts: number[]
  isVault?: boolean
  locationTag?: string
}

export interface RawSyndicateMission {
  Tag: string
  Activation?: { $date?: { $numberLong?: string } }
  Expiry?: { $date?: { $numberLong?: string } }
  Jobs?: RawSyndicateJob[]
}

/** browse.wf Oracle `/bounty-cycle` response */
export interface OracleBountyEntry {
  node: string
  challenge: string
  ally?: string
}

export interface OracleBountyCycle {
  expiry: number
  rot: string
  vaultRot: string
  zarimanFaction: string
  bounties: Record<string, OracleBountyEntry[]>
}

export interface BountyReward {
  name: string
  rarity: BountyRewardRarity
}

export interface BountyJob {
  name: string
  enemyLevels: [number, number]
  standingStages: number[]
  minMR: number
  isVault?: boolean
  locationTag?: string
  isNarmer?: boolean
  /** 各阶段奖励池（对应 ExportRewards 的各层）；Oracle 赏金无此信息 */
  stages: BountyReward[][]
  /** Oracle 挑战描述 */
  challenge?: string
  /** Hex 盟友显示名 */
  ally?: string
  /** 声望单位：扎里曼为虚空余烬(VQ) */
  standingUnit?: BountyStandingUnit
}

export interface BountyBoard {
  location: BountyLocation
  title: string
  expiry: number
  jobs: BountyJob[]
  /** worldstate Jobs vs browse.wf Oracle */
  source?: 'worldstate' | 'oracle'
  rotation?: string
  vaultRotation?: string
  zarimanFaction?: string
}
