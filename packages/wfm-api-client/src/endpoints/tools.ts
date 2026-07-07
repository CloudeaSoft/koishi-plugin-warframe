import type {
  Ducatnator,
  WfmCacheOptions,
  WFMResponseV1,
} from '../types'

const wfmApiV1Base = 'https://api.warframe.market/v1/'

type WfmGet = <T>(url: string, ttl: number) => Promise<T | undefined>

export function createToolEndpoints(
  get: WfmGet,
  cacheOptions: WfmCacheOptions | undefined,
) {
  return {
    getDucatnator: async () => {
      const response = await get<WFMResponseV1<{
        previous_day: Ducatnator[]
        previous_hour: Ducatnator[]
      }>>(
        `${wfmApiV1Base}tools/ducats`,
        cacheOptions?.ducatnatorTtl ?? 0,
      )

      if (!response?.payload)
        return undefined

      return {
        day: response.payload.previous_day,
        hour: response.payload.previous_hour,
      }
    },
  }
}
