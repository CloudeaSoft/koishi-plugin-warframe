import { Ducatnator } from "../../types/wfm/ducatnator";
import { ItemShort, RivenItem } from "../../types/wfm/item";
import { OrderWithUser } from "../../types/wfm/order";
import { RivenAttribute, RivenOrder } from "../../types/wfm/riven";
import { fetchAsyncData } from "../../utils";
import { DucatnatorDTO } from "./dto/ducats.dto";
import { ItemShortDTO, RivenItemDTO } from "./dto/item.dto";
import { OrderWithUserDTO } from "./dto/order.dto";
import { RivenAttributeDTO, RivenOrderDTO } from "./dto/riven.dto";

const wfmApiV1Base = "https://api.warframe.market/v1/";
const wfmApiV2Base = "https://api.warframe.market/v2/";

export const getWFMItemList = async (): Promise<ItemShort[]> => {
  const response = await fetchAsyncData<WFMResponse<ItemShortDTO[]>>(
    `${wfmApiV2Base}items`
  );

  return response?.data;
};

export const getWFMOrderList = async (
  itemId: string
): Promise<OrderWithUser[]> => {
  const response = await fetchAsyncData<WFMResponse<OrderWithUserDTO[]>>(
    `${wfmApiV2Base}orders/item/${itemId}`
  );

  return response?.data;
};

export const getWFMRivenItemList = async (): Promise<RivenItem[]> => {
  const response = await fetchAsyncData<WFMResponse<RivenItemDTO[]>>(
    `${wfmApiV2Base}riven/weapons`
  );

  return response?.data;
};

export const getWFMRivenOrderList = async (
  itemId: string
): Promise<RivenOrder[]> => {
  const response = await fetchAsyncData<WFMResponseV1<Auction<RivenOrderDTO>>>(
    `${wfmApiV1Base}auctions/search?type=riven&sort_by=price_asc&weapon_url_name=${itemId}`
  );

  return response?.payload.auctions;
};

export const getWFMRivenAttributeList = async (): Promise<RivenAttribute[]> => {
  const response = await fetchAsyncData<WFMResponse<RivenAttributeDTO[]>>(
    `${wfmApiV2Base}riven/attributes`
  );

  return response.data;
};

export const getWFMDucatnator = async (): Promise<{
  day: Ducatnator[];
  hour: Ducatnator[];
}> => {
  const response = await fetchAsyncData<
    WFMResponseV1<{
      previous_day: DucatnatorDTO[];
      previous_hour: DucatnatorDTO[];
    }>
  >(`${wfmApiV1Base}tools/ducats`);

  if (!response || !response.payload) {
    return undefined;
  }

  const day = response.payload.previous_day.map((e) => {
    return e as Ducatnator;
  });

  const hour = response.payload.previous_hour.map((e) => {
    return e as Ducatnator;
  });

  return {
    day,
    hour,
  };
};
