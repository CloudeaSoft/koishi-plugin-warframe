import type { Arbitration, WarframeResult } from '../../types'

import { dict_zh, ExportRegions } from 'warframe-public-export-plus'

import { arbyRewards } from '../../assets/index'
import { arbitrationSchedule } from '../../data/wf/arbitrationSchedule'
import { regionToShort } from '../../infrastructure/wf/wf-export-adapter'
import { failure } from '../../types/warframe-result'

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
    data: weekArbys
      .filter(a => arbyRewards[a.node])
      .map((a) => {
        const obj = regionToShort(ExportRegions[a.node], dict_zh)
        return {
          ...obj,
          time: new Date(a.time * 1000).toLocaleString('zh-cn', {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            // minute: 'numeric', // 保持注释或删除，以去除分钟
            // second: 'numeric', // 保持注释或删除，以去除秒
            hour12: false, // 统一使用 24 小时制
            // hourCycle: 'h23' // 另一种设置 24 小时制的方法
            timeZone: 'Asia/Shanghai',
          }),
          rewards: arbyRewards[a.node],
        }
      }),
  }
}
