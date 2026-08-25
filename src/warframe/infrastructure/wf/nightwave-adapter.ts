import type {
  NightwaveBoard,
  NightwaveChallengeInfo,
  NightwaveChallengeKind,
  RawMongoDate,
  RawNightwaveActiveChallenge,
  RawSeasonInfo,
} from '../../types'
import {
  dict_zh,
  ExportNightwave,
  ExportSyndicates,
} from 'warframe-public-export-plus'
import { dictZhExtra } from '../../assets/index'
import { msToHumanReadable } from '../../utils'

const RADIO_LEGION_TITLE_KEY = '/Lotus/Language/Syndicates/RadioLegionTitle'

function timestampMs(value?: RawMongoDate): number {
  const raw = value?.$date?.$numberLong
  if (raw === undefined || raw === '') {
    return 0
  }
  const ms = Number(raw)
  return Number.isFinite(ms) ? ms : 0
}

function remainingLabel(expiry: number, now: number): string {
  return msToHumanReadable(Math.max(expiry - now, 0))
}

function translate(key: string): string {
  return dict_zh[key] ?? dictZhExtra[key] ?? key
}

function seasonTitle(affiliationTag: string): string {
  const syndicate = ExportSyndicates[affiliationTag]
  if (syndicate?.name) {
    return translate(syndicate.name)
  }
  return translate(RADIO_LEGION_TITLE_KEY)
}

function classifyChallenge(
  path: string,
  raw: RawNightwaveActiveChallenge,
): NightwaveChallengeKind {
  if (raw.Daily || path.includes('/Daily/')) {
    return 'daily'
  }
  if (raw.Permanent || /permanent/i.test(path)) {
    return 'permanent'
  }
  if (/hard/i.test(path)) {
    return 'elite'
  }
  return 'weekly'
}

function challengeFallbackName(path: string): string {
  return path.split('/').pop() ?? path
}

function adaptChallenge(
  raw: RawNightwaveActiveChallenge,
  now: number,
): NightwaveChallengeInfo | undefined {
  const path = raw.Challenge
  if (!path) {
    return undefined
  }

  const expiry = timestampMs(raw.Expiry)
  if (expiry <= now) {
    return undefined
  }

  const kind = classifyChallenge(path, raw)
  const remaining = remainingLabel(expiry, now)
  const exported = ExportNightwave.challenges[path]
  if (!exported) {
    return {
      name: challengeFallbackName(path),
      description: '',
      kind,
      remaining,
    }
  }

  const description = translate(exported.description)
    .split('|COUNT|')
    .join(String(exported.required))

  return {
    name: translate(exported.name),
    description,
    kind,
    remaining,
    standing: exported.standing,
  }
}

export function adaptNightwave(raw: RawSeasonInfo, now: number = Date.now()): NightwaveBoard {
  const expiry = timestampMs(raw.Expiry)
  const challenges: NightwaveChallengeInfo[] = []

  for (const entry of raw.ActiveChallenges) {
    const adapted = adaptChallenge(entry, now)
    if (adapted) {
      challenges.push(adapted)
    }
  }

  return {
    title: seasonTitle(raw.AffiliationTag),
    season: raw.Season,
    phase: raw.Phase,
    expiry,
    remaining: remainingLabel(expiry, now),
    challenges,
  }
}
