import type {
  RawSteelPathOfferings,
  SteelEssenceBoard,
  SteelEssenceOfferingInfo,
  WarframeResult,
} from '../../types'

import { dict_zh } from 'warframe-public-export-plus'

import { dictZhExtra } from '../../assets/index'
import { globalWorldState } from '../../data/wf/globalWorldState'
import { getSteelPathCatalogs } from '../../infrastructure/wf/wfcd-adapter'
import { failure } from '../../types/warframe-result'
import { msToHumanReadable } from '../../utils'

const STEEL_ESSENCE_TESHIN_KEY = '/Lotus/Language/Bosses/Teshin'
const STEEL_ESSENCE_KEY = '/Lotus/Language/Resources/SteelEssence'
const STEEL_ESSENCE_EPOCH_MS = Date.parse('2020-11-16T00:00:00.000Z')
const STEEL_ESSENCE_WEEK_SECONDS = 604800

function steelEssenceWeekExpiryUtc(now: number): number {
  const date = new Date(now)
  const offset = date.getUTCDay() === 0 ? 6 : date.getUTCDay() - 1
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() - offset + 6,
    23,
    59,
    59,
    0,
  )
}

function steelEssenceRotationIndex(now: number, length: number): number {
  if (length <= 0) {
    return 0
  }
  const elapsed = Math.max(0, now - STEEL_ESSENCE_EPOCH_MS) / 1000
  return Math.floor(
    (elapsed % (length * STEEL_ESSENCE_WEEK_SECONDS)) / STEEL_ESSENCE_WEEK_SECONDS,
  )
}

export async function adaptSteelEssence(
  raw: RawSteelPathOfferings = {},
  now: number = Date.now(),
): Promise<SteelEssenceBoard> {
  const catalogs = await getSteelPathCatalogs()
  const rotationZh = catalogs.zh.rotation
  const rotationEn = catalogs.en.rotation
  const currentName = raw.currentReward?.name ?? ''

  let index = rotationEn.findIndex(item => item.name === currentName)
  if (index < 0) {
    index = rotationZh.findIndex(item => item.name === currentName)
  }
  if (index < 0) {
    index = steelEssenceRotationIndex(now, rotationZh.length)
  }

  const current: SteelEssenceOfferingInfo = rotationZh[index] ?? {
    name: currentName,
    cost: raw.currentReward?.cost ?? 0,
  }
  const upcoming: SteelEssenceOfferingInfo[] = rotationZh.length > 1
    ? rotationZh
        .map((_, offset) => rotationZh[(index + offset + 1) % rotationZh.length])
        .filter((item): item is SteelEssenceOfferingInfo => item !== undefined)
        .slice(0, rotationZh.length - 1)
    : []

  const expiry = raw.expiry?.getTime() ?? steelEssenceWeekExpiryUtc(now)
  const teshin = dict_zh[STEEL_ESSENCE_TESHIN_KEY]
    ?? dictZhExtra[STEEL_ESSENCE_TESHIN_KEY]
    ?? STEEL_ESSENCE_TESHIN_KEY
  const essence = dict_zh[STEEL_ESSENCE_KEY]
    ?? dictZhExtra[STEEL_ESSENCE_KEY]
    ?? STEEL_ESSENCE_KEY

  return {
    title: `${teshin} · ${essence}商店`,
    costLabel: essence,
    remaining: msToHumanReadable(expiry - now),
    expiry,
    current,
    upcoming,
  }
}

export async function getSteelEssenceFrom(
  snapshot?: { raw?: { steelPath?: RawSteelPathOfferings } },
  now: number = Date.now(),
): Promise<WarframeResult<SteelEssenceBoard>> {
  if (!snapshot?.raw) {
    return failure('common.fetchFailed', true)
  }

  const offerings = snapshot.raw.steelPath
  if (!offerings) {
    return failure('steelEssence.unavailable')
  }

  const data = await adaptSteelEssence(offerings, now)
  if (!data.current.name || data.expiry <= now) {
    return failure('steelEssence.unavailable')
  }

  return { ok: true, data }
}

export async function getSteelEssence(): Promise<WarframeResult<SteelEssenceBoard>> {
  try {
    return await getSteelEssenceFrom(await globalWorldState.get())
  }
  catch {
    return failure('common.fetchFailed', true)
  }
}
