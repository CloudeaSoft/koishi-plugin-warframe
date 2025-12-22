import { fetchAsyncData } from "../utils";

const wfmApiV1Base = "https://api.warframe.market/v1/";
const wfmApiV2Base = "https://api.warframe.market/v2/";

export const getWFMItemList = async (): Promise<
  WFMResponse<ItemShort[] | null>
> => {
  return await fetchAsyncData<WFMResponse<ItemShort[]>>(`${wfmApiV2Base}items`);
};

export const getWFMOrderList = async (
  itemId: string
): Promise<WFMResponse<OrderWithUser[] | null>> => {
  return await fetchAsyncData<WFMResponse<OrderWithUser[]>>(
    `${wfmApiV2Base}orders/item/${itemId}`
  );
};

export const getWFMRivenItemList = async (): Promise<
  WFMResponse<RivenItem[] | null>
> => {
  return await fetchAsyncData<WFMResponse<RivenItem[]>>(
    `${wfmApiV2Base}riven/weapons`
  );
};

export const getWFMRivenOrderList = async (
  itemId: string
): Promise<WFMResponseV1<Auction<RivenOrder>> | null> => {
  return await fetchAsyncData<WFMResponseV1<Auction<RivenOrder>>>(
    `${wfmApiV1Base}auctions/search?type=riven&sort_by=price_asc&weapon_url_name=${itemId}`
  );
};

export const getWFMRivenAttributeList = async (): Promise<WFMResponse<
  RivenAttribute[]
> | null> => {
  return await fetchAsyncData<WFMResponse<RivenAttribute[]>>(
    `${wfmApiV2Base}riven/attributes`
  );
};

export const getWFMDucatnator = async (): Promise<
  WFMResponseV1<{ previous_day: Ducatnator[]; previous_hour: Ducatnator[] }>
> => {
  return await fetchAsyncData<
    WFMResponseV1<{ previous_day: Ducatnator[]; previous_hour: Ducatnator[] }>
  >(`${wfmApiV1Base}tools/ducats`);
};
