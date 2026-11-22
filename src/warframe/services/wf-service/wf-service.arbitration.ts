import type { Arbitration, ArbitrationShort, WarframeResult } from '../../types'

import { dict_zh, ExportRegions } from 'warframe-public-export-plus'

import { arbyRewards } from '../../assets/index'
import { arbitrationSchedule } from '../../data/wf/arbitrationSchedule'
import { regionToShort } from '../../infrastructure/wf/wf-export-adapter'
import { failure } from '../../types/warframe-result'

function formatArbitrationTime(unixSeconds: number): string {
  return new Date(unixSeconds * 1000).toLocaleString('zh-cn', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    hour12: false,
    timeZone: 'Asia/Shanghai',
  })
}

export function adaptArbitrations(entries: readonly ArbitrationShort[]): Arbitration[] {
  const adapted: Arbitration[] = []
  for (const entry of entries) {
    const region = ExportRegions[entry.node]
    if (!region)
      continue

    const rewards = arbyRewards[entry.node]
    adapted.push({
      ...regionToShort(region, dict_zh),
      time: formatArbitrationTime(entry.time),
      ...(typeof rewards === 'number' ? { rewards } : {}),
    })
  }
  return adapted
}

export function getArbitrations(day: number = 3): WarframeResult<Arbitration[]> {
  if (day > 14 || day <= 0) {
    return failure('arbitration.invalidDayRange')
  }

  const currentHourTimeStamp = Math.floor(
    new Date().setUTCMinutes(0, 0, 0) / 1000,
  )
  const currentHourIndex = arbitrationSchedule.findIndex(
    a => a.time === currentHourTimeStamp,
  )
  const weekArbys = arbitrationSchedule.slice(
    currentHourIndex,
    currentHourIndex + 24 * day,
  )
  return {
    ok: true,
    data: adaptArbitrations(weekArbys),
  }
}
