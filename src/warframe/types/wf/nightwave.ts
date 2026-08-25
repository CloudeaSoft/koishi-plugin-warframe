export interface RawMongoDate {
  $date?: { $numberLong?: string | number }
}

export interface RawNightwaveActiveChallenge {
  Challenge: string
  Daily?: boolean
  Permanent?: boolean | number | string
  Activation?: RawMongoDate
  Expiry?: RawMongoDate
}

export interface RawSeasonInfo {
  Season: number
  Phase: number
  AffiliationTag: string
  Expiry?: RawMongoDate
  ActiveChallenges: RawNightwaveActiveChallenge[]
}

export type NightwaveChallengeKind = 'daily' | 'weekly' | 'elite' | 'permanent'

export interface NightwaveChallengeInfo {
  name: string
  description: string
  kind: NightwaveChallengeKind
  remaining: string
  standing?: number
}

export interface NightwaveBoard {
  title: string
  season: number
  phase: number
  expiry: number
  remaining: string
  challenges: NightwaveChallengeInfo[]
}
