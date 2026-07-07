import type {
  ItemShort,
  OrderWithUser,
  StatisticsCollection,
  WfmCacheOptions,
  WFMResponse,
  WFMResponseV1,
} from '../types'

const wfmApiV1Base = 'https://api.warframe.market/v1/'
const wfmApiV2Base = 'https://api.warframe.market/v2/'

type WfmGet = <T>(url: string, ttl: number) => Promise<T | undefined>

export function createItemEndpoints(
  get: WfmGet,
  cacheOptions: WfmCacheOptions | undefined,
) {
  return {
    getList: async () => {
      const response = await get<WFMResponse<ItemShort[]>>(
        `${wfmApiV2Base}items`,
        cacheOptions?.itemListTtl ?? 0,
      )
      return response?.data
    },
    getStatistics: async (itemId: string) => {
      const response = await get<WFMResponseV1<StatisticsCollection>>(
        `${wfmApiV1Base}items/${itemId}/statistics`,
        cacheOptions?.statisticsTtl ?? 0,
      )
      return response?.payload
    },
    getOrders: async (itemId: string) => {
      const response = await get<WFMResponse<OrderWithUser[]>>(
        `${wfmApiV2Base}orders/item/${itemId}`,
        cacheOptions?.orderListTtl ?? 0,
      )
      return response?.data
    },
  }
}
