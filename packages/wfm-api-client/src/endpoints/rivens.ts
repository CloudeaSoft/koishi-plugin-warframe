import type {
  Auction,
  RivenAttribute,
  RivenItem,
  RivenOrder,
  WfmCacheOptions,
  WFMResponse,
  WFMResponseV1,
} from '../types'

const wfmApiV1Base = 'https://api.warframe.market/v1/'
const wfmApiV2Base = 'https://api.warframe.market/v2/'

type WfmGet = <T>(url: string, ttl: number) => Promise<T | undefined>

export function createRivenEndpoints(
  get: WfmGet,
  cacheOptions: WfmCacheOptions | undefined,
) {
  return {
    getItems: async () => {
      const response = await get<WFMResponse<RivenItem[]>>(
        `${wfmApiV2Base}riven/weapons`,
        cacheOptions?.rivenItemListTtl ?? 0,
      )
      return response?.data
    },
    getOrders: async (itemId: string) => {
      const response = await get<WFMResponseV1<Auction<RivenOrder>>>(
        `${wfmApiV1Base}auctions/search?type=riven&sort_by=price_asc&weapon_url_name=${itemId}`,
        cacheOptions?.rivenOrderListTtl ?? 0,
      )
      return response?.payload?.auctions
    },
    getAttributes: async () => {
      const response = await get<WFMResponse<RivenAttribute[]>>(
        `${wfmApiV2Base}riven/attributes`,
        cacheOptions?.rivenAttributeListTtl ?? 0,
      )
      return response?.data
    },
  }
}
